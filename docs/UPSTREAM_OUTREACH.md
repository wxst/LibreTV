# 上游引流与 issue 回复准则

本文件用于维护 `wxst/LibreTV` 的低风险 GitHub 引流。目标是帮助仍在上游归档仓库里求助的自部署用户找到维护版代码和迁移文档，而不是刷屏推广。

## 回复原则

- 只回复与维护版已经解决的问题直接相关的上游 issue。
- 每个 issue 最多回复一次，除非对方继续追问具体迁移问题。
- 开头透明说明这是维护 fork，不冒充上游维护者。
- 只链接 GitHub 仓库、README、MIGRATION 或 release，不链接任何公开部署站点。
- 不使用成人源作为宣传点；如被问到，只说明可选源支持源分类和默认禁用策略。

## 当前上游状态

`LibreSpark/LibreTV` 已归档，issue 线程可能处于只读状态。2026-05-11 已验证上游 issue 回复会被 GitHub 拒绝，错误原因是 archived/read-only。遇到这种情况不要重复尝试刷评论，改用以下入口承接用户：

- 本仓库 description、topics 和 README。
- GitHub Release。
- 本仓库 Discussions 的迁移入口。
- 本仓库 Issues 的可复现问题入口。
- 其他社区渠道，但仍只链接仓库和文档。

## 优先目标

- 没源、源失效、搜索失败。
- 播放页一直加载、分享页无法直接播放、m3u8 403/404。
- Cloudflare Pages 部署、密码、代理、预览部署问题。
- 询问上游是否还维护、是否有可继续使用的 fork。

## 不回复的情况

- 与 LibreTV 无关的广告、账号、内容求片或版权争议。
- 已经有清晰解决方案且不需要维护版补充的信息。
- 只适合在本仓库新开 issue 排查的私人部署问题。

## 回复模板

### 没源或不能播放

> 这个上游仓库已经归档了。我这边维护了一个续作 fork，主要修了默认源、播放直链解析、封面 fallback、源健康检查和播放错误分类，仍然只面向自部署使用：<https://github.com/wxst/LibreTV>
>
> 如果你是从上游迁移，可以先看迁移和 FAQ：<https://github.com/wxst/LibreTV/blob/main/MIGRATION.md>。里面有“没源”“播放一直转圈”“Cloudflare Pages 代理/密码”的排查步骤。

### Cloudflare Pages 或密码代理问题

> 上游已经归档，Cloudflare Pages 部署细节后来有不少坑。我维护的 fork 把 Pages 根目录静态部署、Functions 代理、`PASSWORD` / `PASSWORD_HASH`、诊断页和 PWA 都整理进了文档：<https://github.com/wxst/LibreTV>
>
> 迁移步骤在这里：<https://github.com/wxst/LibreTV/blob/main/MIGRATION.md>。重点是 Pages 的 Build command、Build output directory、Root directory 都保持留空，并且生产环境必须设置密码变量。

### 询问是否有维护版

> 有一个维护续作 fork：<https://github.com/wxst/LibreTV>。定位是个人学习和自部署，不提供公共影视站点。当前重点是让 Cloudflare Pages、默认源、播放直链、图片 fallback、PWA、诊断页和 CI 都可验证。
>
> 从上游迁移可以看：<https://github.com/wxst/LibreTV/blob/main/MIGRATION.md>。

## 节奏

发布一次稳定 release 后，优先确认上游 issue 是否允许回复。如果上游仍然只读，则不再重试评论，改为观察 release、Discussions、Issues、star、fork 和搜索流量。只有在线程允许回复时，才选择 3 到 5 个高度相关的上游 issue 做第一批透明回复，并观察 48 到 72 小时的反馈质量。
