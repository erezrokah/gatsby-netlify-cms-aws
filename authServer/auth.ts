// https://github.com/marksteele/netlify-serverless-oauth2-backend/blob/master/auth.js
import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import simpleOauthModule = require('simple-oauth2');
import randomstring = require('randomstring');
import { getSecrets } from './utils';

let secrets: Record<string, string> | null = null;

const {
  OAUTH_CLIENT_ID = '',
  OAUTH_CLIENT_SECRET = '',
  GIT_HOSTNAME = '',
  OAUTH_TOKEN_PATH = '',
  OAUTH_AUTHORIZE_PATH = '',
  REDIRECT_URL = '',
  OAUTH_SCOPES = '',
} = process.env;

const names = [
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  GIT_HOSTNAME,
  OAUTH_TOKEN_PATH,
  OAUTH_AUTHORIZE_PATH,
  REDIRECT_URL,
  OAUTH_SCOPES,
];

export const handler: Handler = async (e: APIGatewayProxyEvent, ctx, cb) => {
  if (!secrets) {
    secrets = await getSecrets(names);
  }
  const oauth2 = simpleOauthModule.create({
    client: {
      id: secrets[OAUTH_CLIENT_ID],
      secret: secrets[OAUTH_CLIENT_SECRET],
    },
    auth: {
      tokenHost: secrets[GIT_HOSTNAME],
      tokenPath: secrets[OAUTH_TOKEN_PATH],
      authorizePath: secrets[OAUTH_AUTHORIZE_PATH],
    },
  });

  // Authorization uri definition
  const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: secrets[REDIRECT_URL],
    scope: secrets[OAUTH_SCOPES],
    state: randomstring.generate(32),
  });

  cb(null, {
    statusCode: 302,
    headers: {
      Location: authorizationUri,
    },
  });
};
