const { spawnSync } = require('node:child_process');

if (
  process.env.CI ||
  process.env.WORKERS_CI ||
  process.env.SKIP_FULLSTACK_POSTINSTALL === 'true'
) {
  process.exit(0);
}

const command =
  process.platform === 'win32'
    ? 'fullstack-cli.cmd'
    : 'fullstack-cli';
const result = spawnSync(command, ['action-plugin', 'init'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error?.code === 'ENOENT') {
  console.log(
    'fullstack-cli not found; skipping legacy Lark plugin initialization.',
  );
  process.exit(0);
}

process.exit(result.status ?? 0);
