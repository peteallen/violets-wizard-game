# Chapter 3 room paintings

These five first-pass production paintings were generated on July 17, 2026
through Codex's built-in image-generation workflow, one call per room. Each
versioned prompt is the exact text supplied to the tool and begins with the
locked room-style prefix. Each request record binds the reference order and
generated-output path, while each metadata record binds the timestamps,
dimensions, byte counts, SHA-256 hashes, and complete derivative chain. The
built-in workflow did not return a model identifier, provider route, seed, or
billable-usage record, so none of those values is invented.

| Room | Untouched native source | Accepted 2048x1152 PNG | Shipping 2048x1152 WebP | Provenance |
|---|---|---|---|---|
| Autumn common room | `art/raw/ch3-common-room-autumn-native-v1.png` | `art/raw/ch3-common-room-autumn-v1.png` | `public/assets/art/rooms/ch3-common-room-autumn.webp` | `common-room-autumn-native-v1.metadata.json` |
| Charms classroom | `art/raw/ch3-charms-classroom-native-v1.png` | `art/raw/ch3-charms-classroom-v1.png` | `public/assets/art/rooms/ch3-charms-classroom.webp` | `charms-classroom-native-v1.metadata.json` |
| Corridor one | `art/raw/ch3-corridor-one-native-v1.png` | `art/raw/ch3-corridor-one-v1.png` | `public/assets/art/rooms/ch3-corridor-one.webp` | `corridor-one-native-v1.metadata.json` |
| Corridor two | `art/raw/ch3-corridor-two-native-v1.png` | `art/raw/ch3-corridor-two-v1.png` | `public/assets/art/rooms/ch3-corridor-two.webp` | `corridor-two-native-v1.metadata.json` |
| Corridor three | `art/raw/ch3-corridor-three-native-v1.png` | `art/raw/ch3-corridor-three-v1.png` | `public/assets/art/rooms/ch3-corridor-three.webp` | `corridor-three-native-v1.metadata.json` |

The common room used the stable accepted Chapter Two common-room PNG,
`art/raw/ch1-bedroom.png`, and the lossless Chapter One style triptych. The
classroom used the shipped Chapter Two Great Hall, `art/raw/ch1-ollivanders.png`,
and the triptych. All three corridors used `art/raw/ch1-courtyard.png`, the
shipped Chapter Two Great Hall, and the triptych. The metadata files bind the
exact bytes supplied in each call.

Every built-in output was a 1672x941 PNG. The native source was copied
byte-for-byte into `art/raw`, center-cropped by one pixel to 1672x940, and
resized once to 2048x1152 with `sips`. The shipping files were encoded from
those accepted PNGs with `cwebp -q 88 -m 6 -sharp_yuv`. The exact commands and
the hashes of every stage are recorded in the versioned metadata.

The untouched sources and shipping derivatives were inspected at high detail.
All five keep a continuous, calm lower-quarter walking band and contain no
people, creatures, or readable text. The common room remains recognizably the
same room in bright autumn morning, with golden leaves outside and an empty
delivery table and perch zone. The classroom has upper- and mid-level books
and feather clusters, an empty dark demonstration tabletop, and generous
center/right teaching space. It also includes ordinary ambient lantern
fixtures elsewhere in the architecture; none occupies the lesson tabletop or
replaces the separately rendered lesson lantern. Corridor one has one
far-right search alcove, corridor two has two widely separated empty alcoves
with no card or ribbon baked in, and corridor three presents armor, curtain,
and a separate alcove in the runtime target order with no eyes, toad, or clue
baked in. No candidate was judged unsafe for the first playable pass.
