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

Colors match each boss. Shots aim from the player at the nearest enemy (or the other ship in PvP). Each cast uses that boss attack’s shot count, speed, size, and pattern. Damage is boss-weight: a volley clears normal enemies and takes a real chunk out of a boss, not a pulse-chip. Cooldowns are short enough that a copied pattern is usable in a fight.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Seraph | 5 | `seraph-fan` | 5-feather Seraph fan at the nearest foe | 5.5s |
| | | `seraph-halo` | 8-shot halo from the hull | 6.5s |
| | | `seraph-dive` | Pierce ram-bolt through the nearest foe | 6.5s |
| Wraith | 10 | `wraith-spiral` | 10-shot violet spiral | 6s |
| | | `wraith-sweep` | 5-shot Wraith curtain at the nearest foe | 6s |
| Hydra | 15 | `hydra-beam` | Green siphon laser through the nearest foe | 6.5s |
| | | `hydra-rain` | 7 siphon bolts at the nearest foe | 5.5s |
| Colossus | 20 | `colossus-ring` | Expanding gold shock ring | 7s |
| | | `colossus-missiles` | 3 homing missiles | 6.5s |
| Chronos | 25 | `chronos-tick` | Nearby enemy shots reverse, then a 5-shot fan | 7s |
| | | `chronos-pendulum` | Two pendulum bolts through the nearest foe | 5.5s |
| Leviathan | 30 | `levi-surge` | 4-shot accordion row at the nearest foe | 6s |
| | | `levi-whip` | Twin helix bolts at the nearest foe | 5.5s |
| | | `levi-depth` | 3 mines that hang, then rocket at foes | 7s |
| Inferno | 35 | `inferno-flare` | 3 fire lances at the nearest foe | 5.5s |
| | | `inferno-embers` | 8-shot ember spray at the nearest foe | 5.5s |
| Nullwarden | 40 | `null-well` | Void well that yanks fodder and rips them | 7.5s |
| | | `null-gates` | Two side lasers through the field | 6.5s |
| Basilisk | 45 | `basil-venom` | 5 arcing venom bolts at the nearest foe | 5.5s |
| | | `basil-gaze` | 6-shot petrify cone at the nearest foe | 6.5s |
| Overlord | 50 | `over-barrage` | 7-shot gold barrage at the nearest foe | 6s |
| | | `over-decree` | Gold smash on the nearest foe | 7s |
| Mandala | 55 | `mandala-seal` | 8-shot copper petal ring | 6s |
| | | `mandala-wheel` | 9-shot spinning seal spray | 6.5s |
| Cenotaph | 60 | `ceno-slab` | Marble column laser through the nearest foe | 6.5s |
| | | `ceno-crypt` | 6-shot crypt burst | 6s |
| Kaleido | 65 | `kale-shatter` | 6 glass shards at the nearest foe | 5.5s |
| | | `kale-pane` | Glass lane laser through the nearest foe | 6.5s |
| Helios | 70 | `helios-glare` | Flash that hits every foe hard | 7.5s |
| | | `helios-sear` | Noon pillar through the nearest foe | 6.5s |
| Selene | 75 | `selene-crescent` | Two moon-blade helix bolts | 5.5s |
| | | `selene-tide` | 5-shot lunar wave at the nearest foe | 6s |
| Pentarch | 80 | `pent-pyre` | 5-shot fire fan at the nearest foe | 5.5s |
| | | `pent-bolt` | Lightning pierce through the nearest foe | 6s |
| | | `pent-rime` | 4 ice shards that freeze fodder | 6.5s |
| Loom | 85 | `loom-warp` | Taut red cut-thread through the nearest foe | 6s |
| | | `loom-weft` | Two crossing threads | 6.5s |
| | | `loom-cocoon` | 12-shot gold spiral | 7.5s |
| Tessera | 90 | `tess-rook` | File and rank detonate | 6.5s |
| | | `tess-bishop` | Both diagonals | 6.5s |
| | | `tess-knight` | L-shaped bursts | 6s |
| Requiem | 95 | `req-hymn` | 5-shot gold choir fan | 5.5s |
| | | `req-gap` | Expanding ring that clears shots and rips foes | 7s |
| | | `req-canon` | Two offset rings | 7.5s |
| Terminus | 100 | `term-echo` | Ghost fan, then a delayed copy | 6.5s |
| | | `term-medley` | 5-shot fan plus a clear pulse | 7.5s |
| | | `term-key` | Bursts on the nearest three foes | 7s |

Co-op replicates the ability id, Q input, and colored ability shots on netcodec VER 11.

## Library (waves 105–125)

Hourglass through Orrery. Wave-120 Hydra is id `lernaean` (heads), distinct from wave-15 siphon Hydra.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Hourglass | 105 | `hour-sand` | 6 amber sand grains at the nearest foe | 5.5s |
| | | `hour-pile` | 4-shot dune slam at the nearest foe | 6s |
| | | `hour-rewind` | Enemy shots fly back along their paths | 8s |
| Lanternmoth | 110 | `moth-glint` | 5 lantern glints at the nearest foe | 5.5s |
| | | `moth-swarm` | 8-shot climbing swarm at the nearest foe | 6s |
| | | `moth-lamp` | Pierce cone of lantern light | 6.5s |
| Lodestar | 115 | `lode-red` | 5-shot red polarity fan at the nearest foe | 5.5s |
| | | `lode-blue` | 5-shot blue polarity fan at the nearest foe | 5.5s |
| | | `lode-pulsar` | Red and blue fans together | 6.5s |
| Hydra | 120 | `lern-heads` | Three head-bolts at the nearest foe | 5.5s |
| | | `lern-beam` | Green neck pierce beam | 6.5s |
| | | `lern-fan` | 7-shot hydra volley | 6s |
| Orrery | 125 | `orr-orbit` | 8 brass planet-shots from the hull | 6s |
| | | `orr-sling` | Paired sling through the nearest foe | 5.5s |
| | | `orr-core` | Gravity well that yanks and rips fodder | 7.5s |

## Library (waves 130–150)

Prism through Axiom. Wave 145 unlocks the full 30-boss roster.

| Boss | Wave | Ability ids | What it does | CD |
| --- | ---: | --- | --- | ---: |
| Prism | 130 | `prism-split` | Three Prism lances through the nearest foe | 5.5s |
| | | `prism-refract` | 5-shot refraction at the nearest foe | 6s |
| | | `prism-crystal` | 8 returning shards from the hull | 6.5s |
| Maelstrom | 135 | `mael-current` | 4-shot tidal row at the nearest foe | 5.5s |
| | | `mael-gyre` | 10-shot gyre from the hull | 6.5s |
| | | `mael-maw` | Smash on the nearest foe | 7s |
| Cartographer | 140 | `cart-chart` | Three mapped bolts at the nearest foe | 5.5s |
| | | `cart-remap` | File and rank through the hull | 6.5s |
| | | `cart-atlas` | Bursts on the nearest two foes | 7s |
| Mimic | 145 | `mimic-copy` | Ghost fan, then a delayed copy | 6s |
| | | `mimic-shadow` | 5-shot shadow curtain | 6s |
| | | `mimic-doppel` | Twin 8-shot bursts from offset ghosts | 7s |
| Axiom | 150 | `axiom-up` | 4-shot Axiom row at the nearest foe | 6s |
| | | `axiom-bounce` | Twin helix bolts at the nearest foe | 5.5s |
| | | `axiom-mix` | 5-shot fan plus a shot-clearing pulse | 7.5s |

