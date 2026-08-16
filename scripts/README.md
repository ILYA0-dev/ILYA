# Media pipeline

Videos are never edited or optimized by hand — this repo builds them.

## ⚠️ Cloudflare Pages (direct upload, no Git)
If you deploy by dragging a folder/zip into Cloudflare Pages, **the
GitHub Action below never runs** — Cloudflare doesn't execute it.
You must build locally first, THEN upload the result:

```
node scripts/build-media.js
```

Then upload the **whole project folder** (including the regenerated
`img/*-lo.mp4`, `img/*-hi.mp4`, `img/*.jpg` files — not just
`img/source/`). If `img/` is missing those files, the page will
request videos that don't exist and nothing will show.

## To replace or add a video
1. Put the new file in `img/source/` (e.g. `img/source/H.mp4`).
2. Run `node scripts/build-media.js` (requires `ffmpeg`).
3. Upload the project (with the freshly built `img/` files) to Cloudflare.

If instead your Cloudflare Pages project is connected to a GitHub repo
via Git, you can skip step 2 — push to `img/source/**` and the
`build-media` GitHub Action rebuilds and commits automatically; Cloudflare
then picks up the new commit and deploys it.

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
