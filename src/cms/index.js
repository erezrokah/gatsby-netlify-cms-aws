// @flow
import CMS from 'netlify-cms-app';
import PagePreview from './preview-templates/page-preview';
import PostPreview from './preview-templates/post-preview';

const config = {
  backend: {
    repo: process.env.GATSBY_NETLIFY_CMS_REPO,
    base_url: process.env.GATSBY_NETLIFY_CMS_BASE_URL,
    auth_endpoint: process.env.GATSBY_NETLIFY_CMS_AUTH_ENDPOINT,
  },
};
CMS.init({
  config,
});

CMS.registerPreviewTemplate('pages', PagePreview);
CMS.registerPreviewTemplate('posts', PostPreview);
