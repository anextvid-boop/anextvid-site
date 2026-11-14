# ANEXTVID Website — 3 Versions (Cloudflare Pages Ready)

This folder contains the **3 design versions** of the updated ANEXTVID website, plus a shared version-comparison hub at `index.html`.

## Structure
- `index.html` — Version selector hub (`/v1/`, `/v2/`, `/v3/`)
- `v1/` — **Dark Cinema / Editorial Studio** (obsidian dark + violet glow, marquee, showreel, founder story)
- `v2/` — **Neon Futuristic / AI & Motion Lab** (live `.mp4` hero loop, cyber-noir, YouTube + Giphy motion wall)
- `v3/` — **Executive B2B & LinkedIn Authority** (warm architectural light theme, corporate/finance focus, photo grid)
- `shared/site-data.js` — Shared business data, YouTube/Giphy embeds, Terms & Conditions modal, and contact form logic
- `assets/` — Local rescued `.mp4` videos and images from `anextvid.com` (no WordPress dependency)

## Preview Locally
Run a static server from `anextvid-site/`:
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

## Deploy Free for Life on Cloudflare Pages
1. Push `anextvid-site/` to a GitHub repository (or upload the `anextvid-site` folder directly in the Cloudflare Dashboard via **Workers & Pages → Create → Pages → Direct Upload**).
2. If using GitHub:
   - **Build command**: *(leave empty)*
   - **Build output directory**: `anextvid-site` (or `/` if `anextvid-site` is the repo root)
3. Once you pick your favorite version (`v1`, `v2`, or `v3`), copy its files into the root of `anextvid-site/` so `anextvid.com` loads that version directly.
4. Add `anextvid.com` under **Custom domains** in Cloudflare Pages for free SSL and unlimited free bandwidth.
