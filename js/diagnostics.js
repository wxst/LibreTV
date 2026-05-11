function setDiagnosticStatus(id, label, state, detail) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `diagnostic-item diagnostic-${state}`;
    el.innerHTML = `
        <div class="diagnostic-title">${label}</div>
        <div class="diagnostic-detail">${escapeHtmlAttr(detail)}</div>
    `;
}

function getPasswordDiagnostic() {
    const envPassword = window.__ENV__?.PASSWORD;
    const hasPassword = Boolean(envPassword && envPassword !== '{{PASSWORD}}');
    const verified = localStorage.getItem(window.PASSWORD_CONFIG?.localStorageKey || 'passwordVerified') === 'true';
    if (hasPassword && verified) return { state: 'ok', detail: '已配置，当前浏览器已验证' };
    if (hasPassword) return { state: 'warn', detail: '已配置，当前浏览器尚未验证' };
    return { state: 'fail', detail: '未检测到 PASSWORD 或 PASSWORD_HASH 注入' };
}

async function getProxyDiagnostic() {
    if (!window.ProxyAuth?.getPasswordHash) {
        return { state: 'fail', detail: '代理鉴权模块未加载' };
    }
    const hash = await window.ProxyAuth.getPasswordHash();
    if (!hash) return { state: 'warn', detail: '缺少代理鉴权哈希，播放和图片代理可能失败' };

    try {
        const target = '/proxy/' + encodeURIComponent('https://example.com/');
        const authUrl = await window.ProxyAuth.addAuthToProxyUrl(target);
        const response = await fetch(authUrl, { method: 'GET', headers: { Accept: 'text/html' } });
        return response.ok
            ? { state: 'ok', detail: `代理可访问，HTTP ${response.status}` }
            : { state: 'warn', detail: `代理返回 HTTP ${response.status}` };
    } catch (error) {
        return { state: 'fail', detail: error?.message || '代理请求失败' };
    }
}

async function getPwaDiagnostic() {
    const hasServiceWorker = 'serviceWorker' in navigator;
    const controlled = Boolean(navigator.serviceWorker?.controller);
    let manifestOk = false;
    try {
        const response = await fetch('manifest.json', { cache: 'no-store' });
        manifestOk = response.ok;
    } catch {
        manifestOk = false;
    }

    if (hasServiceWorker && controlled && manifestOk) return { state: 'ok', detail: 'PWA 已由 service worker 控制' };
    if (hasServiceWorker && manifestOk) return { state: 'warn', detail: 'PWA 元数据正常，service worker 下次打开后生效' };
    return { state: 'fail', detail: '当前浏览器或 manifest 不满足 PWA 条件' };
}

function getSourceDiagnostic() {
    const report = window.loadSourceHealthReport?.();
    if (!report?.summary) {
        return { state: 'warn', detail: '尚未生成源健康报告' };
    }
    const state = report.summary.failed > 0 ? 'warn' : 'ok';
    return {
        state,
        detail: `${report.summary.successRate}% 成功，${report.summary.ok}/${report.summary.total} 个源完全可用`
    };
}

async function renderDiagnostics() {
    const password = getPasswordDiagnostic();
    setDiagnosticStatus('password-status', '密码保护', password.state, password.detail);

    const proxy = await getProxyDiagnostic();
    setDiagnosticStatus('proxy-status', '代理状态', proxy.state, proxy.detail);

    const pwa = await getPwaDiagnostic();
    setDiagnosticStatus('pwa-status', 'PWA 状态', pwa.state, pwa.detail);

    const source = getSourceDiagnostic();
    setDiagnosticStatus('source-status', '源健康', source.state, source.detail);
    window.renderSourceHealthSummary?.();
}

async function runDiagnosticsSourceHealth() {
    await window.runSourceHealthCheck?.();
    await renderDiagnostics();
}

document.addEventListener('DOMContentLoaded', renderDiagnostics);

window.renderDiagnostics = renderDiagnostics;
window.runDiagnosticsSourceHealth = runDiagnosticsSourceHealth;
