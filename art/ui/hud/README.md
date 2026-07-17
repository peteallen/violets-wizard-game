# Painted Field Kit HUD props

The five `source/*-chroma.png` files are untouched built-in image-generation
sources for Violet's persistent closed satchel, layered quest compass, and
layered wand holster. The runtime keeps contact shadows, pulse, golden-thread
guidance, ownership, enabled state, wand selection, needle placement, and magic
effects live.

The exact prompts and generation receipts live in `../hud-v1.*`.
`../process-hud-v1.mjs` deterministically removes each chroma background and
builds the 512×512 transparent WebP shipping layers.
