# Muses

Muses is our build of [Zuno](https://github.com/noFAYZ/zuno) by noFAYZ (Apache-2.0), rebranded.

- **No automatic upstream updates.** Muses is frozen at Zuno 1.4.0 plus our changes, so upstream changes can't break it. To pull a specific Zuno release later, do it on purpose: `git fetch https://github.com/noFAYZ/zuno.git refs/tags/vX.Y.Z && git merge FETCH_HEAD`, test, then run *Muses · Release*.
- **Branding** is applied at build time by `muses/rebrand.mjs` using `muses/brand.json`. Upstream files stay untouched, so merges stay clean. Preview locally with `node muses/rebrand.mjs`, then undo with `git checkout -- . && git clean -fd src-tauri/icons`.
- **Our own tweaks:** commit them to `main`. Ship them by running *Muses · Release* on GitHub (leave the version empty to bump the patch number).
- **Signing:** the updater key is in the `TAURI_SIGNING_PRIVATE_KEY*` repo secrets (local copy in `%USERPROFILE%\.tauri\muses.key`). If you lose it, existing installs can't update.
