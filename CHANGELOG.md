# Changelog

All notable changes to this maintained LibreTV fork are documented here.

## 1.2.4 - 2026-05-11

### Added

- Added verified optional adult API sources from upstream PR triage; they are marked `adult: true` and remain disabled by default.

## 1.2.3 - 2026-05-11

### Added

- Imported useful upstream PR learnings: optional Docker outbound proxy support via `PROXY_URL`.
- Added verified optional API sources from post-maintenance upstream PRs while keeping the default selected sources unchanged.

## 1.2.2 - 2026-05-11

### Changed

- Removed local agent notes from repository tracking and ignored `agent.md` so development environment state is not published to GitHub.

## 1.2.1 - 2026-05-11

### Changed

- Removed public site URL metadata from the current codebase and added a guard test to prevent deployment URLs from being reintroduced.
- Documented PR-first maintenance for `main` and Cloudflare preview deployment privacy settings.
- Removed obsolete upstream sync, auto-version, Docker publish, and unconfigured spam workflows that could interfere with protected `main` maintenance.

## 1.2.0 - 2026-05-11

### Added

- Added source health checks with search, detail, and playable m3u8 probes for default sources.
- 新增源健康检查：默认源会检测搜索、详情和 m3u8 可访问性。
- Added a diagnostics page for password, proxy, PWA, and source status without exposing secrets.
- Added first-run guidance for password setup, source selection, PWA install, and config backup.
- Added an optional browser smoke script for manifest, diagnostics, service worker, and basic page checks.

### Changed

- Config import/export is now versioned, validated, and migrates old `1.0.0` exports to `2.0.0`.
- Player failures are classified into source, m3u8 403/404, proxy, timeout, and browser support errors with a one-click source switch action.
- Split source health, playback error classification, and config storage logic into focused modules.

## 1.1.5 - 2026-05-11

### Added

- Added the public maintenance foundation: refreshed README, roadmap, changelog, issue templates, pull request template, and CI.
- 公开维护基础：补齐 README、ROADMAP、CHANGELOG、issue 模板、PR 模板和 CI。
- Added explicit release rules requiring every user-visible change to bump package metadata, `SITE_CONFIG.version`, `VERSION.txt`, and this changelog.

### Changed

- Repositioned this repository as a maintained continuation of the archived upstream project.
- Updated contributor guidance for the current repository, Apache-2.0 license, security boundaries, and self-hosting expectations.

## 1.1.4 - 2026-05-11

### Added

- Added installable PWA metadata, maskable icons, service worker registration, and offline app shell.

### Changed

- Kept API, proxy, m3u8, and media requests network-only while caching only the application shell.

## 1.1.3 - 2026-05-11

### Changed

- Refreshed default video sources after probing search, detail, and playable m3u8 behavior.
- Removed invalid placeholder and unreachable sources from the user-visible list.

## 1.1.2 - 2026-05-11

### Fixed

- Preferred directly playable m3u8 sources over share pages when parsing MacCMS detail responses.
- Repaired stale player URLs by resolving the latest playable episode from detail data.

## 1.1.1 - 2026-05-11

### Added

- Added the 影视工厂 default source.

### Fixed

- Added cover image normalization, no-referrer loading, proxy fallback, and placeholders.

## 1.1.0 and earlier

Historical upstream baseline before this maintained fork started recording a changelog.
