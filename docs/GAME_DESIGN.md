# Game Design

The complete mechanical design. Story content lives in [CHAPTERS.md](CHAPTERS.md); look/sound live in [ART_DIRECTION.md](ART_DIRECTION.md) and [AUDIO_DIRECTION.md](AUDIO_DIRECTION.md); how it's built lives in [ARCHITECTURE.md](ARCHITECTURE.md).

## Genre and world structure

A **side-view point-and-click adventure-RPG** — kid's Monkey Island, not top-down Zelda.

- **Rooms** are painted storybook dioramas one to two screens wide (gentle camera pan). Violet tap-walks along a ground band with slight depth scaling. Doorway exits glow softly; walking into one transitions rooms.
- **The castle map** is an illustrated overview for travel between unlocked locations. Tap a location, go there. There are no navigation puzzles anywhere in the game — a 6-year-old can never get lost, and "where do I go" is always answered by a glowing star on the map.
- **Hotspots** are the interactive layer of a room: people (talk), objects (inspect/use), and spell targets (glow when a known spell applies). Minimum hit area 88px in virtual coordinates — little fingers get big targets.

Why side-view rather than top-down: it eliminates spatial navigation as a skill requirement, it turns every room into a full-screen illustration (where the art budget shines), and it matches how picture books frame scenes — the visual language she already reads fluently.

## Controls: one finger does everything

| Tap on… | Result |
|---|---|
| Ground | Violet walks there |
| A person | Walk over + start conversation |
| An object | Walk over + inspect or use it (Violet comments aloud) |
| The wand button | Spellbook fan opens |
| A spell card, then a glowing target | Cast |
| A doorway / map location | Travel |

No drags, holds, swipes, or multi-touch in the core loop. Drag/trace gestures appear only in optional class minigames (wand-tracing practice), never on the critical path. Every tap gives immediate feedback — a sparkle, a sound, a head-turn — even taps on nothing.

## The spellbook is the character sheet

There are no stats, XP numbers, or equipment. Progression is **spells, and spells are verbs**: each one changes what Violet can do to the world, and the world is gated by those verbs (real RPG ability-gating with zero reading).

| Spell | Verb | Taught in | Signature look/sound |
|---|---|---|---|
| **Lumos** | Light dark places, reveal hidden things | Ch. 3 | Warm white orb, soft choir shimmer |
| **Wingardium Leviosa** | Lift and move heavy things | Ch. 3 (Charms class — her book's iconic scene) | Feather-gold swirl, harp gliss |
| **Alohomora** | Open locked doors and chests | Ch. 4 | Brass click-cascade, keyhole glow |
| **Incendio** (bluebell flames) | Light/burn obstacles | Ch. 6 | Blue dancing flames, crackle |
| **Reparo** | Fix broken things | Ch. 5 | Pieces reverse-shatter, glass chime |
| **Expelliarmus** | THE duel spell — disarm | Ch. 7 (Dueling Club nod, from film 2) | Scarlet bolt, thunderclap |
| **Shield** | Block in duels | Ch. 7 | Golden dome, deep bell |

The duel block is called simply **"Shield"** — one word she can read, no spell name she hasn't met (Protego is beyond her books). Voice line shouts "Shield!"

**Casting flow:** tap the wand button → time softens (brief slow-mo, skipped under reduced motion) and the spellbook fans out as icon cards, each with its icon and one-word name → tap a spell → every valid target in the room shimmers gold → tap a target → wand gesture auto-plays, the bolt flies with generous homing, the effect lands. Tap empty space or the wand again to cancel — cancelling is always free and never scolded. **Outside duels, casting a known spell at a valid target always succeeds.** Skill lives in *knowing which verb to use where*, never in aim or timing.

**Learning a NEW spell — incantation assembly.** The first time a spell is taught (in class, in the fiction), the incantation appears on a floating parchment ribbon and she *builds the word*: big rune-tiles float around the ribbon and she taps them into place — L… U… M… O… S — each tile speaks its letter sound as it lands and the wand tip glows brighter, until the completed word erupts into her first cast, with maximum sparkle. Spelling the spell IS casting the spell. Wrong tile? It bounces off with a comic fizzle-note (never a buzzer), and the next needed tile starts to shimmer after a couple of seconds — the standard hint ladder, applied to letters. Long incantations assemble by syllable tiles instead ("WIN · GAR · DIUM  LEVI · O · SA") with the voice chanting each syllable as it lands. **Once learned, a spell is cast by icon tap forever — mastered content is never re-drilled.** Replaying the assembly is available in the spellbook as optional "wand practice," because she'll ask to.

## Dialogue: voice-first

- The speaking character gets an animated portrait attached to the edge of one coherent deckled dialogue card; the line plays **aloud** (ElevenLabs, British cast — see [AUDIO_DIRECTION.md](AUDIO_DIRECTION.md)); **1–3 easy words** are printed directly on that card to distill the line ("Follow me!", "A troll!", "Well done!").
- Tap the separate brass advance medallion — or, for child-friendly forgiveness, anywhere outside **Again** — to continue; the disjoint 88×88 **Again** control re-plays the current line, which kids love and doubles as "I missed it." Rolled scroll ends and nested caption panels are not part of the dialogue language.
- Story objects that are meant to be read or studied, beginning with Violet’s Hogwarts letter, remain on screen until an explicit voiced action is chosen. Dialogue never covers them on an automatic timer.
- **Player choices are 2–3 icon cards** with at most 1–2 word labels. There are no wrong answers ever — choices color the response, unlock flavor, or pick cosmetics; they never fail a quest.
- Caption text doubles as reading practice: consistent words recur (Look, Go, Help, Wow) so she starts recognizing them.

## Quests and guidance

A flag-machine drives linear main quests per chapter plus small optional side quests (kindness errands, hidden collectibles).

Guidance is diegetic and layered so she is never lost but never feels handheld:

1. NPCs say the objective out loud when they give it.
2. The **quest star** (HUD, top-left) can be tapped anytime to re-hear the current objective — the kid-proof "what was I doing?" button, essential for 20–30 minute sessions a week apart.
3. The map marks the destination with a glowing star.

**Hint escalation (automatic, invisible):** ~20 seconds idle → her pet looks toward the objective; ~45 seconds → a companion NPC repeats the objective line; three failed attempts at a puzzle → a sparkle trail drifts toward the answer; further failures → the target glows outright and a single tap completes it. The game quietly closes the gap; she always experiences "I figured it out."

**Resume recap:** on returning to a saved game, a short voiced recap plays ("Last time, you found Trevor! Professor Flitwick is waiting.") before dropping her at the start of the current scene. Stopping is always safe; resuming is always oriented.

## Encounters and duels

The encounter grammar, taught gradually (troll in Ch. 5 → Draco duel in Ch. 7 → Voldemort in Ch. 8):

- **Telegraphed rhythm, two verbs.** The enemy winds up BIG (large animation + distinct sound + color flash — audio and visual dual-coded) → she taps the **Shield** button. After 2–3 blocks, an **opening** flashes gold → she taps her spell card for a big satisfying hit.
- **No health numbers.** She has three sparkle-hearts; enemies have visible phase states (standing → staggered → defeated).
- **Timing windows start ~1.2s and never drop below ~0.7s** (finale only). Every consecutive miss silently widens the window ~15% (rubber-band assist — invisible, resets on success). Difficulty rises through *pattern length and variety*, not speed demands.
- **Losing is comedy, not punishment.** She tumbles onto her bum, cartoon stars circle her head, a friend delivers a pick-me-up line, and the retry starts instantly — **with the enemy still weakened at the phase she reached.** Phase checkpoints always hold. There is no way to lose progress in a fight.

**The Voldemort fight** (design target: her greatest victory, ~2–4 total attempts across phases):

- Phase 1 — Quirrell, hammy and stumbling: pure tutorial-refresher patterns, near-impossible to fail.
- Phase 2 — the turban unwinds, Voldemort's face revealed: patterns lengthen, one new telegraph.
- Phase 3 — wand-to-wand duel, the one genuinely dramatic beat of the game: longest patterns, tightest (still ≥0.7s) windows, ending in a held **Expelliarmus finisher**: time freezes, the incantation's letters flare up one by one around the locked wands, and she taps each glowing letter to charge the bolt — E… X… P… — untimed, unfailable (an untapped letter simply glows brighter), each tap swelling the light and the music until the word completes and the spell detonates. She *spells* the spell that beats Voldemort.
- Defeat animation is comic-deflating (he shrieks, shrinks, and poofs away as smoke) — menace resolved as triumph, not horror. Then the biggest celebration in the family game catalog: feast, house cup, fireworks, every friend cheering her by name. (Voice lines can include her actual name — she is Violet in-world.)

**The troll (Ch. 5)** is a puzzle-encounter that teaches the grammar gently: dodge zones (tap left/right when he swings — huge telegraphs), then his club glows → Wingardium Leviosa → tap the club → it floats over his head → tap → *bonk*. The book's own solution, playable — she will recognize it and feel smart.

## The learning layer

The game is quietly a learning game — and the word *quietly* is load-bearing. Kids can smell an educational game instantly, and the smell comes from recognizable failure modes: the fiction stopping for a lesson, quiz questions with right answers, praise-voice ("Great job!"), and drills wearing a costume. We are structurally immune to most of this because **Hogwarts is a school inside the fiction** — classes, incantations, recipes, and a magical library are canon. The learning never interrupts wizard land; it *is* wizard land.

### What she's actually practicing

| Skill | Where it hides |
|---|---|
| Letter recognition & spelling | Incantation assembly when learning each new spell; the Expelliarmus finisher; her name on the envelope in the first ten seconds of the game |
| Phonics exposure | Rune-tiles speak their letter sounds as they land; incantations are chanted by syllable ("Levi-OH-sa") |
| Sight words | Caption chips reuse a deliberate core vocabulary (Look, Go, Help, Follow, Found); spell names on cards; frog-card names that sound out when tapped |
| Word–object matching | Potion ingredient jars carry one-word labels ("FROG", "MOON") matched to pictogram recipes |
| Counting & numerals | Recipes call for counted ingredients ("3 beetle eyes" — tap three, voice counts along); flying rings count up |
| Following multi-step instructions | Potion recipes, wand-practice sequences |
| Pattern recognition & memory | Duel telegraphs, Ollivanders wand-box moment, chess picks |

### The anti-ed-game rules (non-negotiable)

1. **Always diegetic.** Every learning beat is an action in the world with a magical consequence — never a floating question. If it couldn't exist in the fiction, it doesn't exist in the game.
2. **Never gate the adventure on it.** Learning beats ride the same hint ladder as every puzzle: hesitation → shimmer → converges to completion. She can always brute-tap her way through and still feel like a wizard.
3. **Never re-drill mastered content.** A learned spell casts by icon tap forever. No spaced-repetition ambushes, no "let's practice again!"
4. **Failure is comedy with a payoff.** Wrong letters fizzle musically; wrong potion ingredients produce funny-colored smoke and a silly sound. Getting it wrong on purpose to see what happens is *play*, and the game rewards the curiosity with charm, then gently re-shows the way.
5. **No school voice.** Characters react in fiction ("Flitwick: *Splendid* wandwork!"), never in teacher-cadence ("You spelled it correctly!"). The word "learn" appears in classes because Hogwarts has classes, never in UI.
6. **Dosage cap.** At most one learning beat per scene. Class scenes carry the teaching; the adventure spine stays adventure. Between chapters the ratio of wonder-to-learning stays heavily wonder.
7. **Adaptive, invisibly.** Assembly starts as tap-the-shown-letters (matching). If she's cruising, occasionally one tile arrives blank-side-up (recall). Tracked by a simple hidden skill counter; never announced, never a level, capped gently.
8. **The tell test.** If a beat would look at home in an ed-game app-store screenshot, cut it or rewrite it.

### The parent dial

The parent panel has a single **learning dial: Off / Gentle / Stretchy** (default Gentle). Off replaces assemblies with a single wand-flourish tap; Stretchy leans toward recall tiles and slightly bigger words sooner. Dad tunes it without her ever knowing the dial exists — the insurance policy against ever ruining the game.

## Difficulty and frustration design

- Nothing in the world can hurt her outside encounters. Exploration has no timers, no chases, no fail states.
- No puzzle can dead-end: the hint ladder above always converges to completion.
- Encounters rubber-band invisibly and checkpoint every phase.
- "Easy to get into, easy to get out of trouble": every screen has an obvious single next action; cancel/back is always free; the parent panel (below) can skip any scene or replay any chapter.
- The challenge budget is spent in exactly two places she cares about: duels (opt-in tension, heavily assisted) and the finale (the fight she asked for). Everything else is richness — secrets, characters, collectibles — not resistance.

## Save and persistence

localStorage, autosaved on every flag mutation (debounced), written through on scene change.

```js
// key: 'violets-wizard-save-v1'
{
  schemaVersion: 1,
  createdAt, updatedAt,
  chapter: 3,                       // highest unlocked chapter
  scene: 'greatHall',               // resume point (scene granularity)
  questFlags: { 'ch3.toadFound': true /* content-addressed, namespaced */ },
  spells: ['lumos', 'leviosa'],
  house: 'gryffindor',              // from the Sorting
  pet: { type: 'cat', name: 'Biscuit' },
  cards: ['dumbledore', 'morgana'], // chocolate frog card ids
  housePoints: 120,
  learning: { letterSkill: 2 },     // hidden adaptive counter(s), never shown
  settings: { muted: false, reducedMotion: false, learning: 'gentle' }
}
```

- **Migrations:** every schema bump ships a migration function; the previous save is copied to a `-backup` key before migrating. Her witch must survive months of development.
- **New game is guarded**: hidden inside the parent panel behind a 3-second long-press plus a deliberate confirm. No sibling tap can wipe her.
- **Export/import** via the parent panel (copy/paste JSON) so the save can move between devices.

## The parent panel (also the dev panel)

Long-press the small gear (3 seconds) → panel for dad: chapter select and scene skip/replay, volume controls, reduced-motion toggle, the learning dial (Off/Gentle/Stretchy), save export/import, guarded new game. This doubles as the debug menu during development.

## HUD: uncluttered, highly stylized

Exactly three persistent elements, all corners, all icon-only (see [ART_DIRECTION.md](ART_DIRECTION.md) for the look):

- **Wand button** (bottom-right) — opens the spellbook fan.
- **Satchel** (bottom-left) — opens a full-screen spread containing the castle map, the chocolate-frog card album, and the small settings gear.
- **Quest star** (top-left) — tap to re-hear the objective; pulses gently when a new objective arrives.

Nothing else lives on screen during play. Hearts appear only during encounters; house points appear only when awarded (a shimmer of points flying to a corner tally, then gone).

## The richness layer (where the "complexity" budget goes)

This game is a *world*, not a session toy — the richness layer is not garnish, it's half the product. Everything here is optional to touch and impossible to fail.

- **Chocolate frog cards**: collectible cards hidden in rooms and earned by quests; the album lives in the satchel. Each card has a portrait and a one-word name, and a voiced fun line when tapped. Target: ~4–6 findable per chapter.
- **House points**: awarded for kindness and side quests, never deducted. They pay off at the end-of-year feast.
- **Pet companion**: chosen and named in Diagon Alley (owl/cat/toad; preset name cards plus optional typed name with dad's help). Follows her everywhere, reacts to rooms, serves as the first rung of the hint ladder, and occasionally sniffs out hidden cards.
- **The living castle**: wall portraits are real characters — their eyes follow Violet as she walks, they snore, and a few of them talk (one gives a side quest; one is a terrible gossip). Suits of armor hiccup when tapped. The Great Hall's floating candles drift. Ghosts amble through on their own schedules and are always pleased to see her. Per the family house rule, nothing autonomous ever threatens or demands — the castle is alive *for* her, never *at* her.
- **The common room is hers**: entry through the portrait door with a **password ritual** she chooses herself (a sequence of three icon cards — dragon, star, frog — that she "speaks" by tapping; the portrait forgets nothing but forgives everything, hint ladder applies). Inside, her dormitory corner accumulates the year: her frog-card album on the shelf, treasures from quests on the windowsill, her house banner, her pet's basket. Collectibles have a *home*, and the home fills up as the year passes.
- **Owl post from home**: between chapters, her owl delivers letters from Mum and Dad (voiced; optionally *actually recorded by her real parents* — the manifest treats family recordings as drop-in voice assets). Letters recap where she left off — the resume-recap system wearing its diegetic clothes — and sometimes include a small surprise (a card, sweets, a knitted something at Christmas).
- **The year turns**: the castle map and key rooms carry seasonal states as chapters advance — golden autumn (Ch. 3–4), Halloween dressing (Ch. 5), deep winter and Christmas (Ch. 6), spring thaw (Ch. 7), summer for the finale (Ch. 8). Time visibly passes; the year feels *lived*, and each season is a fresh coat of wonder on rooms she already knows.
- **Spell mastery, felt not counted**: every ~10 casts, a spell's visuals quietly bloom — Lumos's orb gains drifting motes, Leviosa's swirl gains a second ribbon, wand trails grow richer. No numbers, no announcements; one day she just notices her magic got prettier. (Cap at 3 tiers; content lint verifies tiers exist for every spell.)
- **The yearbook**: at scripted golden moments (wand chosen, Sorting, first flight, troll victory, the finale) the game quietly captures the actual live frame — *her* scene, her robe trim, her pet beside her — into an end-of-year album. It's the credits sequence's raw material and the post-game keepsake, flippable from her dormitory. (Small compressed thumbnails in localStorage; the save export carries them.)

## Accessibility and safety details

- Respect `prefers-reduced-motion` (and mirror it as a settings toggle): no slow-mo, reduced particles, no screen shake.
- Audio unlocks on first tap (iOS requirement); mute state persists; the game is fully playable and understandable with sound off (captions + glows carry meaning) — though voice is the intended experience.
- Fear calibration: the villain is menacing-but-hammy; darkness is cozy-night, not horror-dark; defeat animations are comic. One dramatic beat at the climax, immediately resolved into celebration.
