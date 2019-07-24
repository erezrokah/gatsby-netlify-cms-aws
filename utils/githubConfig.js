const { spawnSync } = require('child_process');

const extractGithubData = () => {
  const result = spawnSync('git', ['remote', 'get-url', 'origin']);
  const { stdout } = result;

  // https://github.com/USERNAME/REPOSITORY.git
  // or
  // git@github.com:USERNAME/REPOSITORY.git
  // to USERNAME/REPOSITORY.git
  const stripped = stdout
    .toString()
    .split('github.com')[1]
    .substring(1);

  // splits USERNAME/REPOSITORY.git
  const parts = stripped.split('/');
  const owner = parts[0];
  const repo = parts[1].split('.')[0];

  return {
    owner,
    repo,
  };
};

module.exports = extractGithubData;
