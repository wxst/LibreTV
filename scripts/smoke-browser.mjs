import { spawnSync } from 'node:child_process';
import process from 'node:process';

const baseUrl = process.env.LIBRETV_BASE_URL || 'http://127.0.0.1:8080';

async function assertHttpOk(pathname) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }
}

function runPlaywrightCli(args) {
  const result = spawnSync('npx', ['--yes', '--package', '@playwright/cli', 'playwright-cli', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

await assertHttpOk('/manifest.json');
await assertHttpOk('/service-worker.js');
runPlaywrightCli(['open', baseUrl]);
runPlaywrightCli(['goto', new URL('/diagnostics.html', baseUrl).toString()]);
runPlaywrightCli(['snapshot']);
runPlaywrightCli(['close']);

console.log(`LibreTV browser smoke checks passed for ${baseUrl}`);
