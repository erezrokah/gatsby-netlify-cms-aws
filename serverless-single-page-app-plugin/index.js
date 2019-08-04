const readline = require('readline');
const { spawn } = require('child_process');

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {
      syncToS3: {
        usage: 'Deploys the `app` directory to your bucket',
        lifecycleEvents: ['sync'],
      },
      setCacheControl: {
        usage: 'Set cache control',
        lifecycleEvents: ['setCacheControl'],
      },
      domainInfo: {
        usage: 'Fetches and prints out the deployed CloudFront domain names',
        lifecycleEvents: ['domainInfo'],
      },
      invalidateCloudFrontCache: {
        usage: 'Invalidates CloudFront cache',
        lifecycleEvents: ['invalidateCache'],
      },
      publishSite: {
        usage: 'Runs syncToS3 and invalidateCloudFrontCache',
        lifecycleEvents: ['publishSite'],
      },
    };

    this.hooks = {
      'syncToS3:sync': this.syncDirectory.bind(this),
      'setCacheControl:setCacheControl': this.setCacheControl.bind(this),
      'domainInfo:domainInfo': this.domainInfo.bind(this),
      'invalidateCloudFrontCache:invalidateCache': this.invalidateCache.bind(
        this,
      ),
      'publishSite:publishSite': this.publishSite.bind(this),
    };
  }

  async runSpawnCommand(command, args) {
    const promise = new Promise(resolve => {
      const proc = spawn(command, args);

      const stdout = readline.createInterface({
        input: proc.stdout,
        terminal: false,
      });

      const stderr = readline.createInterface({
        input: proc.stderr,
        terminal: false,
      });

      stdout.on('line', line => {
        this.serverless.cli.log(line);
      });

      stderr.on('line', line => {
        this.serverless.cli.log(line);
      });

      proc.on('close', code => {
        resolve(code);
      });
    });

    return promise;
  }

  async runAwsCommand(args) {
    const exitCode = await this.runSpawnCommand('aws', args);

    return exitCode;
  }

  // syncs the `app` directory to the provided bucket
  async syncDirectory() {
    const {
      s3Bucket,
      buildDirectory,
    } = this.serverless.variables.service.custom;
    const args = [
      's3',
      'sync',
      buildDirectory,
      `s3://${s3Bucket}/`,
      '--delete',
    ];
    this.serverless.cli.log('Syncing S3 bucket');
    const exitCode = await this.runAwsCommand(args);
    if (!exitCode) {
      this.serverless.cli.log('Successfully synced S3 bucket');
    } else {
      throw new Error('Failed syncing S3 bucket');
    }
  }

  async setCacheControlExtensions() {
    const {
      s3Bucket,
      bucketCacheControl,
    } = this.serverless.variables.service.custom;
    const { extensions, cacheControl } = bucketCacheControl;

    const toCacheExtensions = extensions.map(ext => ['--include', `*.${ext}`]);
    const merged = [].concat.apply([], toCacheExtensions);
    const args = [
      's3',
      'cp',
      `s3://${s3Bucket}/`,
      `s3://${s3Bucket}/`,
      '--metadata-directive',
      'REPLACE',
      '--exclude',
      '*',
      ...merged,
      '--recursive',
      '--cache-control',
      cacheControl,
    ];
    this.serverless.cli.log('Setting cache control for extensions');
    const exitCode = await this.runAwsCommand(args);
    if (!exitCode) {
      this.serverless.cli.log('Successfully set cache control for extensions');
    } else {
      throw new Error('Failed setting cache control for extensions');
    }
  }

  async setCacheControlFiles() {
    const {
      s3Bucket,
      bucketCacheControl,
    } = this.serverless.variables.service.custom;
    const { files } = bucketCacheControl;

    const allArgs = files.map(({ key, cacheControl }) => {
      const args = [
        's3',
        'cp',
        `s3://${s3Bucket}/`,
        `s3://${s3Bucket}/`,
        '--metadata-directive',
        'REPLACE',
        '--exclude',
        '*',
        '--include',
        key,
        '--recursive',
        '--cache-control',
        cacheControl,
      ];
      return args;
    });

    this.serverless.cli.log('Setting cache control for files');
    const exitCodes = await Promise.all(
      allArgs.map(args => this.runAwsCommand(args)),
    );
    if (exitCodes.every(exitCode => !exitCode)) {
      this.serverless.cli.log('Successfully set cache control for files');
    } else {
      throw new Error('Failed setting cache control for files');
    }
  }

  async setCacheControl() {
    await this.setCacheControlExtensions();
    await this.setCacheControlFiles();
  }

  // fetches the domain name from the CloudFront outputs and prints it out
  async domainInfo() {
    const provider = this.serverless.getProvider('aws');
    const stackName = provider.naming.getStackName(this.options.stage);
    const result = await provider.request(
      'CloudFormation',
      'describeStacks',
      { StackName: stackName },
      this.options.stage,
      this.options.region,
    );

    const outputs = result.Stacks[0].Outputs;
    const output = outputs.find(
      entry => entry.OutputKey === 'WebAppCloudFrontDistributionOutput',
    );

    if (output.OutputValue) {
      this.serverless.cli.log(`Web App Domain: ${output.OutputValue}`);
      return output.OutputValue;
    }
    this.serverless.cli.log('Web App Domain: Not Found');
    return undefined;
  }

  async invalidateCache() {
    const provider = this.serverless.getProvider('aws');

    const domain = await this.domainInfo();
    if (!domain) {
      const error = new Error('Could not extract Web App Domain');
      throw error;
    }

    const result = await provider.request(
      'CloudFront',
      'listDistributions',
      {},
      this.options.stage,
      this.options.region,
    );

    const distributions = result.DistributionList.Items;
    const distribution = distributions.find(
      entry => entry.DomainName === domain,
    );

    if (distribution) {
      this.serverless.cli.log(
        `Invalidating CloudFront distribution with id: ${distribution.Id}`,
      );
      const args = [
        'cloudfront',
        'create-invalidation',
        '--distribution-id',
        distribution.Id,
        '--paths',
        '/*',
      ];
      const exitCode = await this.runAwsCommand(args);
      if (!exitCode) {
        this.serverless.cli.log('Successfully invalidated CloudFront cache');
      } else {
        throw new Error('Failed invalidating CloudFront cache');
      }
    } else {
      const message = `Could not find distribution with domain ${domain}`;
      const error = new Error(message);
      this.serverless.cli.log(message);
      throw error;
    }
  }

  async publishToPreviewBucket() {
    const { s3Bucket } = this.options;
    const provider = this.serverless.getProvider('aws');
    const name = `${
      this.serverless.service.getServiceObject().name
    }-${s3Bucket}`;

    this.serverless.cli.log(`Creating preview bucket ${name}`);
    this.serverless.variables.service.custom.s3Bucket = name;

    try {
      await provider.request('S3', 'createBucket', {
        Bucket: name,
        ACL: 'public-read',
      });
      await provider.request('S3', 'putBucketPolicy', {
        Bucket: name,
        Policy: JSON.stringify({
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: `arn:aws:s3:::${name}/*`,
            },
          ],
        }),
      });
      await provider.request('S3', 'putBucketWebsite', {
        Bucket: name,
        WebsiteConfiguration: {
          ErrorDocument: {
            Key: 'index.html',
          },
          IndexDocument: {
            Suffix: 'index.html',
          },
        },
      });
      this.serverless.cli.log(`Done creating preview bucket ${name}`);
    } catch (e) {
      if (e.providerError.code === 'BucketAlreadyOwnedByYou') {
        this.serverless.cli.log(`Preview bucket ${name} already exists`);
        return;
      }
      throw e;
    }
  }

  async publishSite() {
    const { stage } = this.options;
    if (stage === 'preview') {
      await this.publishToPreviewBucket();
    }

    await this.syncDirectory();
    await this.setCacheControl();

    if (stage !== 'preview') {
      await this.invalidateCache();
    }
  }
}

module.exports = ServerlessPlugin;
