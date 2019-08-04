// https://github.com/marksteele/netlify-serverless-oauth2-backend/blob/master/auth.js
import { Handler, APIGatewayProxyEvent } from 'aws-lambda';
import simpleOauthModule = require('simple-oauth2');
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

const getScript = (message: string, content: any) => {
  return `<html><body><script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage %o", e)
      window.opener.postMessage(
        'authorization:github:${message}:${JSON.stringify(content)}',
        e.origin
      )
      window.removeEventListener("message",receiveMessage,false);
    }
    window.addEventListener("message", receiveMessage, false)
    console.log("Sending message: %o", "github")
    window.opener.postMessage("authorizing:github", "*")
    })()
  </script></body></html>`;
};

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

  try {
    const { queryStringParameters } = e;
    const { code } = queryStringParameters || { code: '' };

    const options = {
      code,
      redirect_uri: secrets[REDIRECT_URL],
      scope: secrets[OAUTH_SCOPES],
    };
    const result = await oauth2.authorizationCode.getToken(options);
    const token = oauth2.accessToken.create(result);
    cb(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: getScript('success', {
        token: token.token.access_token,
        provider: 'github',
      }),
    });
  } catch (err) {
    cb(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: getScript('error', err),
    });
  }
};
