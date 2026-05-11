# LibreTV Agent Notes

## Git Workflow

- Do not work directly on `main` for normal maintenance. Create a feature branch for every code, doc, or config change.
- Open a pull request into `main` after local verification.
- `main` is protected and is the production deployment branch.
- Required check before merge: GitHub Actions `Test and static checks`.
- Required PR reviews: `0`. After local tests and PR CI pass, Codex may merge its own PR without asking again.
- Prefer squash merge for small maintenance changes so `main` stays easy to read.
- Force pushes and branch deletion are disabled for `main`. Do not try to bypass branch protection.

## Version Rule

Every user-visible change and repository maintenance change must update all release metadata:

- `package.json`
- `package-lock.json`
- `SITE_CONFIG.version` in `js/config.js`
- `VERSION.txt`
- `CHANGELOG.md`

Use patch versions for fixes, source changes, documentation maintenance, deployment settings, and agent-note updates.

## Verification

Run these checks before opening or merging a PR:

```powershell
npm test
node --check js\config.js
node --check service-worker.js
git diff --check -- . ':(exclude)package-lock.json'
```

Use additional `node --check` commands for any touched JavaScript files not covered above.

## Public URL Privacy

- Do not expose public validation URLs, production deployment URLs, preview deployment URLs, or Cloudflare deployment IDs in tracked files, PR bodies, comments, changelog entries, screenshots, or memory records.
- Current tracked files must remain free of public deployment URLs. Keep the guard test in `test/libretv-defaults.test.mjs` up to date if new docs are added.
- Historical commits contain old public URL references. Do not rewrite public git history unless the user explicitly asks; prefer removing current references and rotating deployment surfaces if needed.

## Cloudflare Pages

- Project production branch: `main`.
- Production deployments remain enabled.
- Preview deployments are disabled.
- Pull request comments from Cloudflare Pages are disabled.
- If a preview deployment record appears anyway, delete it through the Cloudflare API without printing the generated URL.
- Keep API, proxy, m3u8, and video segment requests network-only. Do not add offline video caching.

## Cloudflare Credentials

- Account ID: `31b8cdf03272caebf0fe4055fb4b99e7`
- API token storage: `C:\Users\k2k\.config\libretv\cloudflare-token.dpapi`
- Account ID storage: `C:\Users\k2k\.config\libretv\cloudflare-account-id.txt`
- Loader script: `C:\Users\k2k\.config\libretv\load-cloudflare-env.ps1`

The Cloudflare API token is not stored in this repository. It is saved outside the repo as a Windows DPAPI-encrypted secret for the current user.

Load credentials in PowerShell before Cloudflare API calls:

```powershell
. "$env:USERPROFILE\.config\libretv\load-cloudflare-env.ps1"
```

Verify the token without pasting it into commands:

```powershell
. "$env:USERPROFILE\.config\libretv\load-cloudflare-env.ps1"
Invoke-RestMethod -Method Get -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/tokens/verify" -Headers @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" }
```

Do not commit raw Cloudflare tokens, decrypted token files, shell history containing tokens, or temporary files that include `CLOUDFLARE_API_TOKEN`.
