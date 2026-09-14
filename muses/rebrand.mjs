#!/usr/bin/env node
/*
 * Turns an upstream Zuno checkout into Muses, in place.
 *
 * Run on a clean tree right before building (CI does this; locally: `node muses/rebrand.mjs`,
 * then `git checkout -- .` to undo). The branding is applied at build time instead of being
 * committed so merging noFAYZ/zuno stays conflict-free.
 *
 * Each rule is either `critical` (identity / updater: the build must not ship without it, so
 * a miss fails the run) or cosmetic (a miss only warns, so an upstream rewording never blocks
 * a release). Internal storage keys and the `zuno-playlist` file format are left alone on
 * purpose: they are invisible, and renaming them would strand saved data.
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = JSON.parse(readFileSync(join(root, "muses", "brand.json"), "utf8"));
const REPO = `https://github.com/${brand.repo}`;

let failures = 0;
let warnings = 0;

function edit(file, rules) {
  const path = join(root, file);
  if (!existsSync(path)) {
    report(rules.some((r) => r.critical), `${file}: file missing`);
    return;
  }
  let text = readFileSync(path, "utf8");
  for (const { find, replace, critical = false, all = false } of rules) {
    const matches = typeof find === "string" ? text.includes(find) : find.test(text);
    if (!matches) {
      report(critical, `${file}: no match for ${find}`);
      continue;
    }
    if (typeof find === "string") {
      text = all ? text.split(find).join(replace) : text.replace(find, replace);
    } else {
      text = text.replace(find, replace);
    }
  }
  writeFileSync(path, text);
}

function report(critical, message) {
  if (critical) {
    failures++;
    console.error(`::error::[rebrand] ${message}`);
  } else {
    warnings++;
    console.warn(`::warning::[rebrand] ${message}`);
  }
}

// --- Identity and updater (critical) ------------------------------------------------------
const confPath = join(root, "src-tauri", "tauri.conf.json");
const conf = JSON.parse(readFileSync(confPath, "utf8"));
conf.productName = brand.name;
conf.mainBinaryName = brand.binary;
conf.identifier = brand.identifier;
for (const w of conf.app?.windows ?? []) w.title = brand.name;
if (!conf.plugins?.updater) report(true, "tauri.conf.json: updater plugin config missing");
else {
  conf.plugins.updater.pubkey = brand.updaterPubkey;
  conf.plugins.updater.endpoints = [`${REPO}/releases/latest/download/latest.json`];
}
writeFileSync(confPath, JSON.stringify(conf, null, 2) + "\n");

edit("src/internal/updateChecker.ts", [
  { find: "https://github.com/noFAYZ/zuno/releases/tag", replace: `${REPO}/releases/tag`, critical: true },
  { find: "https://api.github.com/repos/noFAYZ/zuno/releases/latest", replace: `https://api.github.com/repos/${brand.repo}/releases/latest`, critical: true },
]);
edit("src-tauri/src/main.rs", [
  { find: 'w!("com.zuno.desktop")', replace: `w!("${brand.identifier}")`, critical: true },
]);
edit("src-tauri/src/process_memory.rs", [
  { find: '"zuno.exe"', replace: `"${brand.binary}.exe"`, critical: true },
]);
// Point the one-time app-data migration at the Zuno install, so settings carry over.
edit("src-tauri/src/lib.rs", [
  { find: /const LEGACY_BUNDLE_IDENTIFIER: &str = "[^"]*";/, replace: 'const LEGACY_BUNDLE_IDENTIFIER: &str = "com.zuno.desktop";', critical: true },
  { find: '"Show Zuno"', replace: `"Show ${brand.name}"` },
  { find: '"Quit Zuno"', replace: `"Quit ${brand.name}"` },
  { find: '.tooltip("Zuno")', replace: `.tooltip("${brand.name}")` },
]);

// --- Visible branding (cosmetic) ----------------------------------------------------------
edit("src/ui/links.ts", [{ find: "https://github.com/noFAYZ/zuno", replace: REPO }]);
edit("src-tauri/src/discord_rpc.rs", [
  { find: "https://github.com/noFAYZ/zuno", replace: REPO },
  { find: 'const ACTIVITY_NAME: &str = "Zuno";', replace: `const ACTIVITY_NAME: &str = "${brand.name}";` },
  { find: '"Get Zuno"', replace: `"Get ${brand.name}"` },
]);
edit("src-tauri/src/linux_media.rs", [
  { find: 'dbus_name: "zuno"', replace: `dbus_name: "${brand.binary}"` },
  { find: 'display_name: "Zuno"', replace: `display_name: "${brand.name}"` },
]);
edit("src-tauri/Cargo.toml", [
  { find: 'description = "Zuno - a desktop music client"', replace: `description = "${brand.name} - a desktop music client"` },
]);
edit("index.html", [{ find: "<title>Zuno</title>", replace: `<title>${brand.name}</title>` }]);
edit("mini.html", [{ find: "<title>Zuno Mini Player</title>", replace: `<title>${brand.name} Mini Player</title>` }]);
edit("src/main.tsx", [{ find: 'label="Zuno"', replace: `label="${brand.name}"` }]);
edit("src/ui/components/ReleaseNoteDialog.tsx", [{ find: "Zuno {version}", replace: `${brand.name} {version}` }]);
edit("src/ui/components/ErrorBoundary.tsx", [{ find: "The rest of Zuno", replace: `The rest of ${brand.name}` }]);
edit("src/ui/pages/SettingsPage.tsx", [
  { find: /(description=\{?"[^"]*?)\bZuno\b/g, replace: `$1${brand.name}` },
  { find: '? "Zuno plays', replace: `? "${brand.name} plays` },
]);
edit("src/internal/releaseNote.ts", [
  { find: /, or come say hello at \/r\/ZunoMusic\./g, replace: "." },
]);
// --- Icons --------------------------------------------------------------------------------
// Generated by `npm run muses:icons` into muses/icons and committed; copied over here.
const iconDir = join(root, "muses", "icons");
for (const name of ["32x32.png", "128x128.png", "128x128@2x.png", "icon.icns", "icon.ico", "icon.png"]) {
  const from = join(iconDir, name);
  if (existsSync(from)) copyFileSync(from, join(root, "src-tauri", "icons", name));
  else report(false, `muses/icons/${name} missing, keeping upstream icon`);
}

console.log(`[rebrand] ${brand.name}: done with ${failures} error(s), ${warnings} warning(s)`);
if (failures) process.exit(1);
