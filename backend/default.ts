// https://github.com/marksteele/netlify-serverless-oauth2-backend/blob/master/auth.js
import { Handler } from 'aws-lambda';

export const handler: Handler = (e, ctx, cb) => {
  cb(null, {
    statusCode: 302,
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Location: '/auth',
    },
  });
};
