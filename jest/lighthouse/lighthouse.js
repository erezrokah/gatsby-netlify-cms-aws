//@flow
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

type Audit = {
  id: string,
  title: string,
  description: string,
  score: number | null,
  displayValue?: string,
};

describe('Lighthouse', () => {
  const reports = path.join(__dirname, '..', 'reports', 'lighthouse');
  const { audits } = fs.readJSONSync(path.join(reports, 'lighthouse.json'));
  const auditResults: Audit[] = Object.keys(audits).map(key => audits[key]);
  for (let result of auditResults) {
    const { id, title, score } = result;
    if (score !== null) {
      test(`${title} - ${id}`, () => {
        switch (id) {
          case 'is-crawlable':
            expect(score).toEqual(process.env.STAGE === 'prod' ? 1 : 0);
            break;
          case 'uses-long-cache-ttl':
            expect(score).toBeGreaterThanOrEqual(0.97);
            break;
          case 'first-contentful-paint':
          case 'first-meaningful-paint':
          case 'max-potential-fid':
          case 'speed-index':
            expect(score).toBeGreaterThanOrEqual(0.95);
            break;
          case 'first-cpu-idle':
          case 'interactive':
            expect(score).toBeGreaterThanOrEqual(0.85);
            expect(score).toBeGreaterThanOrEqual(0.85);
            break;
          default:
            expect(score).toEqual(1);
            break;
        }
      });
    }
  }
});
