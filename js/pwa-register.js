(function registerLibreTVPWA() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const hadController = Boolean(navigator.serviceWorker.controller);

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .catch(error => {
                console.warn('Service Worker 注册失败:', error);
            });
    });

    // Do not reload here. The first install claims the page and fires this
    // event too, and forced reloads made the home page refresh on its own.
    // App scripts and styles are fetched network-first, so a new release is
    // already in use on the next navigation without interrupting this one.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) {
            console.info('LibreTV 已更新到新版本，下次打开页面时生效');
        }
    });
})();
