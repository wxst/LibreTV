const FIRST_RUN_GUIDE_KEY = 'firstRunGuideSeen';
const FIRST_RUN_GUIDE_VERSION = '20260511-maintenance';

function showFirstRunGuide(force = false) {
    if (!force && localStorage.getItem(FIRST_RUN_GUIDE_KEY) === FIRST_RUN_GUIDE_VERSION) {
        return;
    }

    let modal = document.getElementById('firstRunGuideModal');
    if (modal) {
        modal.remove();
    }

    modal = document.createElement('div');
    modal.id = 'firstRunGuideModal';
    modal.className = 'modal-overlay first-run-guide show';
    modal.innerHTML = `
        <div class="modal-content first-run-guide-content">
            <div class="modal-header">
                <h3 class="modal-title">首次使用</h3>
                <button class="modal-close" type="button" aria-label="关闭" onclick="dismissFirstRunGuide()">&times;</button>
            </div>
            <div class="modal-body first-run-guide-body">
                <div class="first-run-step">
                    <strong>PASSWORD</strong>
                    <span>部署时设置 PASSWORD 或 PASSWORD_HASH，避免实例公开暴露。</span>
                </div>
                <div class="first-run-step">
                    <strong>数据源</strong>
                    <span>源健康检查会覆盖全部内置源和自定义源，自定义源可通过导出配置备份。</span>
                </div>
                <div class="first-run-step">
                    <strong>PWA</strong>
                    <span>浏览器地址栏出现安装入口后可安装为独立窗口。</span>
                </div>
                <div class="first-run-step">
                    <strong>导出配置</strong>
                    <span>迁移设备或重装前先导出配置，导入时会校验和迁移。</span>
                </div>
            </div>
            <div class="first-run-actions">
                <button type="button" onclick="window.location.href='diagnostics.html'">打开诊断页</button>
                <button type="button" onclick="dismissFirstRunGuide()">知道了</button>
            </div>
        </div>`;

    document.body.appendChild(modal);
}

function dismissFirstRunGuide() {
    localStorage.setItem(FIRST_RUN_GUIDE_KEY, FIRST_RUN_GUIDE_VERSION);
    const modal = document.getElementById('firstRunGuideModal');
    if (modal) {
        modal.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(() => {
        if (!document.getElementById('passwordModal')) {
            showFirstRunGuide(false);
        }
    }, 1200);
});

window.FIRST_RUN_GUIDE_KEY = FIRST_RUN_GUIDE_KEY;
window.showFirstRunGuide = showFirstRunGuide;
window.dismissFirstRunGuide = dismissFirstRunGuide;
