# Post-55 bosses

Playfield is 240×360. Red hurts, cyan is safe, white flashes before an attack, gold is a weak point. Attacks aim at the live player, including forward/back movement toward the midline `y = H/2`.

Mandala (55), Cenotaph (60), Kaleido (65), Helios (70), Selene (75), and Pentarch (80) already shipped. Kits below are the wave 85–100 first-cycle bosses. Telegraphs on Loom, Requiem, and Terminus are shorter than Pentarch’s (0.36s vs 0.5s). Tessera phase 1 is slower so the full board stays readable; later Tessera phases stay quicker.

## Loom — wave 85, the weaver

3 exclusive phases. Base HP 740. HP ticks at 66% and 33%. Spider body with glowing spinnerets.

- Shoots gold anchor knots onto the walls and ceiling. A thin cyan thread links each pair, flickers white, then pulls taut into a red laser. Shoot a gold knot to cut its thread.
- Periodically fires a red shuttle dart at the live player's x,y, including the bottom of the 240×360 field. A white flash and line telegraph it. Sitting at the bottom is not safe.
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

Co-op replicates threads/knots, tiles, ghost, sliding midline, keystones, walls/pylons, choir sats, rings, pawn, the desperation beam, Hourglass sand/glass, Lanternmoth lanterns/cone, Lodestar polarity, Hydra heads/stumps, Orrery planets, Prism prisms/rays, Maelstrom flow, Cartographer panes/pins, Mimic ghosts, and Axiom rule cards plus orbit/wake/pocket/seals on netcodec VER 12 (`bx` extras).

## Hourglass — wave 105, the glass

3 exclusive phases. Base HP 1700. HP ticks at 66% and 33%. Amber glass body with a gold lower bulb.

- Sand pours from the top (white telegraph) and piles on the floor, raising the playable band. Standing in the pile hurts.
- **Pour (p1):** SAND FALLS. Aimed sand grains plus a slow rise. Shoot the gold glass to drain the pile and hurt the boss.
- **Pile (p2):** THE PILE RISES. Faster pour and a red slam along the dune.
- **Timeslip (p3):** TIME RUNS BACK. A white flash, then enemy shots fly back along the paths they just took.

Telegraphs are 0.28s, shorter than Terminus.

## Lanternmoth — wave 110, the lamp

3 exclusive phases. Base HP 1800. HP ticks at 66% and 33%. Moth body with a gold lantern abdomen.

- The field goes dark except for a cyan light cone around the player. Enemy shots glint white when fired, then show only inside the light (they still hurt in the dark).
- Shoot gold lanterns to light a patch of the field for a few seconds.
- **Glint (p1):** THE LAMP GOES OUT. Aimed glint volleys, 2 lanterns.
- **Swarm (p2):** THE SWARM. Wider fans, 3 lanterns.
- **Gloom (p3):** LIGHT DIES. The cone shrinks; 4 lanterns.

## Lodestar — wave 115, the pole

3 exclusive phases. Base HP 1900. HP ticks at 66% and 33%. Star body whose core matches the current polarity.

- The ship wears a red or blue countdown ring. Shots that match the ring pass through; opposite-color shots hurt.
- **Red (p1):** CHOOSE A STAR. Slow swap, dodgeable red fans plus a full-width mixed row (red and blue at the same time).
- **Binary (p2):** BINARY. Blue fans plus a mixed full-width row, faster swap.
- **Pulsar (p3):** PULSAR. Both-color fans, then two mixed rows with different splits. Fastest ring.
- A full-width row is never one color. The split moves from volley to volley (thin left, thin right, or nearer the middle). Stand in the section that matches the ring. Both colors are telegraphed before the row fires.

## Hydra — wave 120, the heads (id `lernaean`)

3 exclusive phases. Base HP 2000. HP ticks at 66% and 33%. Distinct from wave-15 Hydra. Heads sit on necks attached to the body. The body ignores shots until every remaining neck is cauterized (or nothing is left to shoot); then the gold heart can be killed.

- Each living head has its own telegraphed attack at the live player: a delayed needle burst, a forked heavy bolt, or a swaying five-pellet spray. Head HP is 20 (24 on a regrow).
- Cutting a head leaves a gold stump on that neck for about a second. Hit the stump to cauterize it and wound the boss. Miss it, and two more heads grow (capped at 7).
- **Heads (p1):** HEADS WILL GROW. Three heads, each with its own shot.
- **Neck (p2):** TWO FROM ONE. Four heads.
- **Hydra (p3):** THE HYDRA. Five heads.

## Orrery — wave 125, the wheels

3 exclusive phases. Base HP 2150. HP ticks at 66% and 33%. Brass core with gold heart.

- Planets orbit the boss. Gravity rings (cyan) show pull strength and bend player bullets. Shoot a planet to weaken its pull. Curve a shot into the gold core.
- **Orbit (p1):** THE WHEELS TURN. Two planets.
- **Alignment (p2):** ALIGNMENT. Three planets, a sling shot at the player.
- **Core (p3):** THE CORE. Four planets, strongest pull.

## Prism — wave 130, the splitter

3 exclusive phases. Base HP 2300. HP ticks at 66% and 33%. Crystal body with gold prisms.

- Beams split through gold prisms. Rotate a prism (shoot it) so a split returns into the boss (~3.5% max HP). Prisms stay on the field until the next set spawns; shooting them only rotates them.
- **Split (p1):** LIGHT SPLITS. Two prisms, split beams, a shard fan from each prism, and a red lattice through the live player with cyan gaps.
- **Refract (p2):** THE SPLIT. Three prisms, denser refraction, plus bouncing ricochets aimed at the player.
- **Crystal (p3):** RETURN FIRE. Four prisms; a returning beam can hit the body. Adds a gapped ring (cyan pocket toward the player) on top of the fan, lattice, and ricochet.

## Maelstrom — wave 135, the whirlpool

3 exclusive phases. Base HP 2450. HP ticks at 66% and 33%. Deep-water body.

- A current drags the ship and shots. Cyan flow arrows show the pull.
- **Current (p1):** THE WATER TURNS. Modest flow plus aimed shots.
- **Gyre (p2):** THE GYRE. Stronger pull, a red fan.
- **Maw (p3):** THE MAW. Hardest flow and a slam on the player.

## Cartographer — wave 140, the map

4 exclusive phases. Base HP 2600. HP ticks at 75 / 50 / 25. The field is a 2×2 sliding-puzzle of map panes. The body stays damageable; gold pins are extra weak points.

- Linked pane edges share a color (red / cyan / gold / white). Fly off a colored edge and you wrap to the matching edge on its linked pane. Unlinked edges are walls.
- Panes slide into adjacent slots. Telegraphs stay short. Attacks aim at the live player.
- **Chart (p1):** THE MAP OPENS. Slow slides, three-shot red volleys.
- **Remap (p2):** THE MAP SLIDES. Panes shift and wrap pairs scramble; four-shot volleys.
- **Fold (p3):** EDGES AGREE. Faster slides, denser volleys.
- **Atlas (p4):** THE ATLAS. Hardest slide, a red slam, densest volleys.

## Mimic — wave 145, the copy

4 exclusive phases. Base HP 2800. HP ticks at 75 / 50 / 25. It wears your silhouette.

- A red ghost replays the player's path from **1.6s** ago and fires those shots back. Stay off the recent path.
- Copies the equipped boss ability via `currentBossAbilityId` + `bossAbilityDef` as **red enemy fire**. It does not spend the player's cooldown.
- **Copycat (p1):** IT WEARS YOUR FACE. One ghost, ability copy.
- **Shadow (p2):** IT DODGES YOU. Ghost plus an aimed red shot.
- **Mock (p3):** IT SHOOTS YOU. Ghost plus a red fan.
- **Doppel (p4):** TWO OF YOU. Two delayed ghosts.

## Axiom — wave 150, the finale

6 exclusive phases, Pentarch-style banners and 83 / 67 / 50 / 33 / 17 HP ticks. Base HP 3000. Gold rule cards. Every rule is fully reverted when the phase or fight ends (`clearAxiomRules`).

| Phase | Banner | Kit |
| ---: | --- | --- |
| 1 Fall up | SHOTS FALL UP | Ship locked to the top band. Climbing blade row with one moving cyan gap, then a zipper of side blades. |
| 2 Bounce | YOUR BULLETS BOUNCE | Player bullets bounce **once**. After a bounce they are red and damage the player, then they are gone (no second bounce). Wall ricochets and a bounce sweep. The rule card stays. Bounce turns off when the phase ends. |
| 3 Graze | GRAZING HEALS | A 0.35s near-miss then +1 life or shield (1.15s lock), plus graze needles and a gapped swath. |
| 4 Orbit | ORBIT | A circle in the middle. The boss moves inside. The player is locked to the outer ring; left/right (or the stick) slides around it. The ship faces inward and shots fire toward the center. Rotating red shield arcs block free hits — orbit to an open gap. Normal movement returns when the phase ends. |
| 5 Past | THE PAST CLOSES | A crushing red trail follows the path you flew ~2s ago. Standing still or repeating a line gets you hit. A gold pocket orbits the field; the boss only takes damage while you are inside it. |
| 6 Seals | BREAK THE SEALS | The core is immune until four seals break in the order on the card (shoot / fly through / bounced shot / strike from the ring). Wrong action bursts and resets. After all four the core opens briefly, then the seals reshuffle. |

**Victory:** banner `WAVE 150 CLEARED` and an **Axiom Clear** XP bonus (`AXIOM_CLEAR_XP = 12000`) on the existing `run.xpBonus` path. First-cycle dedicated wave 150 only, not guests or later rematches. Skip-start past 150 also credits Axiom Clear.

None of these bosses guest. Health gems still drop only on each id’s first-cycle dedicated debut, plus the 12% XP-boost roll.

