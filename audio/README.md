# Chapter 1 audio sources

All shipped audio is generated offline and committed under `public/assets/audio`; no provider credential reaches the browser. `scripts/generate_voice.mjs` extracts the canonical spoken text directly from the chapter content, pins the selected ElevenLabs voice identifiers by role, and writes idempotently. `scripts/generate_sfx.mjs` and `scripts/generate_music.mjs` do the same for effects and the three Chapter 1 cues.

The narrator uses David, a warm British storyteller. The guide uses Adam Stone, the wandmaker uses Frederick Surrey, the tailor and Violet use Lily, and the keeper uses Alice. These are source-production identifiers only and are never exposed as character claims in the game.

Music prompts explicitly require an original composition and prohibit quotation or imitation of any existing film, game, franchise, composer, or melody.
