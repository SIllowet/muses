# Muses

Muses is our build of [Zuno](https://github.com/noFAYZ/zuno) by noFAYZ (Apache-2.0), rebranded.

- **Upstream updates are opt-in.** Muses is based on Zuno `upstreamBase` (brand.json). `muses-upstream-watch.yml` opens an issue labelled `upstream` for each newer Zuno release, listing its commits; it never merges. To take specific changes: `git fetch https://github.com/noFAYZ/zuno.git refs/tags/vX.Y.Z`, `git cherry-pick <sha>` for the chosen commits, test, then run *Muses · Release*. Once a whole release has been reviewed, bump `upstreamBase`.
- **Branding** is applied at build time by `muses/rebrand.mjs` using `muses/brand.json`. Upstream files stay untouched, so merges stay clean. Preview locally with `node muses/rebrand.mjs`, then undo with `git checkout -- . && git clean -fd src-tauri/icons`.
- **Our own tweaks:** commit them to `main`. Ship them by running *Muses · Release* on GitHub (leave the version empty to bump the patch number).
- **Signing:** the updater key is in the `TAURI_SIGNING_PRIVATE_KEY*` repo secrets (local copy in `%USERPROFILE%\.tauri\muses.key`). If you lose it, existing installs can't update.
