#!/usr/bin/env node
// next-version.mjs <upstreamTag> <latestMusesTag>
// Prints the upstream tag if it is newer than the latest Muses release, otherwise the next
// patch after the latest Muses release. Keeps Muses versions strictly increasing.
const [upstream = "v0.0.0", latest = ""] = process.argv.slice(2);
const parse = (tag) => (tag || "v0.0.0").replace(/^v/, "").split("-")[0].split(".").map((n) => Number(n) || 0);
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const up = parse(upstream);
const ours = parse(latest);
const next = cmp(up, ours) > 0 ? up : [ours[0], ours[1], ours[2] + 1];
console.log(`v${next.join(".")}`);
