(function registerLibreTVPWA() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    let refreshing = false;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .catch(error => {
                console.warn('Service Worker 注册失败:', error);
            });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) {
            return;
        }

        refreshing = true;
        window.location.reload();
    });
})();
