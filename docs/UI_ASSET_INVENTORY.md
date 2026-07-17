# Violet's Field Kit asset inventory

This inventory covers player-facing interface shells, props, controls, browser
identity, and their live visual layers. It excludes room paintings, character
rigs and portraits, collectible-card portrait content, particles, and ordinary
world props. The governing material, state, accessibility, and live-content
contract is in [ART_DIRECTION.md](ART_DIRECTION.md#ui-violets-field-kit), and
the required state/inverse capture matrix is in
[VERIFICATION.md](VERIFICATION.md#state-and-inverse-coverage).

“Painted” means the stable physical material and silhouette come from a
generated, provenance-backed raster asset. Text, focus, routes, progress,
portraits, selection, availability, and save-dependent state remain live.
“Live-rendered” means the current Canvas or DOM construction is intentional and
should not be replaced merely to increase the raster count.

| Family | Player-facing surfaces | Current status | Remaining proof or work |
|---|---|---|---|
| Title | Castle-and-lake backdrop; new/return owl-post action | Painted and shipped | Keep new and returning title captures at both required sizes whenever the composition changes. |
| Open satchel | Travel-folio spread; Map/Cards bookmarks; grown-up keyhole; Start fresh tag; close seal; four destination paintings; earned frame; unearned pocket | Painted and shipped | Preserve live labels, routes, Here/Next/completion state, portraits, and cards-only layouts for later chapters. |
| Persistent HUD | Closed satchel; quest compass case and independent needle; wand holster and Violet’s first wand | Painted and shipped | Retain code-owned contact shadows, objective pulse, golden thread, spark, ownership rules, reduced motion, decode-safe capture preloading, and complete vector fallbacks. |
| Objective reminder | Leather-backed parchment reminder; enlarged compass; close seal | Painted and shipped | Keep the real post-satchel Chapter One fixture and both-size full/reduced captures current whenever its composition changes. |
| Dialogue card | Adaptive deckled parchment; attached live portrait; Again wax control; brass advance medallion; day/night variants | Intentional live-rendered family | Keep speakers on both sides, night/day contexts, focus, replay, and room-stage inverses covered. Repaint only if assembled review shows this coherent family falling below the Field Kit bar. |
| Dialogue choices | Two- and three-card pet, confirmation, name, sweets, and Sorting choices | Painted canonical shell shipped | The shared two- and three-card path retains live pets, emblems, captions, hit rectangles, and a subdued real-room backdrop. Narrow four-card layouts retain the organic vector shell until they receive a dedicated layout and coordinated Chapter Two proof. |
| Opening letter | Delivered envelope, owl seal, unfolding paper, persistent readable invitation | Intentional live story object with painted actions | Preserve one material identity through delivery, opening, reading, optional narration, and continuation. The real-bedroom proof keeps Violet, the readable invitation, and both painted actions mutually clear. Repainting the invitation itself requires coordinated `SetPieceRenderer` work. |
| Shared action shell | Letter actions; robe confirmation; Chapter One continue; future suitable confirmations | Painted three-slice shell shipped | The runtime preserves both end caps while the middle absorbs width changes; every label, icon, pressed/focus state, availability, and destructive meaning remains live. Extend this shell only where the action meaning fits. |
| Robe picker | Tailoring folio; brass mirror; Violet preview; twelve live swatches; confirmation | Painted and shipped | Preserve native save timing, the centered full-body preview, the four-by-three live tailoring grid, all twelve selections, and both-size full/reduced captures. |
| Chapter One completion | Platform painting; compact railway/luggage plaque; Continue action | Painted and shipped | Keep the locomotive, steam, gold ticket, luggage, and platform depth exposed around the live two-line title and separate action. Never route this plaque into Chapter Two’s ceremony renderer. |
| Chapter Two ceremonies | Sorting announcement cloth; common-room welcome cloth; Chapter Two completion hanging and next scroll | Chapter Two-owned live-rendered presentation | Coordinate before editing shared `SetPieceRenderer` or Chapter Two presentation/content. The Chapter One plaque must never be routed into this path. |
| Grown-up book | Play, settings, and save pages; confirmations; settings steppers and notices | Functional live-rendered book; upgrade target | Reuse the open-folio material family, painted close seal, and shared action shells. Add physical unavailable/busy/success/error/destructive states, fix the overlapping settings notice, and remove the invisible close target from confirmations. |
| Yearbook and replay | Empty/developing/populated yearbook; navigation; persistent Return ribbon; replay locked/enabled/active | Functional live-rendered family; upgrade target | Add populated one- and multi-page fixtures, replay-active room/dialogue inverses, and explicit locked/busy/failure coverage. |
| Pet-name dialog | Native text input, validation, Use this name, Name cards | Painted DOM folio and actions shipped | Keep native input, keyboard, focus trap, Escape/Enter, selection, error recovery, and live labels. Expand page-level proof from the shipped filled/narrow frames to explicit empty, invalid, focus, pressed, and keyboard-height states. |
| Save-transfer dialog | Native textarea, export/copy, import validation/confirmation/busy/success/error | Painted DOM folio and actions shipped | Keep native selectable save text and the full state machine. Expand page-level proof from the shipped export/narrow frames to copy fallback, invalid import, confirmation, busy, success, failure, and focus states. |
| Update offer | Owl mark; Reload and Later actions | Functional DOM surface; painted-shell upgrade target | Reuse the shared action-note/material family, raise both actions to the 88-pixel target, add pressed/focus fixtures, and prove the prompt stays hidden during active story moments. |
| Loading and boot failure | Initial page before fonts/title assets; future retry/offline distinction | Visually absent; upgrade target | Add a lightweight pre-module busy surface plus explicit boot-failure recovery before considering offline/service-worker behavior. Do not hide loading meaning in motion alone. |
| Browser identity | Favicon and iPad home-screen icon | Painted and shipped | Keep the versioned 64- and 180-pixel PNG references, the 512-pixel source derivative, and small-size legibility checks at 32 and 16 pixels. |
| Map guidance and hints | Painted destinations; live route; fog; checks; Here/Next; objective star; golden thread; guide footprints | Intentional hybrid/live layers | These encode runtime truth and must remain code-owned. Do not bake destinations, progress, paths, or objective emphasis into a shared shell. |
| Spell-learning interface | Spell fan, spell cards, incantation ribbon, rune tiles | Future Chapter Three component family, not a missing Chapter One/Two repaint | Build from the Field Kit contract when Chapter Three begins: parchment spell cards/ribbon, live letters, stone runes, signature spell color, and complete state/inverse fixtures. |
| Legacy Chapter Two preview | Old compatibility plaque, shelf, seals, and preview actions | Retired production surface | Preserve save compatibility or remove it deliberately; do not spend current art budget repainting it. |

The current review stack has a separate DOM-inclusive command because Canvas
snapshots cannot see native overlays. `npm run snap` remains the raw Canvas
path. `npm run snap:dom` uses the same seeded state/action fixtures and capture
metadata but photographs the complete viewport after deterministic stepping.
