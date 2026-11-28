const { chmodSync, existsSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

const hook = '.githooks/pre-commit';
if (process.platform !== 'win32' && existsSync(hook)) {
  chmodSync(hook, 0o755);
}

spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  stdio: 'ignore',
});
