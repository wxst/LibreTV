# Changelog

All notable changes to this maintained LibreTV fork are documented here.

## 1.2.8 - 2026-05-11

### Changed

- Source health checks now cover all built-in and custom sources instead of only the default selected sources.
- Renamed the settings action from `检测默认源` to `检测源`.

### Fixed

- Loaded the shared modal stylesheet on the home page so the first-run guide opens as a centered overlay instead of appearing in page flow.

## 1.2.7 - 2026-05-11

### Added

- Added GitHub search and migration intake documentation for repository-only outreach.
- Added an upstream migration issue template and issue/discussion entry points for users coming from archived LibreSpark/LibreTV.
- Added release notes for the GitHub search and migration intake update.

### Changed

- Strengthened README search positioning for LibreTV Revival as a maintained self-hosted fork of archived LibreSpark/LibreTV.

## 1.2.6 - 2026-05-11

### Changed

- Clarified the GitHub outreach runbook after verifying the archived upstream repository is read-only and cannot accept new issue comments.
- Updated README outreach wording to route migration users through repository metadata, releases, and this repository's Discussions when upstream issue replies are blocked.

## 1.2.5 - 2026-05-11

### Added

- Added an upstream migration and FAQ guide for users coming from the archived LibreTV repository.
- Added GitHub release notes and upstream issue reply guidelines for repository-only outreach without public deployment URLs.

### Changed

- Strengthened README positioning around the maintained self-hosted fork and GitHub-first migration entry.

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
