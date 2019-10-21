# gatsby-netlify-cms-aws

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Based on [Lumen](https://github.com/alxshelepenok/gatsby-starter-lumen)

## Setup

```bash
yarn install
```

[Create two github OAuth applications](https://github.com/settings/applications/new) with following values:

```yaml
Application Name: yourdomain-com # or replace with domain
Homepage URL: https://www.yourdomain.com/admin/index.html # or replace netlify cms admin page
Authorization callback URL: http://localhost:3000/callback

Application Name: yourdomain-com-staging # or replace with domain
Homepage URL: https://staging.yourdomain.com/admin/index.html # or replace netlify cms admin page
Authorization callback URL: http://localhost:3000/callback
```

Note the 'Client ID' and 'Client Secret' values and run (replace with relevant values)

```bash
export PROD_OAUTH_CLIENT_ID=*************************
export PROD_OAUTH_CLIENT_SECRET=*************************
export PROD_DOMAIN=www.yourdomain.com # or something similar
export PROD_GOOGLE_ANALYTICS_ID=************************* # Optional
export PROD_DISQUS_SHORT_NAME=****************** # Optional -https://disqus.com/
export PROD_MAILCHIMP_ENDPOINT=************** # Optional - https://shopify.barrelny.com/where-do-i-find-the-mailchimp-signup-url/

export STAGING_OAUTH_CLIENT_ID=*************************
export STAGING_OAUTH_CLIENT_SECRET=*************************
export STAGING_DOMAIN=staging.yourdomain.com # or something similar
export STAGING_GOOGLE_ANALYTICS_ID=************************* # Optional
export STAGING_DISQUS_SHORT_NAME=****************** # Optional - https://disqus.com/
export STAGING_MAILCHIMP_ENDPOINT=************** # Optional - https://shopify.barrelny.com/where-do-i-find-the-mailchimp-signup-url/

export HOST_ZONE_ID=*********** # After registering your domain get the host zone id from https://console.aws.amazon.com/route53/home#hosted-zones:
```

## Deploy

```bash
yarn create-cert --stage staging|prod
yarn deploy --stage staging|prod
yarn build
yarn run publish --stage staging|prod
```

[Update your OAuth Application](https://github.com/settings/developers) Authorization callback URL based on the deployed endpoint:

```yaml
Authorization callback URL: https://*****************.eu-west-1.amazonaws.com/***/callback
```

## Develop

Make sure `static/admin/config.yml` has updated values of `backend.repo` and then run:

```bash
yarn develop
```

## Setup CircleCI

[Create a CircleCI Personal API Token](https://circleci.com/account/api)

[Create a GitHub Personal access tokens](https://github.com/settings/tokens/new) with `repo:status` scope

Run (update with relevant values)

### Add To CircleCI

```bash
# taken from setup phase
export PROD_OAUTH_CLIENT_ID=*************************
export PROD_OAUTH_CLIENT_SECRET=*************************
export PROD_DOMAIN=www.yourdomain.com
export PROD_GOOGLE_ANALYTICS_ID=*************************
export PROD_DISQUS_SHORT_NAME=******************
export PROD_MAILCHIMP_ENDPOINT=**************

export STAGING_OAUTH_CLIENT_ID=*************************
export STAGING_OAUTH_CLIENT_SECRET=*************************
export STAGING_DOMAIN=staging.yourdomain.com
export STAGING_GOOGLE_ANALYTICS_ID=*************************
export STAGING_DISQUS_SHORT_NAME=******************
export STAGING_MAILCHIMP_ENDPOINT=**************

export HOST_ZONE_ID=***********

# CircleCI specific
export GITHUB_API_TOKEN=*************************
export CIRCLECI_API_TOKEN=*************************

yarn circleci:setup
```

### Remove From CircleCI

```bash
export CIRCLECI_API_TOKEN=*************************

yarn circleci:remove
```
