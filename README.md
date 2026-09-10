# Galaga Co-op PWA

The Galaga sidebar game as a standalone progressive web app, with free 2-player co-op over WebRTC. Install it on an iPhone from Safari (Add to Home Screen) and play offline in solo mode.

Personal use only.

## Run locally

```
npm run dev
```

Open the URL it prints (usually `http://localhost:3000`).

## Co-op

Two players, same battlefield. Shared score and waves; each ship has its own lives and hangar loadout. The run ends when both players are out.

1. Both devices open the same site (production HTTPS URL, or the same local `serve` URL).
2. One taps **Co-op** → **Host**. A 4-letter room code appears.
3. The other taps **Co-op** → **Join** and types the code.
4. Host taps **Start**.

Both devices need internet. The game connects through a relay, so it does not depend on phones seeing each other on the LAN (guest Wi-Fi and client isolation are fine). Stay on the host code screen until the guest is in.

Solo **Play** is unchanged.

## Deploy

Needs the [Vercel CLI](https://vercel.com/docs/cli) and a Vercel account.

```
npm i -g vercel
vercel login
vercel
vercel --prod
```

Later updates: bump the cache name in `sw.js`, then `npm run deploy`.

## Install on iPhone

1. Open the production URL in **Safari** (not Chrome).
2. Tap **Share** → **Add to Home Screen**.
3. Open the new Galaga Co-op icon. It runs full-screen, and after the first load solo play works offline.

Portrait only. Use the on-screen pad to move and fire; Pause and Mute sit in the HUD. Keyboard (A/D, Space, P, M) still works on desktop.
