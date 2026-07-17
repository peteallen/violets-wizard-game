# Title owl-post prop

`source/title-backdrop-v2.png` is the room-tier painted castle-and-lake title
background introduced by Violet's Field Kit v1. It contains no characters,
words, or controls; the runtime retains the title, envelope, Violet, and owl.
Its prompt, built-in generation receipt, hashes, and deterministic WebP
processing live in `../field-kit-v1.*` and `../process-field-kit-v1.mjs`.

`return-envelope-v2-chroma.png` is the untouched built-in image-generation
source for the returning-player title action. The runtime draws the action text;
the painting intentionally contains no words.

The production brief asked for one unmistakable sealed owl-post envelope in the
game's warm gouache-and-colored-pencil storybook style: cream fibrous
parchment, a clearly folded back flap, a blackberry wax seal at the flap join,
and a readable owl impression. It explicitly rejected the previous banner-like
beige placard, separate address sticker, perfect geometry, text, and software
chrome. The source uses a flat `#00ff00` field for deterministic local removal.

The source was generated with the built-in image-generation tool on 2026-07-16.
`art/ui/process-v2.mjs` owns the repeatable chroma removal, crop, resize, and
WebP conversion used for the shipping file.
