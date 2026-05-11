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

test('verified customer API sources are available and invalid placeholders are removed', async () => {
  const window = await loadBrowserConfig();

  assert.equal(window.API_SITES.ysgc.name, '影视工厂');
  assert.equal(window.API_SITES.ysgc.api, 'https://cj.lziapi.com/api.php/provide/vod');
  assert.equal(window.API_SITES.jszy.api, 'https://jszyapi.com/api.php/provide/vod');
  assert.equal(window.API_SITES.wujin.api, 'https://api.wujinapi.com/api.php/provide/vod');
  assert.equal(window.API_SITES.maoyan.api, 'https://api.maoyanapi.top/api.php/provide/vod');
  assert.equal(window.API_SITES.rycj.api, 'https://cj.rycjapi.com/api.php/provide/vod');
  assert.equal(window.API_SITES.huya.api, 'https://www.huyaapi.com/api.php/provide/vod');
  assert.equal(window.API_SITES.xinlang.api, 'https://api.xinlangapi.com/xinlangapi.php/provide/vod');
  assert.equal(window.API_SITES.qiqi, undefined);
  assert.equal(window.API_SITES.testSource, undefined);
  assert.deepEqual(Array.from(window.DEFAULT_SELECTED_APIS), ['ysgc', 'jszy', 'wujin', 'maoyan']);
});

test('image helpers normalize common cover URL formats', async () => {
  const window = await loadBrowserConfig();

  assert.equal(typeof window.normalizeImageUrl, 'function');
  assert.equal(typeof window.getCustomApiInfo, 'function');
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

test('detail parsing prefers directly playable m3u8 sources over share pages', async () => {
  const sandbox = {
    console,
    URL,
    window: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(await readProjectFile('js/config.js'), sandbox);
  vm.runInContext(await readProjectFile('js/api.js'), sandbox);

  assert.equal(typeof sandbox.extractPlayableEpisodes, 'function');
  const episodes = Array.from(sandbox.extractPlayableEpisodes({
      vod_play_from: 'liangzi$$$lzm3u8',
      vod_play_url: 'HD中字$https://v.lzcdn31.com/share/93da579a65ce84cd1d4c85c2cbb84fc5$$$HD中字$https://v.lzcdn31.com/20260329/4136_c7f1876c/index.m3u8'
  }));
  assert.deepEqual(
    episodes,
    ['https://v.lzcdn31.com/20260329/4136_c7f1876c/index.m3u8']
  );
});

test('player can repair stale share-page URLs from detail data', async () => {
  const player = await readProjectFile('js/player.js');

  assert.match(player, /resolvePlayableEpisodeFromDetail/);
  assert.match(player, /isDirectPlayableVideoUrl/);
  assert.match(player, /const videoId = urlParams\.get\('id'\)/);
  assert.match(player, /当前播放地址不是可直接播放的视频链接/);
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

test('manifest exposes installable PWA metadata', async () => {
  const manifest = JSON.parse(await readProjectFile('manifest.json'));

  assert.equal(manifest.id, '/');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'any');
  assert.equal(manifest.lang, 'zh-CN');
  assert.ok(manifest.categories.includes('entertainment'));

  const icon192 = manifest.icons.find(icon => icon.sizes === '192x192');
  const icon512 = manifest.icons.find(icon => icon.sizes === '512x512');
  assert.equal(icon192.src, 'image/icon-192.png');
  assert.match(icon192.purpose, /maskable/);
  assert.equal(icon512.src, 'image/icon-512-maskable.png');
  assert.match(icon512.purpose, /maskable/);
});

test('service worker provides an offline app shell without caching APIs or media', async () => {
  const sw = await readProjectFile('service-worker.js');

  assert.match(sw, /APP_SHELL_CACHE/);
  assert.match(sw, /OFFLINE_URL\s*=\s*'\/offline\.html'/);
  assert.match(sw, /isNetworkOnlyRequest/);
  assert.match(sw, /\/api\//);
  assert.match(sw, /\/proxy\//);
  assert.match(sw, /\.m3u8/);
  assert.match(sw, /event\.request\.mode === 'navigate'/);
  assert.match(sw, /caches\.open\(APP_SHELL_CACHE\)/);
});

test('pages expose PWA metadata and register the service worker', async () => {
  const pages = ['index.html', 'player.html', 'watch.html', 'about.html', 'offline.html'];

  for (const pagePath of pages) {
    const html = await readProjectFile(pagePath);
    assert.match(html, /<link rel="manifest" href="manifest\.json">/);
    assert.match(html, /<meta name="theme-color" content="#0f1622">/);
    assert.match(html, /<meta name="mobile-web-app-capable" content="yes">/);
    assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes">/);
    assert.match(html, /<script src="js\/pwa-register\.js"><\/script>/);
  }
});

test('PWA registration handles failures and app updates safely', async () => {
  const registration = await readProjectFile('js/pwa-register.js');

  assert.match(registration, /navigator\.serviceWorker\.register\('\/service-worker\.js'\)/);
  assert.match(registration, /catch/);
  assert.match(registration, /console\.warn/);
  assert.match(registration, /controllerchange/);
});

test('public maintenance governance docs and CI are present', async () => {
  const readme = await readProjectFile('README.md');
  const changelog = await readProjectFile('CHANGELOG.md');
  const roadmap = await readProjectFile('ROADMAP.md');
  const contributing = await readProjectFile('CONTRIBUTING.md');
  const prTemplate = await readProjectFile('.github/pull_request_template.md');
  const bugTemplate = await readProjectFile('.github/ISSUE_TEMPLATE/bug_report.yml');
  const featureTemplate = await readProjectFile('.github/ISSUE_TEMPLATE/feature_request.yml');
  const ci = await readProjectFile('.github/workflows/ci.yml');

  assert.match(readme, /维护续作/);
  assert.match(readme, /https:\/\/libretv-4vs\.pages\.dev/);
  assert.match(readme, /Cloudflare Pages/);
  assert.match(readme, /PWA/);
  assert.match(readme, /每次用户可见变更/);
  assert.match(changelog, /1\.1\.5/);
  assert.match(changelog, /公开维护基础/);
  assert.match(roadmap, /源健康检查/);
  assert.match(roadmap, /诊断页/);
  assert.match(contributing, /Apache-2\.0/);
  assert.match(prTemplate, /版本号/);
  assert.match(bugTemplate, /部署平台/);
  assert.match(featureTemplate, /维护路线图/);
  assert.match(ci, /npm test/);
  assert.match(ci, /node --check/);
});

test('release metadata is bumped for this update', async () => {
  const packageJson = JSON.parse(await readProjectFile('package.json'));
  const lockJson = JSON.parse(await readProjectFile('package-lock.json'));
  const config = await readProjectFile('js/config.js');
  const versionTxt = (await readProjectFile('VERSION.txt')).trim();

  assert.equal(packageJson.version, '1.1.5');
  assert.equal(lockJson.version, '1.1.5');
  assert.equal(lockJson.packages[''].version, '1.1.5');
  assert.match(config, /version:\s*'1\.1\.5'/);
  assert.match(versionTxt, /^\d{12}$/);
  assert.ok(Number(versionTxt) > 202508060117);
});
