# 从上游 LibreTV 迁移到维护版

本页面向来自已归档上游 `LibreSpark/LibreTV` 的自部署用户。`wxst/LibreTV` 是维护续作，目标是让个人实例更容易部署、验证和排障，而不是提供公共影视服务。

相关入口：

- 仓库首页：<https://github.com/wxst/LibreTV>
- 迁移讨论：<https://github.com/wxst/LibreTV/discussions/9>
- 可复现问题：<https://github.com/wxst/LibreTV/issues>
- 最新发布：<https://github.com/wxst/LibreTV/releases>

## 迁移前确认

- 不要公开自己的部署地址，尤其是带有代理、密码或私人源参数的链接。
- 必须设置 `PASSWORD` 或 `PASSWORD_HASH`，避免实例被陌生人直接访问。
- 第三方 API 源由部署者自行选择、验证和承担内容风险。
- API、代理、m3u8 和视频分片保持 network-only，不会被 PWA 离线缓存。

## 迁移步骤

1. Fork 或克隆 `wxst/LibreTV`。
2. 按部署平台重新配置环境变量，至少设置 `PASSWORD` 或 `PASSWORD_HASH`。
3. Cloudflare Pages 使用根目录静态部署：
   - Build command: 留空
   - Build output directory: 留空
   - Root directory: 留空
4. 如果使用 Cloudflare Pages Functions 代理，部署后验证未授权访问 `/proxy/...` 返回 401。
5. 打开 `/diagnostics.html` 检查密码、代理、PWA 和源状态。诊断页不会显示密钥或令牌。
6. 如需迁移浏览器配置，先在旧实例导出配置，再在维护版导入。导入器会校验格式并迁移旧配置字段。

如果不确定是部署配置还是代码问题，先在迁移讨论里描述平台、版本和现象；如果能稳定复现，再开 issue。

## 常见问题

### 没有可用视频源

维护版已经重新筛选默认 MacCMS VOD API 源，并保留更多已验证但未默认启用的可选源。进入设置面板后可以切换源，也可以运行源健康检查查看搜索、详情和 m3u8 可用性。

### 播放窗口一直转圈

常见原因包括源返回分享页而不是 m3u8、m3u8 403/404、代理失败、浏览器不支持或网络超时。维护版会优先解析可直接播放的 m3u8，并在失败时给出错误分类和一键切源入口。

### 图片不显示

维护版补了封面 URL 规范化、`no-referrer` 加载和代理 fallback。仍然失败时，通常是源站图片已失效或目标站禁止跨站访问。

### Cloudflare Pages 部署后代理不可用

确认仓库根目录包含 `functions/proxy/[[path]].js`，并且 Pages 项目的构建输出仍是根目录静态部署。不要把项目配置成只输出某个不存在的 `dist` 目录。

### 密码无效或代理返回 401

确认部署平台里设置的是 `PASSWORD` 或 `PASSWORD_HASH`，并重新部署生产环境。浏览器端缓存旧配置时，可以清理站点数据或重新输入密码。

## 本维护版不做什么

- 不运营公开影视服务。
- 不提供公开演示地址。
- 不缓存、上传、分发或再托管视频内容。
- 不把成人源设为默认源，也不把成人源作为宣传卖点。
