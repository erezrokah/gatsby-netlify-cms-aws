// https://circleci.com/account/api
const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs');
const axios = require('axios');
const { IAM } = require('aws-sdk');

log = console.log;
error = console.error;

const api = 'https://circleci.com/api/v1.1/project/github';
const policyArn = 'arn:aws:iam::aws:policy/AdministratorAccess';

const getIamUserName = repo => `circle-ci-${repo}`;

const deleteAllKeys = async userName => {
  log(`Deleting all access keys for user ${userName}`);
  const iam = new IAM();
  const result = await iam.listAccessKeys({ UserName: userName }).promise();

  await Promise.all(
    result.AccessKeyMetadata.map(({ UserName, AccessKeyId }) =>
      iam.deleteAccessKey({ UserName, AccessKeyId }).promise(),
    ),
  );
  log(`Done deleting all access keys for user ${userName}`);
};

const createIamUser = async userName => {
  const iam = new IAM();

  try {
    log(`Creating IAM user ${userName}`);
    await iam.createUser({ UserName: userName }).promise();
    log(`Done creating IAM user ${userName}`);
  } catch (e) {
    if (e.code === 'EntityAlreadyExists') {
      log(`User ${userName} already exists`);
      await deleteAllKeys(userName);
    } else {
      throw e;
    }
  }

  log(`Attaching managed policy to user ${userName}`);
  await iam
    .attachUserPolicy({
      PolicyArn: policyArn,
      UserName: userName,
    })
    .promise();
  log(`Done attaching managed policy to user ${userName}`);

  log(`Creating access key for user ${userName}`);
  const { AccessKey } = await iam
    .createAccessKey({ UserName: userName })
    .promise();
  const {
    AccessKeyId: accessKeyId,
    SecretAccessKey: secretAccessKey,
  } = AccessKey;
  log(`Done creating access key for user ${userName}`);
  return { accessKeyId, secretAccessKey };
};

const deleteIamUser = async userName => {
  const iam = new IAM();

  try {
    log(`Detaching IAM user ${userName} policy ${policyArn}`);
    await iam
      .detachUserPolicy({
        PolicyArn: policyArn,
        UserName: userName,
      })
      .promise();
    log(`Done detaching IAM user ${userName} policy ${policyArn}`);

    await deleteAllKeys(userName);

    log(`Deleting IAM user ${userName}`);
    await iam.deleteUser({ UserName: userName }).promise();
    log(`Done deleting IAM user ${userName}`);
  } catch (e) {
    if (e.code === 'NoSuchEntity') {
      log(`Policy ${policyArn} doesn't exists`);
    } else {
      throw e;
    }
  }
};

const follow = async (token, owner, repo) => {
  log(`Following repo ${repo} under owner ${owner}`);
  const result = await axios.post(
    `${api}/${owner}/${repo}/follow?circle-token=${token}`,
  );
  const { following } = result.data;
  if (following) {
    log(`Successfully followed repo ${repo} under owner ${owner}`);
  } else {
    const message = `Failed to follow repo ${repo} under owner ${owner}`;
    error(message);
    throw new Error(message);
  }
};

const setEnvs = async (token, owner, repo, envs) => {
  log(`Deleting existing environment vars for project ${repo}`);
  const { data: existing } = await axios.get(
    `${api}/${owner}/${repo}/envvar?circle-token=${token}`,
  );
  await Promise.all(
    existing.map(({ name }) =>
      axios.delete(
        `${api}/${owner}/${repo}/envvar/${name}?circle-token=${token}`,
      ),
    ),
  );
  log(`Done deleting existing environment vars for project ${repo}`);

  log(`Setting environment vars for project ${repo}`);
  await Promise.all(
    envs.map(({ name, value }) =>
      axios.post(`${api}/${owner}/${repo}/envvar?circle-token=${token}`, {
        name,
        value,
      }),
    ),
  );
  log(`Successfully set environment vars for project ${repo}`);
};

const updateProjectSettings = async (token, owner, repo) => {
  log(`Updating settings for project ${repo}`);
  await axios.put(`${api}/${owner}/${repo}/settings?circle-token=${token}`, {
    feature_flags: {
      'build-prs-only': true,
      'build-fork-prs': false,
      'forks-receive-secret-env-vars': false,
    },
  });
  log(`Done updating settings for project ${repo}`);
};

const setup = async (token, envs) => {
  try {
    const { owner, repo } = require('../utils/githubConfig')();
    const iamUser = getIamUserName(repo);
    const { accessKeyId, secretAccessKey } = await createIamUser(iamUser);

    await follow(token, owner, repo);
    await setEnvs(token, owner, repo, [
      ...envs,
      { name: 'AWS_ACCESS_KEY_ID', value: accessKeyId },
      { name: 'AWS_SECRET_ACCESS_KEY', value: secretAccessKey },
    ]);
    await updateProjectSettings(token, owner, repo);
  } catch (e) {
    error(e);
    process.exit(1);
  }
};

const unfollow = async (token, owner, repo) => {
  log(`Unfollowing repo ${repo} under owner ${owner}`);
  const result = await axios.post(
    `${api}/${owner}/${repo}/unfollow?circle-token=${token}`,
  );
  const { following } = result.data;
  if (!following) {
    log(`Successfully unfollowed repo ${repo} under owner ${owner}`);
  } else {
    const message = `Failed to unfollow repo ${repo} under owner ${owner}`;
    error(message);
    throw new Error(message);
  }
};

const remove = async token => {
  try {
    const { owner, repo } = require('../utils/githubConfig')();
    await unfollow(token, owner, repo);

    const iamUser = getIamUserName(repo);
    await deleteIamUser(iamUser);
  } catch (e) {
    error(e);
    process.exit(1);
  }
};

const envsNames = [
  { name: 'PROD_OAUTH_CLIENT_ID', required: true },
  { name: 'PROD_OAUTH_CLIENT_SECRET', required: true },
  { name: 'PROD_DOMAIN', required: true },
  { name: 'PROD_GOOGLE_ANALYTICS_ID', required: false },
  { name: 'PROD_DISQUS_SHORT_NAME', required: false },
  { name: 'PROD_MAILCHIMP_ENDPOINT', required: false },

  { name: 'STAGING_OAUTH_CLIENT_ID', required: true },
  { name: 'STAGING_OAUTH_CLIENT_SECRET', required: true },
  { name: 'STAGING_DOMAIN', required: true },
  { name: 'STAGING_GOOGLE_ANALYTICS_ID', required: false },
  { name: 'STAGING_DISQUS_SHORT_NAME', required: false },
  { name: 'STAGING_MAILCHIMP_ENDPOINT', required: false },

  { name: 'GITHUB_API_TOKEN', required: true },
  { name: 'HOST_ZONE_ID', required: true },
];

yargs
  .command({
    command: 'setup',
    aliases: ['s'],
    desc: 'Setup circle ci project',
    builder: yargs =>
      yargs.option('token', {
        alias: 't',
        describe: 'Api Token',
        demandOption: true,
        string: true,
        requiresArg: true,
        default: process.env.CIRCLECI_API_TOKEN,
        defaultDescription: 'process.env.CIRCLECI_API_TOKEN',
      }),
    handler: async ({ token, envs: envsArray }) => {
      const undefinedEnvs = envsNames.filter(
        ({ name, required }) => required && !process.env[name],
      );
      if (undefinedEnvs.length > 0) {
        console.error(
          `Missing required environment variables: ${JSON.stringify(
            undefinedEnvs.map(({ name }) => name),
          )}`,
        );
        process.exit(1);
      }
      const envs = envsNames.map(({ name }) => ({
        name,
        value: process.env[name] || '',
      }));
      await setup(token, envs);
    },
  })
  .command({
    command: 'remove',
    aliases: ['r'],
    desc: 'Remove circle ci project setup',
    builder: yargs =>
      yargs.option('token', {
        alias: 't',
        describe: 'Api Token',
        demandOption: true,
        string: true,
        requiresArg: true,
        default: process.env.CIRCLECI_API_TOKEN,
        defaultDescription: 'process.env.CIRCLECI_API_TOKEN',
      }),
    handler: async ({ token }) => {
      await remove(token);
    },
  })
  .demandCommand(1)
  .help()
  .strict()
  .version('0.0.1').argv;
