# Boss abilities

After wave 100, a second button (keyboard **Q**, phone button next to Skill) fires a **boss ability**. Warp specials stay on **E**. The pick is per run and is not saved to the profile.

## Pick screen

Clearing waves **100, 105, 110, …** opens a pick between waves. Each card is one unlocked boss, plus **Keep current**.

- Wave 100 unlocks the first 3 bosses in roster order (Seraph, Wraith, Hydra).
- Each later pick adds 3 more.
- Every roster boss is available by wave 145.
- Only bosses present in `BOSS_DEFS` that have library entries appear, so the pool grows when new bosses (and their abilities) are added.

Each boss has 2–3 player versions of its attacks. **Each run rolls one per boss**, so a boss’s card can differ between runs.

Skip-start at **wave 105 or later** opens the pick immediately, covering every boss unlocked up to that start wave. Co-op: each player picks their own ability.

## Button

- Keyboard: **Q**
- Phone: a second pad button next to Skill, with its own cooldown ring
- Warp special (E) is unchanged

## Mimic API

`window.__galaga.currentBossAbilityId(player)` and `window.__galaga.castBossAbility(who, id)` so Mimic (wave 145) can copy the current pick. Mimic reads the id and `bossAbilityDef`, then fires a **red enemy-bullet** version of that pattern. It does not call `castBossAbility` (that would spend the player's cooldown and spawn player shots).

## Library (waves 5–100)

Colors match each boss. Shots fire **up** from the player.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Seraph | 5 | `seraph-fan` | Feather fan, 5 white shots | 8s |
| | | `seraph-halo` | Feather ring from the hull | 10s |
| | | `seraph-dive` | Pierce ram-bolt up the file | 12s |
| Wraith | 10 | `wraith-spiral` | Violet spiral burst | 9s |
| | | `wraith-sweep` | Wide violet curtain | 10s |
| Hydra | 15 | `hydra-beam` | Green siphon laser | 11s |
| | | `hydra-rain` | Climbing venom rain | 9s |
| Colossus | 20 | `colossus-ring` | Expanding gold shock ring | 12s |
| | | `colossus-missiles` | 3 homing missiles | 10s |
| Chronos | 25 | `chronos-tick` | Nearby enemy shots reverse | 12s |
| | | `chronos-pendulum` | Two climbing arcs | 9s |
| Leviathan | 30 | `levi-surge` | Accordion tidal row | 10s |
| | | `levi-whip` | Twin helix bolts | 8s |
| | | `levi-depth` | Mines that hang, then rocket up | 12s |
| Inferno | 35 | `inferno-flare` | 3 fire lances | 9s |
| | | `inferno-embers` | Ember spray | 8s |
| Nullwarden | 40 | `null-well` | Pull nearby fodder | 14s |
| | | `null-gates` | Two side lasers | 12s |
| Basilisk | 45 | `basil-venom` | Arcing venom | 8s |
| | | `basil-gaze` | Wide petrify cone | 11s |
| Overlord | 50 | `over-barrage` | Dense gold volley | 10s |
| | | `over-decree` | Gold smash on the nearest foe | 12s |
| Mandala | 55 | `mandala-seal` | Copper petal ring | 10s |
| | | `mandala-wheel` | Spinning seal spray | 12s |
| Cenotaph | 60 | `ceno-slab` | Marble column laser | 11s |
| | | `ceno-crypt` | Crypt shard burst | 10s |
| Kaleido | 65 | `kale-shatter` | Glass shard fan | 8s |
| | | `kale-pane` | Glass lane laser | 12s |
| Helios | 70 | `helios-glare` | Flash that chips every foe | 14s |
| | | `helios-sear` | Noon pillar laser | 11s |
| Selene | 75 | `selene-crescent` | Two moon blades | 8s |
| | | `selene-tide` | Side-to-side lunar wave | 11s |
| Pentarch | 80 | `pent-pyre` | Fire fan | 9s |
| | | `pent-bolt` | Lightning pierce | 10s |
| | | `pent-rime` | Ice shards that freeze fodder | 12s |
| Loom | 85 | `loom-warp` | Taut red cut-thread laser | 10s |
| | | `loom-weft` | Two crossing threads | 12s |
| | | `loom-cocoon` | Spiral of gold threads | 14s |
| Tessera | 90 | `tess-rook` | File and rank detonate | 11s |
| | | `tess-bishop` | Both diagonals | 11s |
| | | `tess-knight` | L-shaped bursts | 10s |
| Requiem | 95 | `req-hymn` | Gold choir fan | 9s |
| | | `req-gap` | Expanding ring that clears enemy shots | 12s |
| | | `req-canon` | Two offset gapped rings | 14s |
| Terminus | 100 | `term-echo` | Ghost fan from where you just were | 12s |
| | | `term-medley` | Gold fan plus a clear pulse | 14s |
| | | `term-key` | Bursts on the nearest three foes | 13s |

Co-op replicates the ability id, Q input, and colored ability shots on netcodec VER 11.

## Library (waves 105–125)

Hourglass through Orrery. Wave-120 Hydra is id `lernaean` (heads), distinct from wave-15 siphon Hydra.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Hourglass | 105 | `hour-sand` | Amber sand grains spray up | 9s |
| | | `hour-pile` | Climbing dune slam | 11s |
| | | `hour-rewind` | Enemy shots fly back along their paths | 13s |
| Lanternmoth | 110 | `moth-glint` | Tight lantern glint volley | 8s |
| | | `moth-swarm` | Wide climbing swarm | 10s |
| | | `moth-lamp` | Pierce cone of lantern light | 12s |
| Lodestar | 115 | `lode-red` | Red polarity fan | 9s |
| | | `lode-blue` | Blue polarity fan | 9s |
| | | `lode-pulsar` | Red and blue fans together | 12s |
| Hydra | 120 | `lern-heads` | Three offset head-bolts | 9s |
| | | `lern-beam` | Green neck pierce beam | 11s |
| | | `lern-fan` | Climbing hydra volley | 10s |
| Orrery | 125 | `orr-orbit` | Brass planet burst | 10s |
| | | `orr-sling` | Paired sling shot | 9s |
| | | `orr-core` | Gravity well yank | 13s |

## Library (waves 130–150)

Prism through Axiom. Wave 145 unlocks the full 30-boss roster.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Prism | 130 | `prism-split` | Three chromatic lances | 9s |
| | | `prism-refract` | Split fan through gold glass | 10s |
| | | `prism-crystal` | Returning shard ring | 12s |
| Maelstrom | 135 | `mael-current` | Climbing tidal row | 9s |
| | | `mael-gyre` | Spinning whirl of shots | 11s |
| | | `mael-maw` | Smash on the nearest foe | 12s |
| Cartographer | 140 | `cart-chart` | Three mapped bolts | 9s |
| | | `cart-remap` | File and rank through the hull | 11s |
| | | `cart-atlas` | Bursts on the nearest two foes | 13s |
| Mimic | 145 | `mimic-copy` | Ghost fan from where you just were | 10s |
| | | `mimic-shadow` | Red curtain climbs the field | 11s |
| | | `mimic-doppel` | Twin fans from offset ghosts | 13s |
| Axiom | 150 | `axiom-up` | Climbing row that inverts the lane | 10s |
| | | `axiom-bounce` | Twin helix bolts | 9s |
| | | `axiom-mix` | Gold fan plus a shot-clearing pulse | 14s |

