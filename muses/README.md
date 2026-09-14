# Muses

Muses is our build of [Zuno](https://github.com/noFAYZ/zuno) by noFAYZ (Apache-2.0), rebranded.

- **Updates from upstream:** `muses-sync.yml` runs every 4 hours. When noFAYZ publishes a Zuno release, it merges that release into `main` and dispatches `muses-release.yml`, which builds Muses at the same version and publishes it here. Installed copies of Muses update from this repo's releases. If our commits conflict with upstream, you get an issue instead of a build.
- **Branding** is applied at build time by `muses/rebrand.mjs` using `muses/brand.json`. Upstream files stay untouched, so merges stay clean. Preview locally with `node muses/rebrand.mjs`, then undo with `git checkout -- . && git clean -fd src-tauri/icons`.
- **Our own tweaks:** commit them to `main`. They ship with the next upstream release, or sooner if you run *Muses · Release* by hand with a higher version (e.g. `v1.4.1`).
- **Signing:** the updater key is in the `TAURI_SIGNING_PRIVATE_KEY*` repo secrets (local copy in `%USERPROFILE%\.tauri\muses.key`). If you lose it, existing installs can't update.
