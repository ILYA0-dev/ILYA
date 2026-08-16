# Media pipeline

Videos are never edited or optimized by hand — this repo builds them.

## Your setup: GitHub → Cloudflare Pages (Git-connected)
This is already wired to work automatically:
1. Put a new/updated video in `img/source/` (e.g. `img/source/H.mp4`).
2. `git push`.
3. The `build-media` GitHub Action runs ffmpeg, regenerates
   `img/*-lo.mp4`, `img/*-hi.mp4`, `img/*.jpg`, and commits them back.
4. Cloudflare Pages detects that new commit and redeploys automatically.

Nothing to run locally. Just push the source video and wait ~1–2 minutes
for the Action + Cloudflare deploy to finish.

## If you ever switch to direct upload (no Git)
Then the Action above won't run. You'd need to build locally first
(`node scripts/build-media.js`, requires `ffmpeg`) and upload the whole
`img/` folder yourself — not just `img/source/`.

## What it does, always
- Strips audio (`-an`), regardless of whether the source has a track.
- Produces a light `-lo` variant and a `-hi` variant — the page picks
  ONE of them once per visit (based on connection/device), it never
  downloads both, and it never swaps mid-session.
- Extracts a poster frame so something is visible before any video loads.

## Known slot names
`ILYA` / `G` (background, landscape/portrait), `H` (card banner, 16:9),
`v` (profile mark, 1:1) — these have hand-tuned target sizes in
`build-media.js`, deliberately kept small since decode cost (not just
file size) is what causes stutter on weaker phones. Any other file
name gets sane generic defaults.
