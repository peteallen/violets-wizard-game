# Chapter 1 audio sources

All shipped audio is generated offline and committed under `public/assets/audio`; no provider credential reaches the browser. `scripts/generate_voice.mjs` extracts the canonical spoken text directly from the chapter content, pins the selected ElevenLabs voice identifiers by role, and writes idempotently. `scripts/generate_sfx.mjs` and `scripts/generate_music.mjs` do the same for effects and the three Chapter 1 cues.

The narrator uses David, a warm British storyteller. Hagrid uses Scottish Paisley (`YIn3yKpQSeXNJMF5CIuj`), a middle-aged male professional voice labeled Scottish, raspy, gruff, and rough while remaining polite. The wandmaker uses Frederick Surrey, the tailor and Violet use Lily, and the keeper uses Alice. These are source-production identifiers only and are never exposed as character claims in the game.

Every newly generated voice file is gently compressed and mastered to approximately -16 LUFS with a -1 dB true-peak ceiling before it is committed. Music is mastered around -22 LUFS and sound effects around -18 LUFS; sparse transient effects may measure a few decibels lower so their peaks remain gentle. A single role can be rebuilt without disturbing the rest of the cast with `npm run assets:voice -- --force --role guide`.

All six regenerated Hagrid lines were transcribed back with Scribe v2 under `audio/qa/guide`; each retained the complete authored instruction, including Violet’s name and Platform Nine and Three-Quarters. `audio/qa/guide/loudness.json` records the post-master measurements and the previous introduction baseline.

Run `npm run check:voice-qa` to compare the committed transcription records with the current Chapter 1 and Chapter 2 spoken text. The command derives its expected lines from game content, uses `audio/qa/manifest.json` to associate raw transcription files with voice asset keys and bind each transcript to the exact MP3 by byte size and SHA-256, ignores punctuation, letter case, and inaudible British-versus-American spelling differences, and exits unsuccessfully when audio changes after transcription, a speech asset lacks a transcript, or a recording says materially different words. All 39 currently shipped lines are covered.

Run `npm run check:audio` to measure every committed MP3 with ffmpeg and enforce the category mix plus a hard true-peak ceiling. Both voice transcription QA and loudness QA run inside the production build, so a changed or unmastered asset cannot deploy unnoticed.

Music prompts explicitly require an original composition and prohibit quotation or imitation of any existing film, game, franchise, composer, or melody.
