# A View from the Bridge — Memory Palace (May 2014)

An interactive 3D darkroom museum corridor built in Three.js, remembering a high-school black-box production of Arthur Miller's *A View from the Bridge* twelve years later—without real faces, using only stage light, silhouettes, costumes, and props reconstructed from 102 archival DSLR photographs.

Target site: **https://bridge.ayushcchoudhary.com**

## Experience
- **Default Guided Walk:** Opens straight into a winding dark-plaster and walnut-floor museum corridor lit by recessed golden baseboard cove lights and brass gallery picture lights.
- **8 Monumental Curved Murals + The Bridge Finale:** Each Edward Hopper–style chiaroscuro canvas hugs the curved gallery wall flush above the cove strip, culminating at a moonlit iron pedestrian overlook facing the Brooklyn Bridge and dark harbor water.
- **Intuitive Controls:**
  - Plays automatically by default (`Space` to pause/resume, `R` to replay)
  - Walk forward/backward anytime: `W`/`S`, `↑`/`↓`, scroll wheel, touch-swipe, or the bottom scrubber
  - Look around: `A`/`D`, `←`/`→`, click-and-drag, or subtle mouse movement
  - `Sound`: procedural Web Audio black-box room tone, vinyl crackle, and distant harbor foghorn
  - `● Record`: captures a clean, HUD-free 60fps `.webm` walkthrough directly from the WebGL canvas

## Run Locally
Pure static files—no build step or backend required:

```bash
python3 -m http.server 8414
```

Then open `http://localhost:8414`.

## Deploy
Point Vercel, Netlify, Cloudflare Pages, or GitHub Pages at the repository root (no build command needed; output directory is `.`) and attach the custom domain `bridge.ayushcchoudhary.com`.
