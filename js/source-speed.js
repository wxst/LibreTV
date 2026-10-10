// Measure a small sample of the media that a source would actually play.
(() => {
    const SAMPLE_BYTES = 64 * 1024;
    const TIMEOUT_MS = 8000;

    async function requestSample(targetUrl, signal, throughProxy) {
        let requestUrl = targetUrl;
        const options = { cache: 'no-store', signal };
        if (throughProxy) {
            const proxyPrefix = typeof PROXY_URL === 'string' ? PROXY_URL : '/proxy/';
            const proxyPath = proxyPrefix + encodeURIComponent(targetUrl);
            const authorizedPath = window.ProxyAuth?.addAuthToProxyUrl
                ? await window.ProxyAuth.addAuthToProxyUrl(proxyPath)
                : proxyPath;
            const proxyUrl = new URL(authorizedPath, window.location?.origin || 'https://libretv.local');
            proxyUrl.searchParams.set('probe', '1');
            requestUrl = proxyUrl.pathname + proxyUrl.search;
            options.headers = { Range: `bytes=0-${SAMPLE_BYTES - 1}` };
        }
        const startedAt = performance.now();
        const response = await fetch(requestUrl, options);
        if (!response.ok || !response.body) {
            await response.body?.cancel().catch(() => {});
            throw new Error(`媒体请求失败 (${response.status})`);
        }

        const contentType = response.headers.get('Content-Type') || '';
        if (/text\/html|application\/json/i.test(contentType)) {
            await response.body.cancel();
            throw new Error('播放地址返回了错误页面');
        }

        const reader = response.body.getReader();
        const chunks = [];
        let bytes = 0;
        try {
            while (bytes < SAMPLE_BYTES) {
                const { value, done } = await reader.read();
                if (done) break;
                if (!value?.length) continue;
                const chunk = value.subarray(0, SAMPLE_BYTES - bytes);
                chunks.push(chunk);
                bytes += chunk.length;
            }
        } finally {
            await reader.cancel().catch(() => {});
        }
        return { bytes, chunks, contentType, elapsedMs: Math.max(1, performance.now() - startedAt), transport: throughProxy ? 'proxy' : 'direct' };
    }

    async function fetchSample(targetUrl, signal) {
        try {
            // HLS playback requests media directly from the viewer's browser.
            // A proxy-only measurement can fail even when that path plays fine.
            return await requestSample(targetUrl, signal, false);
        } catch (error) {
            if (signal.aborted) throw error;
            return requestSample(targetUrl, signal, true);
        }
    }

    function playlistText(sample) {
        const data = new Uint8Array(sample.bytes);
        let offset = 0;
        for (const chunk of sample.chunks) {
            data.set(chunk, offset);
            offset += chunk.length;
        }
        return new TextDecoder().decode(data);
    }

    function nextPlaylistUrl(content, baseUrl) {
        const lines = content.split(/\r?\n/).map(line => line.trim());
        let selected = '';
        let bestBandwidth = -1;
        for (let index = 0; index < lines.length; index++) {
            if (!lines[index].startsWith('#EXT-X-STREAM-INF')) continue;
            const bandwidth = Number(lines[index].match(/BANDWIDTH=(\d+)/)?.[1] || 0);
            const variant = lines.slice(index + 1).find(line => line && !line.startsWith('#'));
            if (variant && bandwidth >= bestBandwidth) {
                selected = variant;
                bestBandwidth = bandwidth;
            }
        }
        if (!selected) {
            const segments = lines.filter(line => line && !line.startsWith('#'));
            selected = segments.at(-1) || '';
        }
        if (!selected) throw new Error('播放列表没有媒体片段');
        const resolved = new URL(selected, baseUrl);
        if (!['http:', 'https:'].includes(resolved.protocol)) throw new Error('播放链接无效');
        return resolved.toString();
    }

    async function probeEpisodeUrl(episodeUrl, { signal } = {}) {
        const controller = new AbortController();
        const abort = () => controller.abort();
        if (signal?.aborted) controller.abort();
        else signal?.addEventListener('abort', abort, { once: true });
        const timeout = setTimeout(abort, TIMEOUT_MS);
        try {
            let url = new URL(episodeUrl);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error('播放链接无效');
            for (let depth = 0; depth < 4; depth++) {
                const sample = await fetchSample(url.toString(), controller.signal);
                const isPlaylist = /\.m3u8$/i.test(url.pathname) || /mpegurl/i.test(sample.contentType);
                if (!isPlaylist) {
                    if (sample.bytes < 1024) throw new Error('媒体样本过小');
                    return {
                        bytes: sample.bytes,
                        elapsedMs: Math.round(sample.elapsedMs),
                        kbps: Math.round(sample.bytes * 1000 / (sample.elapsedMs * 1024)),
                        transport: sample.transport
                    };
                }
                url = new URL(nextPlaylistUrl(playlistText(sample), url));
            }
            throw new Error('播放列表嵌套过深');
        } catch (error) {
            if (controller.signal.aborted && !signal?.aborted) throw new Error('测速超时');
            throw error;
        } finally {
            clearTimeout(timeout);
            signal?.removeEventListener('abort', abort);
        }
    }

    window.SourceSpeed = { probeEpisodeUrl };
})();
