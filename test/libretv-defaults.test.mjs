import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
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
  const pages = ['index.html', 'player.html', 'watch.html', 'about.html', 'offline.html', 'diagnostics.html'];

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

test('public deployment URLs are not exposed in current tracked files', async () => {
  const checkedFiles = [
    'README.md',
    'CHANGELOG.md',
    'ROADMAP.md',
    'index.html',
    'js/config.js',
    'manifest.json',
    'service-worker.js'
  ];
  const forbidden = /libretv-4vs\.pages\.dev|pages\.dev|libretv\.is-an\.org/i;

  for (const filePath of checkedFiles) {
    assert.doesNotMatch(await readProjectFile(filePath), forbidden, `${filePath} exposes a public URL`);
  }
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

test('maintenance automation avoids direct main pushes and public preview workflows', async () => {
  const readme = await readProjectFile('README.md');
  const contributing = await readProjectFile('CONTRIBUTING.md');
  const workflowDir = path.join(rootDir, '.github/workflows');
  const workflowFiles = await readdir(workflowDir);
  const workflowText = (await Promise.all(
    workflowFiles.map(fileName => readProjectFile(path.join('.github/workflows', fileName)))
  )).join('\n');

  assert.deepEqual(workflowFiles.sort(), ['ci.yml']);
  assert.match(readme, /Preview deployments 设置为 `None`/);
  assert.match(readme, /`main` 只作为通过 CI 后的生产部署分支/);
  assert.match(contributing, /Do not push directly to `main`/);
  assert.doesNotMatch(workflowText, /git push origin main|target_sync_branch:\s*main|pull_request_target/);
});

test('source health checks probe default sources and expose a UI report', async () => {
  const sourceHealth = await readProjectFile('js/source-health.js');
  const index = await readProjectFile('index.html');
  const sw = await readProjectFile('service-worker.js');

  assert.match(sourceHealth, /SOURCE_HEALTH_STORAGE_KEY/);
  assert.match(sourceHealth, /runSourceHealthCheck/);
  assert.match(sourceHealth, /probeSourceHealth/);
  assert.match(sourceHealth, /handleApiRequest/);
  assert.match(sourceHealth, /searchOk/);
  assert.match(sourceHealth, /detailOk/);
  assert.match(sourceHealth, /playableOk/);
  assert.match(sourceHealth, /\.m3u8/);
  assert.match(sourceHealth, /successRate/);
  assert.match(sourceHealth, /checkedAt/);
  assert.match(sourceHealth, /sourceHealthReport/);
  assert.match(index, /sourceHealthSummary/);
  assert.match(index, /sourceHealthList/);
  assert.match(index, /runSourceHealthCheck/);
  assert.match(index, /js\/source-health\.js/);
  assert.match(sw, /js\/source-health\.js/);
});

test('playback errors are classified and offer one-click source switching', async () => {
  const playerErrors = await readProjectFile('js/player-errors.js');
  const player = await readProjectFile('js/player.js');
  const playerHtml = await readProjectFile('player.html');

  assert.match(playerErrors, /function classifyPlaybackError/);
  assert.match(playerErrors, /403/);
  assert.match(playerErrors, /404/);
  assert.match(playerErrors, /timeout/);
  assert.match(playerErrors, /proxy/);
  assert.match(playerErrors, /browser/);
  assert.match(player, /classifyPlaybackError/);
  assert.match(player, /showResourceSwitchModal/);
  assert.match(player, /一键切换资源/);
  assert.match(playerHtml, /error-actions/);
  assert.match(playerHtml, /js\/player-errors\.js/);
});

test('first-run guidance and diagnostics page support public self-hosting', async () => {
  const onboarding = await readProjectFile('js/onboarding.js');
  const diagnostics = await readProjectFile('js/diagnostics.js');
  const diagnosticsHtml = await readProjectFile('diagnostics.html');
  const index = await readProjectFile('index.html');
  const sw = await readProjectFile('service-worker.js');
  const server = await readProjectFile('server.mjs');

  assert.match(onboarding, /firstRunGuideSeen/);
  assert.match(onboarding, /showFirstRunGuide/);
  assert.match(onboarding, /PASSWORD/);
  assert.match(onboarding, /PWA/);
  assert.match(onboarding, /导出配置/);
  assert.match(index, /js\/onboarding\.js/);
  assert.match(index, /showFirstRunGuide\(true\)/);

  assert.match(diagnosticsHtml, /diagnostics-root/);
  assert.match(diagnosticsHtml, /js\/diagnostics\.js/);
  assert.match(diagnostics, /password-status/);
  assert.match(diagnostics, /proxy-status/);
  assert.match(diagnostics, /pwa-status/);
  assert.match(diagnostics, /source-status/);
  assert.doesNotMatch(diagnosticsHtml, /cfat_|CLOUDFLARE_API_TOKEN|Authorization: Bearer/);
  assert.match(sw, /diagnostics\.html/);
  assert.match(sw, /js\/diagnostics\.js/);
  assert.match(server, /diagnostics\.html/);
});

test('config import and export are versioned, validated, and migratable', async () => {
  const configManager = await readProjectFile('js/config-manager.js');
  const app = await readProjectFile('js/app.js');
  const index = await readProjectFile('index.html');
  const sw = await readProjectFile('service-worker.js');

  assert.match(configManager, /CONFIG_EXPORT_VERSION\s*=\s*'2\.0\.0'/);
  assert.match(configManager, /buildConfigExport/);
  assert.match(configManager, /validateAndMigrateConfig/);
  assert.match(configManager, /applyConfigData/);
  assert.match(configManager, /migrationMessages/);
  assert.match(configManager, /allowedKeys/);
  assert.match(configManager, /sourceHealthReport/);
  assert.match(app, /buildConfigExport/);
  assert.match(app, /validateAndMigrateConfig/);
  assert.match(app, /applyConfigData/);
  assert.match(index, /js\/config-manager\.js/);
  assert.match(sw, /js\/config-manager\.js/);
});

test('maintenance roadmap completion adds smoke checks and incremental modules', async () => {
  const roadmap = await readProjectFile('ROADMAP.md');
  const readme = await readProjectFile('README.md');
  const packageJson = JSON.parse(await readProjectFile('package.json'));
  const smoke = await readProjectFile('scripts/smoke-browser.mjs');

  assert.match(roadmap, /Phase 2: Source Reliability[\s\S]*Status: completed/);
  assert.match(roadmap, /Phase 3: Playback Reliability[\s\S]*Status: completed/);
  assert.match(roadmap, /Phase 4: Public Self-hosting Experience[\s\S]*Status: completed/);
  assert.match(roadmap, /Phase 5: Incremental Architecture Cleanup[\s\S]*Status: completed/);
  assert.match(readme, /npm run smoke:browser/);
  assert.equal(packageJson.scripts['smoke:browser'], 'node scripts/smoke-browser.mjs');
  assert.match(smoke, /playwright/);
  assert.match(smoke, /diagnostics\.html/);
  assert.match(smoke, /manifest\.json/);
});

test('release metadata is bumped for this update', async () => {
  const packageJson = JSON.parse(await readProjectFile('package.json'));
  const lockJson = JSON.parse(await readProjectFile('package-lock.json'));
  const config = await readProjectFile('js/config.js');
  const versionTxt = (await readProjectFile('VERSION.txt')).trim();

  const changelog = await readProjectFile('CHANGELOG.md');

  assert.equal(packageJson.version, '1.2.1');
  assert.equal(lockJson.version, '1.2.1');
  assert.equal(lockJson.packages[''].version, '1.2.1');
  assert.match(config, /version:\s*'1\.2\.1'/);
  assert.match(changelog, /1\.2\.1/);
  assert.match(changelog, /源健康/);
  assert.match(versionTxt, /^\d{12}$/);
  assert.ok(Number(versionTxt) > 202508060117);
});
