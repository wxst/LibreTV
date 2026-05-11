## Summary

Describe what changed and why.

## Type

- [ ] Bug fix
- [ ] Source refresh
- [ ] Documentation / maintenance
- [ ] Feature
- [ ] Refactor

## Verification

- [ ] `npm test`
- [ ] `node --check` for changed JavaScript files
- [ ] `git diff --check -- . ':(exclude)package-lock.json'`
- [ ] Browser or deployment check, if user-visible

## Version and Release Notes

- [ ] 版本号 updated in `package.json`
- [ ] 版本号 updated in `package-lock.json`
- [ ] 版本号 updated in `js/config.js`
- [ ] `VERSION.txt` updated
- [ ] `CHANGELOG.md` updated

## Safety

- [ ] No secrets, passwords, tokens, or private endpoints included
- [ ] No video content storage or offline media caching added
- [ ] API/proxy/media network-only behavior preserved unless explicitly documented
