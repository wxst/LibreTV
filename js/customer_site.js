const CUSTOMER_SITES = {
    ysgc: {
        api: 'https://cj.lziapi.com/api.php/provide/vod',
        name: '影视工厂',
    },
    jszy: {
        api: 'https://jszyapi.com/api.php/provide/vod',
        name: '极速资源',
    },
    wujin: {
        api: 'https://api.wujinapi.com/api.php/provide/vod',
        name: '无尽资源',
    },
    maoyan: {
        api: 'https://api.maoyanapi.top/api.php/provide/vod',
        name: '猫眼资源',
    },
    rycj: {
        api: 'https://cj.rycjapi.com/api.php/provide/vod',
        name: '如意资源',
    },
    huya: {
        api: 'https://www.huyaapi.com/api.php/provide/vod',
        name: '虎牙资源',
    },
    xinlang: {
        api: 'https://api.xinlangapi.com/xinlangapi.php/provide/vod',
        name: '新浪资源',
    }
};

// 调用全局方法合并
if (window.extendAPISites) {
    window.extendAPISites(CUSTOMER_SITES);
} else {
    console.error("错误：请先加载 config.js！");
}
