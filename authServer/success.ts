// https://github.com/marksteele/netlify-serverless-oauth2-backend/blob/master/auth.js
import { Handler } from 'aws-lambda';

export const handler: Handler = (e, ctx, cb) =>
  cb(null, {
    statusCode: 204,
    body: '',
  });
