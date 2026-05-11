# LibreTV Agent Notes

## Git Workflow

- Work on `main` by default.
- When LibreTV changes are requested, commit directly to `main` unless the user explicitly says otherwise.

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
