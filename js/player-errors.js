function classifyPlaybackError(error, context = {}) {
    const detail = String(error?.details || error?.detail || error?.message || error?.reason || '').toLowerCase();
    const type = String(error?.type || '').toLowerCase();
    const responseCode = error?.response?.code || error?.response?.status || error?.code || context.status;
    const url = String(error?.context?.url || context.url || '');

    if (responseCode === 403 || detail.includes('403')) {
        return buildPlaybackError('m3u8-403', '播放地址被拒绝', '当前源返回 403，通常是防盗链、地区限制或临时签名过期。');
    }
    if (responseCode === 404 || detail.includes('404')) {
        return buildPlaybackError('m3u8-404', '播放地址不存在', '当前源返回 404，资源可能已失效或剧集地址已变化。');
    }
    if (detail.includes('timeout') || detail.includes('aborted') || type.includes('timeout')) {
        return buildPlaybackError('timeout', '加载超时', '网络连接或源站响应过慢。');
    }
    if (url.includes('/proxy/') || detail.includes('proxy') || detail.includes('401') || detail.includes('502') || detail.includes('503')) {
        return buildPlaybackError('proxy', '代理请求失败', '代理鉴权、源站响应或部署函数可能异常。');
    }
    if (type.includes('network') || detail.includes('manifest') || detail.includes('frag')) {
        return buildPlaybackError('source', '视频源不可用', '当前源的 m3u8 或视频分片加载失败。');
    }
    if (type.includes('media') || detail.includes('buffer') || detail.includes('decode')) {
        return buildPlaybackError('browser', '浏览器暂不支持', '当前浏览器无法解码该视频或 HLS 数据异常。');
    }
    if (context.browserUnsupported) {
        return buildPlaybackError('browser', '浏览器暂不支持', '当前浏览器缺少 HLS 播放能力。');
    }
    return buildPlaybackError('unknown', '视频播放失败', '播放未能开始，可能是源失效、网络异常或格式不兼容。');
}

function buildPlaybackError(type, title, message) {
    return {
        type,
        title,
        message,
        retryable: true,
        canSwitchSource: true,
        actionLabel: '一键切换资源'
    };
}

window.classifyPlaybackError = classifyPlaybackError;
