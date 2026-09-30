# Post-55 bosses

Playfield is 240×360. Red hurts, cyan is safe, white flashes before an attack, gold is a weak point. Attacks aim at the live player, including forward/back movement toward the midline `y = H/2`.

Mandala (55), Cenotaph (60), Kaleido (65), Helios (70), Selene (75), and Pentarch (80) already shipped. Kits below are the wave 85–100 first-cycle bosses. Telegraphs on Loom, Requiem, and Terminus are shorter than Pentarch’s (0.36s vs 0.5s). Tessera phase 1 is slower so the full board stays readable; later Tessera phases stay quicker.

## Loom — wave 85, the weaver

3 exclusive phases. Base HP 740. HP ticks at 66% and 33%. Spider body with glowing spinnerets.

- Shoots gold anchor knots onto the walls and ceiling. A thin cyan thread links each pair, flickers white, then pulls taut into a red laser. Shoot a gold knot to cut its thread.
- **Warp (p1):** 2 or 3 threads.
- **Weft (p2):** Crossing threads form a net with moving gaps.
- **Cocoon (p3):** Threads spiral inward toward the player; cut a way out.

## Tessera — wave 90, the chessboard

3 exclusive phases. Base HP 790. HP ticks at 66% and 33%. Crowned marble body. The full chessboard is on the field from phase 1.

- Tiles light white, then detonate red.
- **Rook:** full row and column through the player.
- **Bishop:** both diagonals.
- **Knight:** L-shaped jumps aimed at the player.
- **p1:** one piece type per volley. The pattern lights during the telegraph and stays readable before tiles detonate.
- **p2 Two pieces:** two types at once, with one cyan safe tile.
- **p3 Checkmate:** the boss moves onto a landing tile that detonates. The grid fills with red taken tiles until a pawn minion is killed, which clears them.

## Requiem — wave 95, the choir

3 exclusive phases. Base HP 850. HP ticks at 66% and 33%. Cathedral organ with 4 or 5 floating choir satellites.

- Only the satellite glowing gold takes damage; the glow rotates on a beat. Shots on the body do nothing until Crescendo.
- Sound rings expand with one cyan gap. The gap aims into the player’s half of the field (below the midline) and stays on-screen.
- **p1:** one ring at a time.
- **p2 Canon:** overlapping rings share one reachable safe pocket. Expansion and cadence are slower than phase 1.
- **p3 Crescendo:** satellites merge into the body (now vulnerable). Rings stay slower than the old heartbeat and keep that same lined-up gap.

## Terminus — wave 100, the finale

5 exclusive phases, Pentarch-style banners and 80/60/40/20 HP ticks. Base HP 1550. Black-and-gold monolith with a core that opens.

| Phase | Banner | Kit |
| ---: | --- | --- |
| 1 Echo | IT REMEMBERS YOU | A translucent ghost ship replays the player’s path from 3 seconds ago and fires those shots back, tinted red. Stay off the recent path. Restored when the phase ends. |
| 2 Inversion | THE LINE MOVES | The movement midline becomes a visible bar that slides, shrinking or growing the space the player can move in. The boss bombards the open zone. Limits are phase-scoped and restored afterward. |
| 3 Keystones | BREAK THEM IN ORDER | Four keystone minions, each with a colored tether. The core is invulnerable until all four are broken in the rune order shown on the core. Out of order respawns that stone and fires a punishing burst. |
| 4 Collapse | THE WALLS CLOSE | Side walls close in. Shooting gold pylons on the walls pushes them back. Split fire between pylons and the boss. |
| 5 Terminus | EVERYTHING ENDS | Fast medley: an Echo ghost, one Loom thread, Tessera tiles, and a Requiem ring. At 5% HP a desperation beam sweeps with a single cyan gap. |

**Victory:** banner `WAVE 100 CLEARED` and a **Century Clear** XP bonus (`CENTURY_CLEAR_XP = 8000`) on the existing `run.xpBonus` path (same bank that skip-start and harder-kill XP use). First-cycle dedicated wave 100 only, not guests or later rematches. Skip-start past 100 also credits Century Clear.

Co-op replicates threads/knots, tiles, ghost, sliding midline, keystones, walls/pylons, choir sats, rings, pawn, and the desperation beam on netcodec VER 7 (`bx` extras).
