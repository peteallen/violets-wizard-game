# Chapters

The story arc: book 1 as eight playable chapters, each sized for one to three of
Violet's 20–30 minute sessions. Chapters One and Two are playable. Chapter Two
is now in an active Phase 2 fidelity and reliability pass; the targets below are
the approved destination for that pass, not a claim that the polish has already
landed. Chapters Three through Eight remain at the beat level and get their own
detail pass, informed by watching her play, before production begins.

Every chapter ends with an illustrated **chapter card** (like a picture-book page turn) and a triumphant sting, and unlocks its replay in the parent panel. Autosave means she can stop mid-chapter at any scene boundary. **Between chapters, owl post arrives from home** — a voiced letter from Mum and Dad that recaps her progress diegetically and marks the year turning (see GAME_DESIGN.md's richness layer). The seasons advance with the chapters: autumn gold (3–4), Halloween (5), deep winter and Christmas (6), spring (7), summer (8) — map and key rooms carry seasonal variants.

**Recognition rule:** every major beat should be something she'll recognize from the first book or first film — the game's job is to let her *step into* scenes she already loves, with her in the middle of them. Familiar characters and landmarks provide orientation rather than a reenactment: they may recur around an original through-line, but Violet drives the story and its decisive actions.

---

## Chapter 1 — The Letter & Diagon Alley

> **Status 2026-07-16:** playable end to end on the deployed build, including
> the rebuilt storybook cast, Hagrid's clearer travel beats, and the painted
> satchel.

**Goal:** teach every core interaction (tap-walk, talk, inspect, map travel) inside the most wish-fulfilling sequence in the source: *you're a witch, Violet.* No spells yet — wonder first, mechanics minimal.

**Rooms:** Violet's bedroom (morning) → Leaky Cauldron → Diagon Alley street → Ollivanders → Madam Malkin's → Magical Menagerie → back to the street (dusk).

**Beats:**

1. **The letter.** Violet's own bedroom, sunny morning. She begins in her purple soccer jersey, dark leggings, and sneakers — ordinary Violet before the magic. An owl taps the window (tutorial: tap the owl — the only glowing thing on screen). The window opens, the letter drops — and the envelope reads **VIOLET** in big golden script. She taps *her own name* to break the seal (the game's very first literacy beat, disguised as the game's very first wish-fulfillment beat). It unfolds and keeps its complete original wording visible: *"Dear Violet, You are invited to Hogwarts School of Witchcraft and Wizardry. Your place is waiting. Bring your brightest curiosity."* **Hear the letter** optionally narrates those exact words without replacing the page; **Let’s go!** continues without requiring audio. This is the first ten seconds of the game and it must be perfect.
2. **Hagrid arrives** to collect her (film-familiar; also the tutorial voice for the whole chapter). Walks her to the Leaky Cauldron — first tap-to-walk teaching, first doorway transition.
3. **The wall opens** — brick-by-brick animation into Diagon Alley (her first "whoa" set piece; the street is the richest painting in the chapter: owls, cauldrons, brooms, bustle).
4. **Ollivanders.** The wand chooses the witch: two wrong wands cause escalating comic chaos (papers whirl; a vase shatters — remembered later: Reparo's teaching moment in Ch. 5 can call back to it). The third wand erupts in golden light with the music's first full swell. Ollivander, whispery and delighted: "Curious…" Caption: "Your wand!"
5. **Madam Malkin's.** Robes fitted — a dressing-room view previews the robes on Violet herself while she explores twelve large fabric-color choices. Confirmation changes her from the soccer outfit into robes and persists the trim forever; choices with visible permanence are gold for kids.
6. **Magical Menagerie.** She chooses her pet — owl, cat, or toad — and names it (preset name cards + an optional grown-up-assisted storybook naming dialog). The pet follows her from this moment for the rest of the game.
7. **Dusk on the street.** Hagrid hands her the train ticket. Chapter card: *Platform Nine and Three-Quarters* tease.

**Quests:** main quest only (the shopping trip), plus 2 hidden chocolate frog cards (one behind Ollivanders' shelves, one in the Menagerie) to seed the collecting habit.

**Mechanics proven:** rooms, walking, dialogue, hotspots, cosmetic choice, pet follow, map (introduced trivially: two locations), save/resume, chapter card.

**Asset list:** 7 room paintings; voices: narrator, Hagrid, Ollivander, Madam Malkin, shopkeeper; music: wonder theme + Diagon Alley bustle; SFX: owl taps, seal break, brick wall, wand chaos ×2, wand chosen, coins, pet sounds ×3. Violet is a silent player avatar whose reactions are visual.

---

## Chapter 2 — Platform 9¾ & The Sorting

> **Status 2026-07-16:** the complete route is playable on `main`. The approved
> Phase 2 pass described below is active but not yet complete.

**Goal:** friends and belonging. Lowest-mechanics chapter — it's theater, and that's fine this early.

**Phase 2 target beats:** run through the barrier at King's Cross after a comic
hesitation and land on the platform while the whoosh transition is fully opaque.
On the Hogwarts Express, Harry, Ron, and Hermione become independently tappable
friends rather than a single group prompt. Violet chooses what she wants to talk
about — **Castle**, **Magic**, or **Friends** — and each classmate answers in a
distinct voice. The trolley offers Beans, a Chocolate Frog, and a Cauldron Cake
with different reactions; Beans branch again into berry, pepper, or soap.

The first sight of the castle across the lake holds for eight unhurried seconds
before Violet chooses when to continue. In the Great Hall, the Sorting Hat sits
on her head and speaks while she remains visibly seated. Its existing three by
three answer matrix stays intact: icon choices personalize the Hat's explanation
but always recognize her as a Gryffindor. The result becomes a real feast with a
warm music cue, food on the tables, optional friend taps, and a clear ten-point
celebration before the hidden frog card can be collected without covering the
Headmaster or his dialogue.

At the portrait door, Violet makes a three-icon password from Dragon, Star, and
Frog. All six permutations are valid, and **Keep it** or **Again** lets her own
the ritual without a wrong-answer state. The common room then belongs to her:
it waits instead of advancing by itself, and Violet turns the page by tapping
the illuminated page corner. Owl post from home closes the chapter before a
dedicated Chapter Three preview.

> **LOCKED (D68):** Violet is a Gryffindor. Chapter Two builds the Gryffindor result and common room; other house variants are not part of its initial production scope.

The owl-post letter is voiced with generated Mum and Dad placeholders held
behind stable replacement keys. Its exact text is:

> Dear Violet, We heard you made it to Hogwarts and found your new house. We are
> proud of you for trying something brave, and glad you found good friends beside
> you. Love, Mum and Dad.

The dedicated Chapter Three preview narrates exactly:

> Next time, Violet opens her spellbook, makes light, and sends a feather
> floating.

**Quests:** main only. 2 frog cards (train compartment, Great Hall). First house points awarded at the feast.

**Current foundation proves:** icon dialogue choices, the fixed Gryffindor house
theme, and a multi-scene chapter flow. Phase 2 adds reliable resume/completion
semantics and the player-held continuations above without changing the outcome.

**Asset target:** keep the six current room paintings (King's Cross, barrier,
compartment, lake vista, Great Hall, and Gryffindor common room), add a food-laden
feast variant, and create dedicated Chapter Two end-card and Chapter Three
preview art. Voices cover the conductor, trolley witch, Harry, Ron, Hermione,
Sorting Hat, deputy head, Headmaster, portrait guardian, and generated Mum and
Dad placeholders. Music covers train rhythm, the lake-vista wonder swell,
Sorting tension-comedy, and feast warmth. Other house-room variants remain out
of scope until deliberately needed.

---

## Chapter 3 — First Classes

**Goal:** the spellbook arrives. The RPG begins.

**Beats:** Charms class — Professor Flitwick teaches **Lumos** first: the game's first **incantation assembly** (five friendly letters, L-U-M-O-S, tiles sounding out as they land, wand brightening with each — see GAME_DESIGN.md's learning layer). Then **Wingardium Leviosa** (the feather scene she knows by heart), assembled as chanted *syllable* tiles since the word is enormous — "WIN · GAR · DIUM… LEVI · O · SA" — her feather lifts on the completed chant, always succeeding, with maximum sparkle → **the lost toad**: a tearful classmate (Neville-shaped) has lost Trevor; she explores three night corridors using Lumos to light dark alcoves, finds Trevor, returns him. First side quest appears (a ghost asks for help finding his lost book — Reparo foreshadowing).

**Mechanics proven:** spellbook UI, casting flow, spell-gated world interactions (dark alcoves need Lumos), quest chain with multiple rooms, hint ladder in real use.

**Asset list:** 4 rooms (Charms classroom, 3 night corridors); voices: Flitwick-ish (bright, squeaky), Neville-ish kid, ghost; music: classroom brightness, night-corridor hush (cozy, not scary); SFX: Lumos bloom, Leviosa harp gliss, toad croaks, class ambience.

---

## Chapter 4 — Flying Lesson & the Forbidden Corridor

**Goal:** first minigame + first taste of mischief. Broom flight is the one motion-skill moment in the game, tuned very gentle.

**Beats:** flying lesson on the lawn — **broom minigame v1**: Violet drifts toward wherever her finger touches (direct position control, no physics fight), gliding through star rings; impossible to fail, rings chime and streak → a Remembrall rolls away / gets tossed; she flies to catch it (the film beat, heroic version) → reward: **Alohomora** taught by Hermione (locked doors around the castle now open — several optional doors with frog cards and charm behind them) → the trio dares a peek at the forbidden corridor: **Fluffy** the three-headed dog, asleep; comic near-waking beat; they flee giggling. Fluffy is a *promise*, not a threat.

**Mechanics proven:** minigame framework (enter/succeed/celebrate contract), spell-gated doors as optional content, broom control scheme (reused in Ch. 7).

**Asset list:** 3 rooms (lawn/sky, corridor, forbidden corridor); voices: flying instructor (brisk), Hermione, dog snores; music: soaring flight theme; SFX: broom whoosh, ring chimes, lock clicks, triple snore.

---

## Chapter 5 — Halloween: The Troll

**Goal:** the encounter grammar debuts, wearing the book's own scene.

**Beats:** Halloween feast (floating pumpkins, the year's coziest room) → "TROLL!" — comic panic exit → she hears crying in the bathroom (empathy beat: someone's scared and alone — she *chooses* to help) → **troll puzzle-fight** (see GAME_DESIGN.md: dodge zones → Leviosa the club → bonk, 2–3 rounds with variations) → teachers arrive to find her victorious; house points shower; **Reparo** taught while fixing the wrecked bathroom together (kindness as mechanics; callback to the Ollivanders vase). Ghost side quest resolvable now: Reparo his torn book.

**Mechanics proven:** encounter framework v1 (telegraphs, dodge zones, spell openings, comic fail/instant retry), points celebration moment.

**Asset list:** 3 rooms (feast hall variant, corridor, wrecked bathroom + repaired state); voices: troll grunts, crying classmate, teachers; music: feast warmth → tension-comedy troll theme → triumph; SFX: club whoosh/floor thud, club bonk, porcelain crash & reverse-crash (Reparo).

---

## Chapter 6 — Christmas & Night Adventures

**Goal:** mood variety and the game's quiet, beautiful center. The castle in deep winter.

**Beats:** **Christmas morning in the common room** — the castle is snowbound and nearly empty (she stayed for the holidays, like the book); presents under the dormitory tree: something knitted from home via owl post, wizard sweets… and **the invisibility cloak**, wrapped anonymously, tag reading "For Violet" (the book's own beat, restored to its rightful Christmas slot — she will recognize this) → snowball charm on the frozen courtyard (pure play, no stakes) → Potions class with the sneering potions master — **potion minigame**: follow a pictogram recipe where ingredient jars carry one-word labels ("FROG", "MOON") and amounts are counted ("3 beetle eyes" — tap, tap, tap, with the voice counting along; word-matching and counting hiding inside cooking) — stir by circling, the one gentle gesture; wrong ingredients produce funny-colored smoke and a rude noise from the cauldron, then the recipe re-shows → night exploration under the Christmas cloak: guards/prefects to drift past (they can't catch her — being seen just makes her duck and giggle, auto-hiding) → **the Mirror of Erised**: a quiet, non-mechanical scene — the mirror shows her *(art: her family, her pet, her friends waving; warm, not sad)* and the headmaster's gentle voiced reflection on it. No challenge, no reward but the moment. Games for kids almost never dare to be quiet; this one does, once.
**Incendio** (bluebell flames) taught at chapter's end — needed for Ch. 7.

**Mechanics proven:** potion minigame, cloak stealth-lite (unfailable), scene without any mechanics at all.

**Asset list:** 4 rooms (potions dungeon, 2 night halls, mirror chamber); voices: potions master (slow, silky, disdainful — the fun kind of mean), headmaster; music: bubbling dungeon, cloak-sneak pizzicato, mirror theme (the score's most beautiful cue); SFX: cauldron bubbles, ingredient plops, cloak shimmer, flame crackle.

---

## Chapter 7 — The Trapdoor Gauntlet

**Goal:** the remix chapter — every verb she's learned, back to back, as the descent toward the finale. Plus the Dueling Club prologue that teaches the duel controls safely.

**Beats:** **Dueling Club** (film 2 nod): a friendly practice duel against a Draco-shaped rival teaches **Shield** and **Expelliarmus** with zero stakes — losing literally can't happen; it's a lesson → the trio realizes the Stone is in danger; down the trapdoor: → **Devil's Snare** (Incendio) → **the flying keys** (broom minigame reprise: catch the one glinting key) → **the chessboard** (drastically simplified: three "pick the right piece" moments with obvious visual telegraphs — present for recognition, not difficulty) → **the potion riddle** (simplified to a color-logic pick from three bottles, pictogram clues) → the final door. Checkpoint at every stage; the gauntlet auto-saves between stages so it can span sessions.

**Mechanics proven:** duel controls (safe tutorial), multi-stage gauntlet flow, all-verbs remix.

**Asset list:** 5 rooms (dueling hall, snare pit, key chamber, chessboard, potion chamber); voices: Draco-ish rival (posh, huffy), trio encouragement lines; music: descending-tension suite that hands off between stages; SFX: snare rustle/retreat, key swarm flutter, chess stone-grind, bottle chimes.

---

## Chapter 8 — Voldemort & The House Cup

**Goal:** the fight she asked for, the victory she's owed, and the biggest celebration in the family game catalog.

**Beats:** the Mirror chamber. Quirrell waits, hammy and stumbling (Phase 1 — refresher patterns, nearly unfailable) → the turban unwinds: **Voldemort revealed** (Phase 2 — longer patterns, one new telegraph; his menace is theatrical, his voice a dry rasp that *wants* to be scary and is slightly ridiculous) → **the wand-to-wand duel** (Phase 3 — the game's one dramatic beat: music drops to heartbeat, longest patterns, then the golden opening and the **EXPELLIARMUS finisher** — time freezes and she taps the incantation's flaring letters one by one, untimed and unfailable, each tap swelling the bolt until the word completes and detonates; she *spells* the spell that beats him) → he shrieks, deflates, and poofs into smoke → **the feast**: house cup awarded (her points matter!), every friend cheers *Violet* by name, fireworks over the castle, credits as a picture-book flip of moments from her whole year — every chapter card, her pet, her cards collected, her house banner.

Post-game: free roam of the whole castle stays open — every room, side quest, card hunt, and replayable minigame persists. The save never "ends."

**Asset list:** 2 rooms (mirror chamber battle-dressed, feast finale); voices: Quirrell (nervous stammer), Voldemort (rasp — menacing-but-beatable), full cast celebration lines *including her name*; music: three-phase duel suite → victory feast anthem (the score's biggest cue); SFX: duel bolts, shield bells, the Expelliarmus thunderclap, fireworks.

---

## Content budget summary

| | Rooms | Voiced characters | Music cues | Frog cards |
|---|---|---|---|---|
| Total (Ch. 1–8) | ~34 paintings (incl. variants) | ~20 voices | ~18 cues | ~35 cards |

Chapters ship one at a time (see [ROADMAP.md](ROADMAP.md)); asset generation is per-chapter, so the budget spreads across months and nothing is generated before its chapter's detail pass.
