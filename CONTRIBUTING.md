# Contributing to LibreTV Revival

Thanks for helping maintain LibreTV. This fork is focused on self-hosted reliability, safe defaults, and clear maintenance practices.

## Before You Start

- Read `README.md`, `ROADMAP.md`, and `CHANGELOG.md`.
- Do not submit secrets, passwords, private API endpoints, Cloudflare tokens, or deployment credentials.
- Do not add functionality that stores, uploads, redistributes, or caches video content.
- Keep API, proxy, m3u8, and media responses network-only unless a maintainer explicitly approves a different design.

## Local Development

```bash
npm install
npm run dev
```

Use `http://localhost:8080` for full local testing. A static file server is not enough because proxy and auth behavior require the Node.js server or a serverless platform.

## Required Checks

Run these before opening a pull request:

```bash
npm test
node --check js/config.js
node --check js/api.js
node --check js/app.js
node --check js/player.js
node --check js/pwa-register.js
node --check service-worker.js
git diff --check -- . ':(exclude)package-lock.json'
```

## Version Rule

Every user-visible change must update:

- `package.json`
- `package-lock.json`
- `SITE_CONFIG.version` in `js/config.js`
- `VERSION.txt`
- `CHANGELOG.md`

Use patch versions for fixes, source refreshes, documentation maintenance, and deployment work. Use minor versions for new user-facing features.

## Issue Guidelines

Good bug reports include:

- Deployment platform and URL type, for example Cloudflare Pages, Vercel, Docker, or local Node.js.
- Browser and operating system.
- Whether `PASSWORD` or `PASSWORD_HASH` is configured.
- Steps to reproduce.
- Console logs and network status codes, with secrets removed.

Do not post passwords, tokens, private headers, or full proxy URLs containing sensitive auth data.

## Pull Request Guidelines

- Keep changes focused.
- Add or update tests for behavior changes.
- Update docs when deployment, configuration, versioning, or user-visible behavior changes.
- Explain how the change was verified.
- Link related issues when available.

## License

This project is distributed under Apache-2.0. By contributing, you agree that your contribution is licensed under Apache-2.0.
