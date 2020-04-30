const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const getNetlifyCMSBackend = (endpoint) => {
  const { owner, repo } = require('../utils/githubConfig')();
  const lasIndex = endpoint.lastIndexOf('/');
  const base_url = endpoint.substring(0, lasIndex);
  const auth_endpoint = `${endpoint.substring(lasIndex)}/auth`;

  return { repo: `${owner}/${repo}`, base_url, auth_endpoint };
};

const updateSSM = async (endpoint, serverless) => {
  const provider = serverless.getProvider('aws');
  const {
    currentStage,
    currentRegion,
    authSsmParameters,
  } = serverless.variables.service.custom;

  const envs = {
    REDIRECT_URL: `${endpoint}/callback`,
    GIT_HOSTNAME: 'https://github.com',
    OAUTH_TOKEN_PATH: '/login/oauth/access_token',
    OAUTH_AUTHORIZE_PATH: '/login/oauth/authorize',
    OAUTH_CLIENT_ID:
      process.env[`${currentStage.toUpperCase()}_OAUTH_CLIENT_ID`],
    OAUTH_CLIENT_SECRET:
      process.env[`${currentStage.toUpperCase()}_OAUTH_CLIENT_SECRET`],
    OAUTH_SCOPES: 'repo',
  };

  const params = Object.keys(authSsmParameters).map((key) => ({
    Name: authSsmParameters[key],
    Value: envs[key],
    Type: 'SecureString',
    Overwrite: true,
  }));

  await Promise.all(
    params.map((p) =>
      provider.request('SSM', 'putParameter', p, currentStage, currentRegion),
    ),
  );
};

const generateEnvFile = async (endpoint, serverless) => {
  const { currentStage } = serverless.variables.service.custom;

  const stageUpperCase = currentStage.toUpperCase();

  const googleAnalyticsId =
    process.env[`${stageUpperCase}_GOOGLE_ANALYTICS_ID`];

  const disqusShortname = process.env[`${stageUpperCase}_DISQUS_SHORT_NAME`];

  const mailchimpEndpoint = process.env[`${stageUpperCase}_MAILCHIMP_ENDPOINT`];

  const domain = process.env[`${stageUpperCase}_DOMAIN`];

  const { repo, base_url, auth_endpoint } = getNetlifyCMSBackend(endpoint);

  const content = [
    `GOOGLE_ANALYTICS_ID=${googleAnalyticsId || ''}`,
    `DISQUS_SHORT_NAME=${disqusShortname || ''}`,
    `DOMAIN=${domain || ''}`,
    `GATSBY_MAILCHIMP_ENDPOINT=${mailchimpEndpoint || ''}`,
    `GATSBY_NETLIFY_CMS_REPO=${repo}`,
    `GATSBY_NETLIFY_CMS_BASE_URL=${base_url}`,
    `GATSBY_NETLIFY_CMS_AUTH_ENDPOINT=${auth_endpoint}`,
  ].join(os.EOL);

  await fs.writeFile(path.join(__dirname, '..', '.env'), content);
};

const handler = async (data, serverless) => {
  try {
    const { ServiceEndpoint: endpoint } = data;
    await updateSSM(endpoint, serverless);
    await generateEnvFile(endpoint, serverless);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

module.exports = { handler };
