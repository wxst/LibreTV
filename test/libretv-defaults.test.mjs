import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const rootDir = path.resolve(import.meta.dirname, '..');

async function readProjectFile(relativePath) {
  return readFile(path.join(rootDir, relativePath), 'utf8');
}

async function loadBrowserConfig() {
  const sandbox = {
    console,
    URL,
    window: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(await readProjectFile('js/config.js'), sandbox);
  vm.runInContext(await readProjectFile('js/customer_site.js'), sandbox);
  return sandbox.window;
}

test('影视工厂 is available as a default customer API source', async () => {
  const window = await loadBrowserConfig();

  assert.equal(window.API_SITES.ysgc.name, '影视工厂');
  assert.equal(window.API_SITES.ysgc.api, 'https://cj.lziapi.com/api.php/provide/vod');
});

test('image helpers normalize common cover URL formats', async () => {
  const window = await loadBrowserConfig();

  assert.equal(typeof window.normalizeImageUrl, 'function');
  assert.equal(
    window.normalizeImageUrl('//img.example.test/poster.jpg'),
    'https://img.example.test/poster.jpg'
  );
  assert.equal(
    window.normalizeImageUrl('/upload/poster.webp', 'https://cj.lziapi.com/api.php/provide/vod'),
    'https://cj.lziapi.com/upload/poster.webp'
  );
});

test('movie card images avoid hotlink referrers and use authenticated proxy fallback', async () => {
  const app = await readProjectFile('js/app.js');
  const douban = await readProjectFile('js/douban.js');
  const player = await readProjectFile('js/player.js');

  assert.match(app, /referrerpolicy="no-referrer"/);
  assert.match(app, /setImageProxyFallback/);
  assert.match(douban, /setImageProxyFallback/);
  assert.match(player, /referrerpolicy="no-referrer"/);
  assert.match(player, /setImageProxyFallback/);
});

test('Cloudflare Pages proxy preserves binary image/media responses', async () => {
  const proxy = await readProjectFile('functions/proxy/[[path]].js');
  const server = await readProjectFile('server.mjs');
  const middleware = await readProjectFile('functions/_middleware.js');

  assert.match(proxy, /arrayBuffer\(\)/);
  assert.match(proxy, /isBinary/);
  assert.match(proxy, /!isBinary && kvNamespace/);
  assert.match(proxy, /acceptedHashes/);
  assert.match(proxy, /PASSWORD_HASH/);
  assert.match(proxy, /movie\.douban\.com/);
  assert.match(server, /movie\.douban\.com/);
  assert.match(server, /acceptedHashes/);
  assert.match(server, /PASSWORD_HASH/);
  assert.match(server, /getTargetReferer\(targetUrl\)/);
  assert.match(middleware, /PASSWORD_HASH/);
});

test('release metadata is bumped for this update', async () => {
  const packageJson = JSON.parse(await readProjectFile('package.json'));
  const lockJson = JSON.parse(await readProjectFile('package-lock.json'));
  const config = await readProjectFile('js/config.js');
  const versionTxt = (await readProjectFile('VERSION.txt')).trim();

  assert.equal(packageJson.version, '1.1.1');
  assert.equal(lockJson.version, '1.1.1');
  assert.equal(lockJson.packages[''].version, '1.1.1');
  assert.match(config, /version:\s*'1\.1\.1'/);
  assert.match(versionTxt, /^\d{12}$/);
  assert.ok(Number(versionTxt) > 202508060117);
});
