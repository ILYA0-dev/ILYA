#!/usr/bin/env node
/**
 * Automatic media pipeline.
 *
 * Drop a source video into img/source/<name>.mp4 and run this script
 * (or just push — the GitHub Actions workflow runs it for you).
 *
 * For every source file it produces, into img/:
 *   <name>-lo.mp4   tiny/instant variant, shown immediately
 *   <name>-hi.mp4   sharper variant, swapped in silently once buffered
 *   <name>.jpg      poster frame, shown before any video is ready
 *
 * Audio is always stripped (-an) regardless of whether the source has
 * an audio track. Known slot names (ILYA, G, H, v) use dimensions
 * tuned for where they appear on the page; any other file name falls
 * back to sane generic defaults.
 *
 * Usage: node scripts/build-media.js
 * Requires: ffmpeg on PATH.
 */

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "img", "source");
const OUT_DIR = path.join(ROOT, "img");

// [width, height, fps, crf] — lower crf = higher quality/bigger file.
// Kept deliberately light: decode cost (CPU/GPU) scales with pixel count
// and fps, not just file size — this is what actually causes jank on
// mid/low-end phones, so these targets stay conservative.
const CONFIG = {
  ILYA: { lo: [400, 224, 20, 32], hi: [640, 360, 24, 28] },  // background, landscape
  G:    { lo: [304, 540, 20, 32], hi: [480, 854, 24, 29] },  // background, portrait
  H:    { lo: [320, 180, 20, 31], hi: [480, 270, 24, 27] },  // card header banner (16:9)
  v:    { lo: [130, 130, 18, 31], hi: [220, 220, 22, 28] },  // profile / brand mark (1:1)
};

const DEFAULT_CFG = { lo: [426, 240, 24, 31], hi: [854, 480, 30, 27] };

function run(cmd) {
  console.log("> " + cmd);
  execSync(cmd, { stdio: "inherit" });
}

function hasFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function encode(input, output, [w, h, fps, crf]) {
  run(
    `ffmpeg -y -i "${input}" -an -vf "scale=${w}:${h}:flags=lanczos,fps=${fps}" ` +
    `-c:v libx264 -preset slow -crf ${crf} -profile:v main -pix_fmt yuv420p ` +
    `-movflags +faststart "${output}"`
  );
}

function poster(input, output) {
  run(`ffmpeg -y -i "${input}" -update 1 -frames:v 1 -q:v 4 "${output}"`);
}

function main() {
  if (!hasFfmpeg()) {
    console.error("ffmpeg is not installed / not on PATH. Aborting.");
    process.exit(1);
  }

  if (!fs.existsSync(SRC_DIR)) {
    console.log("No img/source directory found — nothing to build.");
    return;
  }

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((f) => /\.(mp4|mov|mkv|webm)$/i.test(f));

  if (files.length === 0) {
    console.log("No source videos in img/source — nothing to build.");
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const file of files) {
    const base = path.parse(file).name;
    const input = path.join(SRC_DIR, file);
    const cfg = CONFIG[base] || DEFAULT_CFG;

    console.log(`\n=== ${base} ===`);
    encode(input, path.join(OUT_DIR, `${base}-lo.mp4`), cfg.lo);
    encode(input, path.join(OUT_DIR, `${base}-hi.mp4`), cfg.hi);
    poster(input, path.join(OUT_DIR, `${base}.jpg`));
  }

  console.log("\nDone — audio stripped, lo/hi variants and posters rebuilt.");
}

main();
