# Roadmap

This roadmap keeps the revived LibreTV fork focused on maintainability first, then stability, then product polish.

## Phase 1: Public Maintenance Foundation

Status: completed.

- Maintain accurate README, CHANGELOG, ROADMAP, issue templates, PR template, and contribution guide.
- Keep GitHub Actions CI green on `main`.
- Require version and changelog updates for every user-visible change.
- Keep Cloudflare Pages deployment documented as root static output with Pages Functions.

## Phase 2: Source Reliability

Status: completed.

- 源健康检查: probe search, detail, and playable m3u8 URLs for each default source.
- Build a source health check that probes search, detail, and playable m3u8 URLs for each default source.
- Output a readable source health report for maintainers.
- Show source health status in the UI: success rate, last checked time, and failed-source hints.
- Keep third-party API and media responses network-only.
- Implemented in `js/source-health.js`, with cached reports shown in settings and diagnostics.

## Phase 3: Playback Reliability

Status: completed.

- Improve player errors so users can distinguish source failure, 403/404 m3u8, proxy failure, timeout, and browser support problems.
- Add a clear one-click source switch path when playback fails.
- Expand browser smoke checks for search, detail, repaired playback URLs, PWA metadata, and Cloudflare proxy auth.
- Implemented in `js/player-errors.js`, player error actions, and `npm run smoke:browser`.

## Phase 4: Public Self-hosting Experience

Status: completed.

- 诊断页: show password configuration, proxy status, PWA status, and source status without exposing secrets.
- Add first-run guidance for password setup, data sources, PWA installation, and configuration backup.
- Improve config import/export with versioning, validation, and migration messages.
- Add a diagnostics page for password configuration, proxy status, PWA status, and source status without exposing secrets.
- Polish mobile and standalone PWA layouts for home, detail modal, player, and offline page.
- Implemented first-run guidance, diagnostics page, and versioned config import/export.

## Phase 5: Incremental Architecture Cleanup

Status: completed.

- Split large JavaScript files gradually by source management, playback parsing, and configuration storage.
- Avoid one-shot rewrites; every refactor needs focused tests and no behavior drift.
- Prefer stable user-facing behavior over framework churn.
- Split source health, playback error classification, and config import/export into focused modules.
