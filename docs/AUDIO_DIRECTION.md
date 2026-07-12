# Audio Direction

Audio is half this game. Dialogue is voice-first (she reads 1–3 words; the game *talks*), the score carries the wonder, and every interaction answers with sound. All audio is generated offline with ElevenLabs (voices, SFX, music), keys from env, nothing generated at runtime, no credentials near the browser (house rules). Per the family standard, the game must remain fully playable with zero audio files present — synth fallback beeps and captions carry meaning — but voice is the intended experience.

## Voice cast (all British, per the client)

Original characters-shaped-like-the-books, voiced with distinct, instantly tellable-apart voices. Names below are role labels, not shipped text.

| Role | Voice direction | Appears |
|---|---|---|
| **Narrator** | Warm grandfather, fireside storyteller, unhurried | Letter, chapter cards, resume recaps |
| **The Guide** (half-giant) | Deep, rumbly, gruff Scottish warmth; gentle giant energy | Ch. 1 tutorial voice, recurring |
| **Wandmaker** | Whispery, wide-eyed wonder, slightly odd | Ch. 1 |
| **Deputy Head** (stern professor) | Brisk Edinburgh Scottish, warmth under starch | Sorting, discipline-with-a-wink beats |
| **Charms Professor** | Bright, squeaky, delighted by everything | Ch. 3 classes |
| **Potions Master** | Slow, silky, magnificently disdainful — the *fun* kind of mean | Ch. 6 |
| **Headmaster** | Soft, amused, twinkly; gravity without weight | Sorting feast, Mirror scene |
| **Sorting Hat** | Theatrical, ancient, kind; relishes the drama | Ch. 2 |
| **Harry / Ron / Hermione** | Bright London kids: earnest / cheeky / precise | Ch. 2 onward |
| **Neville-shaped classmate** | Small, wobbly, sweet | Ch. 3 |
| **Draco-shaped rival** | Posh, huffy, harmless | Ch. 7 |
| **Quirrell** | Nervous stammer, comic | Ch. 8 phase 1 |
| **Voldemort** | Dry rasping whisper — *wants* to be terrifying, lands at beatable-menacing; hammy relish over horror | Ch. 8 |
| **Violet** | Bright 6–7yo girl; short exclamations only ("Wow!", "Lumos!", "Found you!") — the player narrates her own adventure in her head; her voice never says anything Violet-the-player wouldn't | Throughout |

**Casting rule:** villain fear calibration is checked with dad before shipping Ch. 8 lines — one dramatic beat, zero nightmares.

**Owl post from home:** letters from Mum and Dad between chapters are voice assets like any other — which means dad (and mom) can *record the real lines themselves* and drop the files into the manifest in place of the generated takes. The pipeline treats family recordings as first-class: same ids, same loudness normalization pass, no code changes. Strongly recommended for the Christmas letter.

**Learning voice packs** (recorded once, reused everywhere): letter names A–Z, letter *sounds* (phonics) A–Z, counting one–ten, and syllable-chanted versions of every incantation ("WIN-GAR-dee-um levi-OH-sa"). Recorded by the Charms Professor voice (bright, celebratory) so even phonics sounds like magic class, not flashcards.

## Music: original score, "wonder and candlelight"

Original composition via ElevenLabs music generation — evocative of *magic school at night* while **never quoting the Williams theme** (prompts explicitly forbid referencing any existing melody; a listen-check against the real theme is part of QA).

Instrumentation family: celesta, glockenspiel, harp, warm strings, soft woodwinds, distant choir. One main **"Violet's theme"** motif — a six-note celesta figure — planted in the title screen and woven into the wonder cues, the Mirror cue, and the victory feast, so the finale feels like the whole game rhyming.

| Cue | Feel | Used |
|---|---|---|
| Title / Violet's theme | Music-box wonder, intimate | Title screen, letter |
| Diagon Alley | Bustling, pizzicato market energy | Ch. 1 |
| Train / journey | Rolling rhythm, adventure | Ch. 2 |
| Lake vista swell | The big wonder chord | Ch. 2 (one moment) |
| Great Hall / feast | Warm, brassy, communal | Ch. 2, 5, 8 |
| Common room | Cozy hearth, soft | Hub downtime |
| Classroom | Bright, curious | Ch. 3, 6 |
| Night corridors | Hushed celesta + low strings — velvet, not dread | Ch. 3, 6 |
| Flight | Soaring strings | Ch. 4, 7 |
| Tension-comedy (troll) | Lumbering tuba menace with a grin | Ch. 5 |
| Christmas morning | Sleigh-bell warmth, music-box | Ch. 6 |
| Mirror of Erised | The score's most beautiful cue; Violet's theme, slow | Ch. 6 |
| Descent suite | Staged rising tension, hands off between gauntlet stages | Ch. 7 |
| Duel phases 1–3 | Comic-nervous → dark → heartbeat-drop climax | Ch. 8 |
| Victory feast anthem | Everything, fireworks, Violet's theme fortissimo | Ch. 8 |

Loops are seamless (loop points authored in the generation script), ~60–90s beds, ducking under dialogue (−8dB sidechain in the SoundEngine).

## SFX identity

Every spell owns a signature sound (identifiable eyes-closed):

- **Lumos** — soft choir shimmer bloom · **Leviosa** — harp gliss up · **Alohomora** — brass click-cascade · **Incendio** — blue crackle whoosh · **Reparo** — reverse-shatter into glass chime · **Expelliarmus** — scarlet thunderclap · **Shield** — deep golden bell.

Plus: UI (parchment slides, wax-seal press, rune-tile chime — each tile lands on a rising pentatonic step so spelling a word literally plays a melody), world foley (owl taps, brick wall, cauldron bubbles, club bonk, fireworks), ambient beds per room (fires, murmurs, night insects, ghost hum), and comedy (fizzles, rubber-chicken misfire, cauldron raspberry).

Generation via ElevenLabs SFX with per-effect prompt + duration; normalized with `ffmpeg loudnorm`; trimmed tight (UI sounds <150ms to feel instant).

## Pipeline and QA

- `scripts/generate_voice.mjs` — line table: `{ id, role, text, caption }`; idempotent (skips existing, `--force` regenerates); one subdirectory per role under `public/assets/voice/`.
- **Transcription QA loop** (robotgame's hard-won lesson): every generated line is transcribed back by a speech model and diffed against the script — catches takes where the TTS *answered* the line instead of reading it, or mispronounced an incantation. Failures regenerate automatically up to N times, then land in a human-review list.
- **Pronunciation lock:** incantations get phonetic spellings in the generation text ("win-GAR-dee-um lev-ee-OH-sah") — the caption text and spoken text are separate fields precisely for this.
- `scripts/generate_sfx.mjs`, `scripts/generate_music.mjs` — same idempotent shape.
- `src/game/core/assetManifest.js` is the single source of truth; `npm run check:assets` fails the build if manifest ⇄ disk ⇄ generation scripts drift (see [ARCHITECTURE.md](ARCHITECTURE.md)).
- Loudness standard: dialogue −16 LUFS, SFX −18, music beds −22; the SoundEngine trusts files are pre-balanced and only handles ducking + master volume.
