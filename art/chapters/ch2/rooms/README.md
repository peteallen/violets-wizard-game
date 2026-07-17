# Chapter 2 room paintings

The six room paintings currently shipped by Chapter Two were generated on
July 16, 2026 through Codex's built-in image-generation workflow, using the
accepted Chapter One room paintings as direct finish and lighting references.
The built-in workflow did not return a model identifier, provider route, seed,
or billable-usage record, so the source log does not invent any of those
fields. Each versioned prompt, request specification, and metadata record
contains the exact reference order, generated-output identifier, original
Codex output path, hashes, dimensions, and derivative chain.

| Room | Accepted native source | Delivery PNG | Shipping WebP | Provenance |
|---|---|---|---|---|
| King's Cross concourse | `art/raw/ch2-kings-cross-native-v2.png` | `art/raw/ch2-kings-cross-v2.png` | `public/assets/art/rooms/ch2-kings-cross.webp` | `kings-cross-native-v2.metadata.json` |
| Magical platform | `art/raw/ch2-platform-native-v2.png` | `art/raw/ch2-platform-v2.png` | `public/assets/art/rooms/ch2-platform.webp` | `platform-native-v2.metadata.json` |
| Train compartment | `art/raw/ch2-train-compartment-native-v2.png` | `art/raw/ch2-train-compartment-v2.png` | `public/assets/art/rooms/ch2-train-compartment.webp` | `train-compartment-native-v2.metadata.json` |
| Lake vista | `art/raw/ch2-lake-vista-native-v2.png` | `art/raw/ch2-lake-vista-v2.png` | `public/assets/art/rooms/ch2-lake-vista.webp` | `lake-vista-native-v2.metadata.json` |
| Great Hall | `art/raw/ch2-great-hall-native-v4.png` | `art/raw/ch2-great-hall-v4.png` | `public/assets/art/rooms/ch2-great-hall.webp` | `great-hall-native-v4.metadata.json` |
| Gryffindor common room | `art/raw/ch2-gryffindor-common-room-native-v2.png` | `art/raw/ch2-gryffindor-common-room-v2.png` | `public/assets/art/rooms/ch2-gryffindor-common-room.webp` | `gryffindor-common-room-native-v2.metadata.json` |

The built-in workflow returned 1672×941 PNGs. Each was copied byte-for-byte
into `art/raw`, center-cropped by one pixel to 1672×940, and resized once to
2048×1152 with `sips`. The shipping files were encoded from those delivery
PNGs with `cwebp -q 88 -m 6 -sharp_yuv`. The conversion commands and the hashes
of every stage are recorded in the versioned metadata files.

King's Cross, the platform, and the train compartment use only Chapter One
paintings as references. The lake vista, Great Hall, and Gryffindor common room
also use their superseded Chapter Two painting as a composition-only input;
their metadata binds the exact old WebP bytes because those live paths now
contain the accepted replacements. The Great Hall is numbered v4 because its
three earlier source attempts remain part of the preserved first-pass lineage.

## Superseded OpenRouter pass

The unversioned room records plus `great-hall-v2` and `great-hall-v3` describe
the earlier OpenRouter generation through
`google/gemini-3.1-flash-lite-image`. They are retained as an honest archive of
that first pass and its two Great Hall corrections; none of their room WebPs
is currently shipped. `generate.mjs` reproduces that archived OpenRouter
request and conversion workflow only. It does not reproduce the accepted
Codex built-in generations, whose prompts and source bindings are captured in
the native-v2/native-v4 records above.

All six accepted native paintings were inspected at source and delivery
resolution. They keep the walking floor and interaction staging open, contain
no people or readable text, and target Chapter One's denser painted surface,
dimensional light, and dark-brown edge language for this first playable pass.
The separate harness captures and assembled-game walkthrough remain the final
integration review.
