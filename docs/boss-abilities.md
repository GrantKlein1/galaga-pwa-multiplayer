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

Colors match each boss. Shots aim from the player at the nearest enemy (or the other ship in PvP). Each cast keeps that boss attack’s shot count and pattern. Damage is player-scale, about 3.5× the old boss-kit copy: a volley one-shots groups of fodder and takes a real chunk out of a late boss. Shots are larger, pierce a column, and splash nearby hulls so a packed formation does not eat the cast. Rings and wells apply their damage on first contact. Cooldowns are 3.4–5.5s so the button is usable in a fight.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Seraph | 5 | `seraph-fan` | 5-feather Seraph fan at the nearest foe | 3.4s |
| | | `seraph-halo` | 8-shot halo from the hull | 4.2s |
| | | `seraph-dive` | Pierce ram-bolt through the nearest foe | 4.2s |
| Wraith | 10 | `wraith-spiral` | 10-shot violet spiral | 3.8s |
| | | `wraith-sweep` | 5-shot Wraith curtain at the nearest foe | 3.8s |
| Hydra | 15 | `hydra-beam` | Green siphon laser through the nearest foe | 4.2s |
| | | `hydra-rain` | 7 siphon bolts at the nearest foe | 3.4s |
| Colossus | 20 | `colossus-ring` | Expanding gold shock ring | 4.6s |
| | | `colossus-missiles` | 3 homing missiles | 4.2s |
| Chronos | 25 | `chronos-tick` | Nearby enemy shots reverse, then a 5-shot fan | 4.6s |
| | | `chronos-pendulum` | Two pendulum bolts through the nearest foe | 3.4s |
| Leviathan | 30 | `levi-surge` | 4-shot accordion row at the nearest foe | 3.8s |
| | | `levi-whip` | Twin helix bolts at the nearest foe | 3.4s |
| | | `levi-depth` | 3 mines that hang, then rocket at foes | 4.6s |
| Inferno | 35 | `inferno-flare` | 3 fire lances at the nearest foe | 3.4s |
| | | `inferno-embers` | 8-shot ember spray at the nearest foe | 3.4s |
| Nullwarden | 40 | `null-well` | Void well that yanks fodder and rips them | 5s |
| | | `null-gates` | Two side lasers through the field | 4.2s |
| Basilisk | 45 | `basil-venom` | 5 arcing venom bolts at the nearest foe | 3.4s |
| | | `basil-gaze` | 6-shot petrify cone at the nearest foe | 4.2s |
| Overlord | 50 | `over-barrage` | 7-shot gold barrage at the nearest foe | 3.8s |
| | | `over-decree` | Gold smash on the nearest foe | 4.6s |
| Mandala | 55 | `mandala-seal` | 8-shot copper petal ring | 3.8s |
| | | `mandala-wheel` | 9-shot spinning seal spray | 4.2s |
| Cenotaph | 60 | `ceno-slab` | Marble column laser through the nearest foe | 4.2s |
| | | `ceno-crypt` | 6-shot crypt burst | 3.8s |
| Kaleido | 65 | `kale-shatter` | 6 glass shards at the nearest foe | 3.4s |
| | | `kale-pane` | Glass lane laser through the nearest foe | 4.2s |
| Helios | 70 | `helios-glare` | Flash that hits every foe hard | 5s |
| | | `helios-sear` | Noon pillar through the nearest foe | 4.2s |
| Selene | 75 | `selene-crescent` | Two moon-blade helix bolts | 3.4s |
| | | `selene-tide` | 5-shot lunar wave at the nearest foe | 3.8s |
| Pentarch | 80 | `pent-pyre` | 5-shot fire fan at the nearest foe | 3.4s |
| | | `pent-bolt` | Lightning pierce through the nearest foe | 3.8s |
| | | `pent-rime` | 4 ice shards that freeze fodder | 4.2s |
| Loom | 85 | `loom-warp` | Taut red cut-thread through the nearest foe | 3.8s |
| | | `loom-weft` | Two crossing threads | 4.2s |
| | | `loom-cocoon` | 12-shot gold spiral | 5s |
| Tessera | 90 | `tess-rook` | File and rank detonate | 4.2s |
| | | `tess-bishop` | Both diagonals | 4.2s |
| | | `tess-knight` | L-shaped bursts | 3.8s |
| Requiem | 95 | `req-hymn` | 5-shot gold choir fan | 3.4s |
| | | `req-gap` | Expanding ring that clears shots and rips foes | 4.6s |
| | | `req-canon` | Two offset rings | 5s |
| Terminus | 100 | `term-echo` | Ghost fan, then a delayed copy | 4.2s |
| | | `term-medley` | 5-shot fan plus a clear pulse | 5s |
| | | `term-key` | Bursts on the nearest three foes | 4.6s |

Co-op replicates the ability id, Q input, and colored ability shots on netcodec VER 11.

## Library (waves 105–125)

Hourglass through Orrery. Wave-120 Hydra is id `lernaean` (heads), distinct from wave-15 siphon Hydra.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Hourglass | 105 | `hour-sand` | 6 amber sand grains at the nearest foe | 3.4s |
| | | `hour-pile` | 4-shot dune slam at the nearest foe | 3.8s |
| | | `hour-rewind` | Enemy shots fly back, then a shock pulse | 5.5s |
| Lanternmoth | 110 | `moth-glint` | 5 lantern glints at the nearest foe | 3.4s |
| | | `moth-swarm` | 8-shot climbing swarm at the nearest foe | 3.8s |
| | | `moth-lamp` | Pierce cone of lantern light | 4.2s |
| Lodestar | 115 | `lode-red` | 5-shot red polarity fan at the nearest foe | 3.4s |
| | | `lode-blue` | 5-shot blue polarity fan at the nearest foe | 3.4s |
| | | `lode-pulsar` | Red and blue fans together | 4.2s |
| Hydra | 120 | `lern-heads` | Three head-bolts at the nearest foe | 3.4s |
| | | `lern-beam` | Green neck pierce beam | 4.2s |
| | | `lern-fan` | 7-shot hydra volley | 3.8s |
| Orrery | 125 | `orr-orbit` | 8 brass planet-shots from the hull | 3.8s |
| | | `orr-sling` | Paired sling through the nearest foe | 3.4s |
| | | `orr-core` | Gravity well that yanks and rips fodder | 5s |

## Library (waves 130–150)

Prism through Axiom. Wave 145 unlocks the full 30-boss roster.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Prism | 130 | `prism-split` | Three Prism lances through the nearest foe | 3.4s |
| | | `prism-refract` | 5-shot refraction at the nearest foe | 3.8s |
| | | `prism-crystal` | 8 returning shards from the hull | 4.2s |
| Maelstrom | 135 | `mael-current` | 4-shot tidal row at the nearest foe | 3.4s |
| | | `mael-gyre` | 10-shot gyre from the hull | 4.2s |
| | | `mael-maw` | Smash on the nearest foe | 4.6s |
| Cartographer | 140 | `cart-chart` | Three mapped bolts at the nearest foe | 3.4s |
| | | `cart-remap` | File and rank through the hull | 4.2s |
| | | `cart-atlas` | Bursts on the nearest two foes | 4.6s |
| Mimic | 145 | `mimic-copy` | Ghost fan, then a delayed copy | 3.8s |
| | | `mimic-shadow` | 5-shot shadow curtain | 3.8s |
| | | `mimic-doppel` | Twin 8-shot bursts from offset ghosts | 4.6s |
| Axiom | 150 | `axiom-up` | Climbing blade row with a moving gap | 3.8s |
| | | `axiom-bounce` | Wall ricochets that bounce once | 3.4s |
| | | `axiom-mix` | Punishing burst from the core if the seal order is wrong | 5s |

