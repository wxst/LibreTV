// 首页设置里的安卓 App 卡片：在 LibreTV 安卓 App 里显示当前网站地址和「更换网站地址」；
// 在安卓手机的浏览器里显示 App 下载入口（App 支持投屏到电视、有声自动播放）。
(() => {
    const app = window.LibreTVApp;

    function isAndroidBrowser(ua = navigator.userAgent) {
        return /Android/i.test(ua || '') && !/LibreTVApp\//.test(ua || '');
    }

    function start() {
        if (app && typeof app.siteUrl === 'function') {
            const card = document.getElementById('androidAppSettingsCard');
            if (!card) return;
            try {
                card.querySelector('.android-app-site').textContent = app.siteUrl();
                card.querySelector('.android-app-version').textContent = app.version();
            } catch { /* older app */ }
            card.querySelector('.android-app-change-site').addEventListener('click', () => {
                if (window.confirm('更换网站地址后会回到地址输入页面，确定吗？')) app.changeSite();
            });
            card.hidden = false;
            return;
        }
        if (isAndroidBrowser()) {
            const card = document.getElementById('androidAppDownloadCard');
            if (card) card.hidden = false;
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();

    window.AndroidAppHint = { isAndroidBrowser };
})();
