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

Both devices need internet. MQTT is only used to introduce the two browsers; gameplay goes over a WebRTC data channel (direct if possible, otherwise your Metered TURN relay). A public MQTT broker is a last-resort fallback after about 8 seconds if WebRTC never connects. Stay on the host code screen until the guest is in.

During a run a tiny badge in the bottom-left of the field shows the path:

- **P2P** — direct (best). Number is round-trip time.
- **RELAY** — traffic bouncing through TURN. Playable, a bit more delay.
- **MQTT** — slow fallback. The game keeps retrying a faster WebRTC link in the background.

Solo **Play** is unchanged.

## Free TURN relay (optional, recommended)

Cross-network and some home Wi-Fi setups cannot punch a direct P2P hole. The old public TURN logins are dead. A free Metered Open Relay account (20 GB/month, no card) is enough for personal co-op.

1. Create an app at [metered.ca Open Relay](https://www.metered.ca/tools/openrelay/) and copy the app name plus API key.
2. From this repo:

```
vercel env add METERED_APP
vercel env add METERED_API_KEY
vercel --prod
```

Without those env vars the game still runs (STUN-only + MQTT fallback). Local `npm run dev` has no `/api/turn`, so it uses STUN/MQTT only.

## Leaderboard

From the hub, tap **Leaderboard**. Set a pilot name; your best score posts when a run ends so anyone on the live site can see it. Needs internet. Local `npm run dev` has no API — use the production URL, or `npx vercel dev`.

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
