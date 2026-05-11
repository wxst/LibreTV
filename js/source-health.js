const SOURCE_HEALTH_STORAGE_KEY = 'sourceHealthReport';
const SOURCE_HEALTH_CHECKED_AT_KEY = 'sourceHealthCheckedAt';
const SOURCE_HEALTH_TTL_MS = 24 * 60 * 60 * 1000;
const SOURCE_HEALTH_PROBE_QUERY = '阿凡达';

function getCustomHealthSourceIds() {
    try {
        const customSources = JSON.parse(localStorage.getItem('customAPIs') || '[]');
        if (!Array.isArray(customSources)) return [];
        return customSources
            .map((source, index) => source?.url ? `custom_${index}` : '')
            .filter(Boolean);
    } catch (error) {
        console.warn('读取自定义源失败:', error);
        return [];
    }
}

function getHealthSourceIds() {
    const builtInSourceIds = Object.keys(window.API_SITES || {});
    return [...builtInSourceIds, ...getCustomHealthSourceIds()];
}

function getHealthSourceName(sourceId) {
    if (sourceId.startsWith('custom_')) {
        const customApi = window.getCustomApiInfo?.(sourceId.replace('custom_', ''));
        return customApi?.name || sourceId;
    }
    return window.API_SITES?.[sourceId]?.name || sourceId;
}

function isPlayableMediaUrl(url) {
    return /^https?:\/\/.+\.(m3u8|mp4|webm|mov|m4v|ts)(\?.*)?$/i.test(String(url || '').trim());
}

function loadSourceHealthReport() {
    try {
        const raw = localStorage.getItem(SOURCE_HEALTH_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn('读取源健康报告失败:', error);
        return null;
    }
}

function saveSourceHealthReport(report) {
    localStorage.setItem(SOURCE_HEALTH_STORAGE_KEY, JSON.stringify(report));
    localStorage.setItem(SOURCE_HEALTH_CHECKED_AT_KEY, report.checkedAt || new Date().toISOString());
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchApiJson(path) {
    const requestUrl = new URL(path, window.location.origin);
    if (typeof handleApiRequest === 'function') {
        return JSON.parse(await handleApiRequest(requestUrl));
    }

    const response = await fetchWithTimeout(path, { headers: { Accept: 'application/json' } }, 12000);
    if (!response) {
        throw new Error('详情请求被密码保护拦截');
    }
    if (!response.ok) {
        throw new Error(`详情请求失败: ${response.status}`);
    }
    return response.json();
}

async function probePlayableUrl(url) {
    if (!isPlayableMediaUrl(url)) {
        return { ok: false, message: '未返回可播放链接' };
    }

    try {
        const proxyUrl = window.PROXY_URL || '/proxy/';
        const proxiedUrl = window.ProxyAuth?.addAuthToProxyUrl
            ? await window.ProxyAuth.addAuthToProxyUrl(proxyUrl + encodeURIComponent(url))
            : proxyUrl + encodeURIComponent(url);
        const response = await fetchWithTimeout(proxiedUrl, {
            headers: {
                Range: 'bytes=0-2048',
                Accept: url.includes('.m3u8') ? 'application/vnd.apple.mpegurl,text/plain,*/*' : '*/*'
            }
        }, 12000);

        if (!response.ok) {
            return { ok: false, message: `m3u8 检测失败: ${response.status}` };
        }
        return { ok: true, message: 'm3u8 可访问' };
    } catch (error) {
        const message = error?.name === 'AbortError' ? 'm3u8 检测超时' : `m3u8 检测失败: ${error?.message || '网络错误'}`;
        return { ok: false, message };
    }
}

function buildDetailParams(sourceId) {
    if (sourceId.startsWith('custom_')) {
        const customApi = window.getCustomApiInfo?.(sourceId.replace('custom_', ''));
        if (!customApi) return '';
        let params = `&customApi=${encodeURIComponent(customApi.url)}&source=custom`;
        if (customApi.detail) {
            params += `&customDetail=${encodeURIComponent(customApi.detail)}`;
        }
        return params;
    }
    return `&source=${encodeURIComponent(sourceId)}`;
}

async function probeSourceHealth(sourceId) {
    const startedAt = performance.now();
    const sourceName = getHealthSourceName(sourceId);
    const result = {
        id: sourceId,
        name: sourceName,
        status: 'failed',
        successRate: 0,
        checkedAt: new Date().toISOString(),
        latencyMs: 0,
        searchOk: false,
        detailOk: false,
        playableOk: false,
        message: '',
        sampleTitle: '',
        sampleUrl: ''
    };

    try {
        const searchResults = await searchByAPIAndKeyWord(sourceId, SOURCE_HEALTH_PROBE_QUERY);
        result.searchOk = Array.isArray(searchResults) && searchResults.length > 0;
        if (!result.searchOk) {
            result.message = '搜索无结果或源不可达';
            return finalizeSourceHealthResult(result, startedAt);
        }

        const sample = searchResults.find(item => item?.vod_id) || searchResults[0];
        result.sampleTitle = sample?.vod_name || sample?.title || '';
        const detailParams = buildDetailParams(sourceId);
        const detail = await fetchApiJson(`/api/detail?id=${encodeURIComponent(sample.vod_id)}${detailParams}&_t=${Date.now()}`);
        const episodes = Array.isArray(detail?.episodes) ? detail.episodes : [];
        result.detailOk = detail?.code === 200 && episodes.length > 0;
        if (!result.detailOk) {
            result.message = detail?.msg || '详情无可播放集数';
            return finalizeSourceHealthResult(result, startedAt);
        }

        result.sampleUrl = episodes.find(isPlayableMediaUrl) || episodes[0] || '';
        const playable = await probePlayableUrl(result.sampleUrl);
        result.playableOk = playable.ok;
        result.message = playable.message;
        return finalizeSourceHealthResult(result, startedAt);
    } catch (error) {
        result.message = error?.name === 'AbortError' ? '检测超时' : (error?.message || '检测失败');
        return finalizeSourceHealthResult(result, startedAt);
    }
}

function finalizeSourceHealthResult(result, startedAt) {
    const passed = [result.searchOk, result.detailOk, result.playableOk].filter(Boolean).length;
    result.successRate = Math.round((passed / 3) * 100);
    result.status = passed === 3 ? 'ok' : passed > 0 ? 'degraded' : 'failed';
    result.latencyMs = Math.round(performance.now() - startedAt);
    return result;
}

function summarizeSourceHealth(sources) {
    const total = sources.length;
    const ok = sources.filter(item => item.status === 'ok').length;
    const degraded = sources.filter(item => item.status === 'degraded').length;
    const failed = sources.filter(item => item.status === 'failed').length;
    const successRate = total ? Math.round(sources.reduce((sum, item) => sum + item.successRate, 0) / total) : 0;
    return { total, ok, degraded, failed, successRate };
}

async function runSourceHealthCheck(sourceIds = getHealthSourceIds()) {
    const checkedAt = new Date().toISOString();
    const sources = [];
    const button = document.getElementById('sourceHealthButton');
    if (button) {
        button.disabled = true;
        button.textContent = '检测中...';
    }

    try {
        for (const sourceId of sourceIds) {
            sources.push(await probeSourceHealth(sourceId));
            renderSourceHealthSummary({ version: window.SITE_CONFIG?.version || '', checkedAt, sources, summary: summarizeSourceHealth(sources) });
        }

        const report = {
            version: window.SITE_CONFIG?.version || '',
            checkedAt,
            ttlMs: SOURCE_HEALTH_TTL_MS,
            sources,
            summary: summarizeSourceHealth(sources)
        };
        saveSourceHealthReport(report);
        renderSourceHealthSummary(report);
        return report;
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = '检测源';
        }
    }
}

function formatHealthTime(value) {
    if (!value) return '尚未检测';
    try {
        return new Date(value).toLocaleString('zh-CN', { hour12: false });
    } catch {
        return value;
    }
}

function getSourceHealthBadge(status) {
    if (status === 'ok') return '健康';
    if (status === 'degraded') return '部分异常';
    return '失败';
}

function renderSourceHealthSummary(report = loadSourceHealthReport()) {
    const summaryEl = document.getElementById('sourceHealthSummary');
    const listEl = document.getElementById('sourceHealthList');
    const timeEl = document.getElementById('sourceHealthLastChecked');

    if (!summaryEl && !listEl && !timeEl) return;

    if (!report || !Array.isArray(report.sources)) {
        if (summaryEl) summaryEl.textContent = '源健康：尚未检测';
        if (timeEl) timeEl.textContent = '最近检测：尚未检测';
        if (listEl) listEl.innerHTML = '';
        return;
    }

    const summary = report.summary || summarizeSourceHealth(report.sources);
    if (summaryEl) {
        summaryEl.textContent = `源健康：${summary.successRate}% 成功，${summary.ok}/${summary.total} 完全可用`;
    }
    if (timeEl) {
        timeEl.textContent = `最近检测：${formatHealthTime(report.checkedAt)}`;
    }
    if (listEl) {
        listEl.innerHTML = report.sources.map(item => `
            <div class="source-health-item source-health-${item.status}">
                <div class="source-health-row">
                    <span>${escapeHtmlAttr(item.name)}</span>
                    <span>${getSourceHealthBadge(item.status)} · ${item.successRate}%</span>
                </div>
                <div class="source-health-message">${escapeHtmlAttr(item.message || '无异常')}</div>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderSourceHealthSummary();
});

window.SOURCE_HEALTH_STORAGE_KEY = SOURCE_HEALTH_STORAGE_KEY;
window.loadSourceHealthReport = loadSourceHealthReport;
window.saveSourceHealthReport = saveSourceHealthReport;
window.getHealthSourceIds = getHealthSourceIds;
window.probeSourceHealth = probeSourceHealth;
window.runSourceHealthCheck = runSourceHealthCheck;
window.renderSourceHealthSummary = renderSourceHealthSummary;
window.isPlayableMediaUrl = isPlayableMediaUrl;
