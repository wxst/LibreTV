(function () {
    let castHls = null;

    function getCastParam(name) {
        return new URLSearchParams(window.location.search).get(name) || '';
    }

    function setCastStatus(message) {
        const status = document.getElementById('castStatus');
        if (status) status.textContent = message;
    }

    function clampCastPosition(position, duration) {
        const numericPosition = Number(position || 0);
        if (!Number.isFinite(numericPosition) || numericPosition <= 0) return 0;

        const numericDuration = Number(duration || 0);
        if (!Number.isFinite(numericDuration) || numericDuration <= 0) return numericPosition;

        return Math.min(numericPosition, Math.max(0, numericDuration - 2));
    }

    function isM3u8Url(url) {
        return /\.m3u8(?:[?#]|$)/i.test(String(url || ''));
    }

    function restoreCastPosition(video, requestedPosition) {
        const position = clampCastPosition(requestedPosition, video.duration);
        if (position <= 0) return;

        try {
            video.currentTime = position;
        } catch (e) {
        }
    }

    function tryStartCastPlayback(video) {
        const promise = video.play();
        if (!promise || typeof promise.catch !== 'function') return;

        promise
            .then(() => setCastStatus('正在投屏播放'))
            .catch(() => {
                video.muted = true;
                video.play()
                    .then(() => setCastStatus('已静音投屏播放，可在电视端或浏览器恢复声音'))
                    .catch(() => setCastStatus('投屏页面已打开，请在播放设备上点击播放'));
            });
    }

    function attachCastSource(video, url, requestedPosition) {
        if (castHls && castHls.destroy) {
            castHls.destroy();
            castHls = null;
        }

        if (isM3u8Url(url) && typeof Hls !== 'undefined' && Hls.isSupported()) {
            castHls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 60,
                maxBufferLength: 60,
                maxMaxBufferLength: 120
            });
            castHls.loadSource(url);
            castHls.attachMedia(video);
            castHls.on(Hls.Events.MANIFEST_PARSED, () => {
                restoreCastPosition(video, requestedPosition);
                tryStartCastPlayback(video);
            });
            castHls.on(Hls.Events.ERROR, (event, data) => {
                if (data?.fatal) {
                    setCastStatus('投屏播放失败，请返回原页面更换资源');
                }
            });
            return;
        }

        video.src = url;
        video.addEventListener('loadedmetadata', () => {
            restoreCastPosition(video, requestedPosition);
            tryStartCastPlayback(video);
        }, { once: true });
        video.load();
    }

    function initCastReceiver() {
        const video = document.getElementById('castVideo');
        const titleEl = document.getElementById('castTitle');
        const url = getCastParam('url');
        const title = getCastParam('title') || 'LibreTV 投屏';
        const requestedPosition = Number(getCastParam('position') || 0);

        document.title = `${title} - LibreTV 投屏`;
        if (titleEl) titleEl.textContent = title;

        if (!video || !url) {
            setCastStatus('缺少投屏播放地址，请返回原页面重试');
            return;
        }

        video.disableRemotePlayback = false;
        video.setAttribute('x-webkit-airplay', 'allow');
        video.setAttribute('playsinline', 'true');

        setCastStatus('正在加载投屏视频...');
        attachCastSource(video, url, requestedPosition);
    }

    window.initCastReceiver = initCastReceiver;
    document.addEventListener('DOMContentLoaded', initCastReceiver);
})();
