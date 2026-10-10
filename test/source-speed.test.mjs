import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { onRequest } from '../functions/proxy/[[path]].js';

const rootDir = path.resolve(import.meta.dirname, '..');

test('source speed probe uses the same direct media path as playback when available', async () => {
  const requests = [];
  const window = {
    ProxyAuth: { addAuthToProxyUrl: async url => `${url}?auth=test-hash` }
  };
  const sandbox = {
    window, URL, AbortController, TextDecoder, performance, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      const parsed = new URL(url, 'https://libretv.example');
      const target = parsed.pathname.startsWith('/proxy/')
        ? decodeURIComponent(parsed.pathname.slice('/proxy/'.length)) : parsed.toString();
      requests.push({ target, range: options.headers?.Range || null, transport: parsed.pathname.startsWith('/proxy/') ? 'proxy' : 'direct' });
      if (target.endsWith('master.m3u8')) {
        return new Response('#EXTM3U\n#EXTINF:10,\nsegment.ts\n', {
          status: 206,
          headers: { 'Content-Type': 'application/vnd.apple.mpegurl' }
        });
      }
      return new Response(new Uint8Array(65536), {
        status: 206,
        headers: { 'Content-Type': 'video/mp2t' }
      });
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(await readFile(path.join(rootDir, 'js/source-speed.js'), 'utf8'), sandbox);

  const result = await window.SourceSpeed.probeEpisodeUrl('https://media.example/master.m3u8');
  assert.equal(result.bytes, 65536);
  assert.ok(result.kbps > 0);
  assert.equal(result.transport, 'direct');
  assert.deepEqual(requests, [
    { target: 'https://media.example/master.m3u8', range: null, transport: 'direct' },
    { target: 'https://media.example/segment.ts', range: null, transport: 'direct' }
  ]);
});

test('source speed falls back to the authenticated proxy when direct media cannot be read', async () => {
  const requests = [];
  const window = { ProxyAuth: { addAuthToProxyUrl: async url => `${url}?auth=test-hash` } };
  const sandbox = {
    window, URL, AbortController, TextDecoder, performance, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      const parsed = new URL(url, 'https://libretv.example');
      if (parsed.origin !== 'https://libretv.example') {
        requests.push({ transport: 'direct', target: parsed.toString() });
        throw new TypeError('Failed to fetch');
      }
      const target = decodeURIComponent(parsed.pathname.slice('/proxy/'.length));
      requests.push({ transport: 'proxy', target, range: options.headers.Range });
      if (target.endsWith('.m3u8')) {
        return new Response('#EXTM3U\n#EXTINF:10,\nsegment.ts\n', {
          status: 206, headers: { 'Content-Type': 'application/vnd.apple.mpegurl' }
        });
      }
      return new Response(new Uint8Array(65536), {
        status: 206, headers: { 'Content-Type': 'video/mp2t' }
      });
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(await readFile(path.join(rootDir, 'js/source-speed.js'), 'utf8'), sandbox);

  const result = await window.SourceSpeed.probeEpisodeUrl('https://media.example/master.m3u8');
  assert.equal(result.bytes, 65536);
  assert.equal(result.transport, 'proxy');
  assert.deepEqual(requests.map(request => request.transport), ['direct', 'proxy', 'direct', 'proxy']);
  assert.equal(requests[1].range, 'bytes=0-65535');
  assert.equal(requests[3].range, 'bytes=0-65535');
});

test('Cloudflare proxy streams authorized 64 KiB range probes without caching', async () => {
  const target = 'https://media.example/segment.ts';
  const password = 'test-password';
  const auth = createHash('sha256').update(password).digest('hex');
  const request = new Request(`https://libretv.example/proxy/${encodeURIComponent(target)}?auth=${auth}&probe=1`, {
    headers: { Range: 'bytes=0-65535' }
  });
  const originalFetch = globalThis.fetch;
  let upstreamRange;
  globalThis.fetch = async (_url, options) => {
    upstreamRange = options.headers.get('Range');
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 206,
      headers: { 'Content-Type': 'video/mp2t', 'Content-Range': 'bytes 0-2/1000' }
    });
  };
  try {
    const response = await onRequest({ request, env: { PASSWORD: password }, waitUntil() {} });
    assert.equal(upstreamRange, 'bytes=0-65535');
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(Array.from(new Uint8Array(await response.arrayBuffer())), [1, 2, 3]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
