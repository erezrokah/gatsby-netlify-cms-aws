//@flow

const lighthouse = require('lighthouse');
const log = require('lighthouse-logger');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

const launchChromeAndRunLighthouse = async (url, opts, config = null) => {
  const chrome = await chromeLauncher.launch({ chromeFlags: opts.chromeFlags });
  const { port } = chrome;

  // use results.lhr for the JS-consumeable output
  // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
  // use results.report for the HTML/JSON/CSV output as a string
  // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
  const results = await lighthouse(url, { ...opts, port }, config);
  await chrome.kill();

  return results;
};

const opts = {
  chromeFlags: [],
  logLevel: 'info',
  output: 'html',
};

log.setLevel(opts.logLevel);

module.exports = async () => {
  const { report, lhr } = await launchChromeAndRunLighthouse(
    `https://${process.env.DOMAIN || ''}`,
    opts,
  );

  const reports = path.join(__dirname, '..', 'reports', 'lighthouse');
  await fs.mkdirs(reports);

  await Promise.all([
    fs.writeFile(path.join(reports, 'lighthouse.html'), report),
    fs.writeJSON(path.join(reports, 'lighthouse.json'), lhr, {
      spaces: 2,
    }),
  ]);
};
