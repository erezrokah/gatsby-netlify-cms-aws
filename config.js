'use strict';
require('dotenv').config();

const bio =
  'Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam. Sed arcu.';
const subtitle =
  'Pellentesque odio nisi, euismod in, pharetra a, ultricies in, diam. Sed arcu.';

module.exports = {
  url: `https://${process.env.DOMAIN}`,
  title: 'Blog by John Doe',
  subtitle,
  copyright: '© 2021 All rights reserved.',
  disqusShortname: process.env.DISQUS_SHORT_NAME || '',
  postsPerPage: 6,
  googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',
  menu: [
    {
      label: 'Posts',
      path: '/',
    },
    {
      label: 'About',
      path: '/pages/about',
    },
  ],
  author: {
    name: 'John Doe',
    bio,
    contacts: {
      email: '#',
      telegram: '#',
      twitter: '#',
      github: '#',
      rss: `https://${process.env.DOMAIN}/rss.xml`,
    },
  },
};
