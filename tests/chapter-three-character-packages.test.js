import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { describe, expect, it, vi } from 'vitest';
import {
  flitwickCharacterDefinition,
  flitwickCharacterModule,
  flitwickCharacterReview,
  flitwickFullFrameCharacterDefinition,
  loadFlitwickCharacterRuntime,
} from '../src/game/characters/flitwick/index.js';
import { flitwickSpriteReviewDescriptor } from '../src/game/characters/flitwick/review.js';
import {
  loadNevilleCharacterRuntime,
  nevilleCharacterDefinition,
  nevilleCharacterModule,
  nevilleCharacterReview,
  nevilleFullFrameCharacterDefinition,
} from '../src/game/characters/neville/index.js';
import { nevilleSpriteReviewDescriptor } from '../src/game/characters/neville/review.js';
import {
  loadTrevorCharacterRuntime,
  trevorCharacterDefinition,
  trevorCharacterModule,
  trevorCharacterReview,
  trevorFullFrameCharacterDefinition,
} from '../src/game/characters/trevor/index.js';
import { trevorSpriteReviewDescriptor } from '../src/game/characters/trevor/review.js';
import {
  friendlyGhostCharacterDefinition,
  friendlyGhostCharacterModule,
  friendlyGhostCharacterReview,
  friendlyGhostFullFrameCharacterDefinition,
  loadFriendlyGhostCharacterRuntime,
} from '../src/game/characters/friendly-ghost/index.js';
import { friendlyGhostSpriteReviewDescriptor } from '../src/game/characters/friendly-ghost/review.js';
import {
  createFullFrameCharacterManifest,
  resolveFullFrameCharacterAnimation,
} from '../src/game/render/FullFrameCharacterRig.js';

const PACKAGES = Object.freeze([
  Object.freeze({
    id: 'character.flitwick',
    slug: 'flitwick',
    displayName: 'Professor Flitwick',
    voiceRole: 'bright-charms-professor',
    definition: flitwickCharacterDefinition,
    source: flitwickFullFrameCharacterDefinition,
    module: flitwickCharacterModule,
    review: flitwickCharacterReview,
    descriptor: flitwickSpriteReviewDescriptor,
    loadRuntime: loadFlitwickCharacterRuntime,
    frameNames: ['neutral', 'talk-a', 'talk-b', 'demonstrate', 'wand-cast', 'celebrate'],
    actions: ['demonstrate', 'wand-cast', 'celebrate'],
  }),
  Object.freeze({
    id: 'character.neville',
    slug: 'neville',
    displayName: 'Neville',
    voiceRole: 'gentle-worried-classmate',
    definition: nevilleCharacterDefinition,
    source: nevilleFullFrameCharacterDefinition,
    module: nevilleCharacterModule,
    review: nevilleCharacterReview,
    descriptor: nevilleSpriteReviewDescriptor,
    loadRuntime: loadNevilleCharacterRuntime,
    frameNames: ['neutral', 'talk-a', 'talk-b', 'tearful', 'relieved', 'reunion'],
    actions: ['reunion'],
  }),
  Object.freeze({
    id: 'character.trevor',
    slug: 'trevor',
    displayName: 'Trevor',
    voiceRole: 'creature',
    definition: trevorCharacterDefinition,
    source: trevorFullFrameCharacterDefinition,
    module: trevorCharacterModule,
    review: trevorCharacterReview,
    descriptor: trevorSpriteReviewDescriptor,
    loadRuntime: loadTrevorCharacterRuntime,
    frameNames: ['neutral', 'hidden-eyes', 'croak', 'hop', 'held', 'reunion'],
    actions: ['revealed', 'hop', 'croak', 'held', 'reunion'],
  }),
  Object.freeze({
    id: 'character.friendly-ghost',
    slug: 'friendly-ghost',
    displayName: 'Friendly Ghost',
    voiceRole: 'friendly-bookish-ghost',
    definition: friendlyGhostCharacterDefinition,
    source: friendlyGhostFullFrameCharacterDefinition,
    module: friendlyGhostCharacterModule,
    review: friendlyGhostCharacterReview,
    descriptor: friendlyGhostSpriteReviewDescriptor,
    loadRuntime: loadFriendlyGhostCharacterRuntime,
    frameNames: ['ambient', 'talk-a', 'talk-b', 'emerge', 'listening-reward', 'delighted'],
    actions: ['emerge'],
  }),
]);

const TREVOR_HELD_EDIT_METADATA_URL = new URL(
  '../art/characters/trevor/edits/held-v2.metadata.json',
  import.meta.url,
);
const TREVOR_BATCH_METADATA_URL = new URL(
  '../art/characters/trevor/batch/core-v1.metadata.json',
  import.meta.url,
);
const TREVOR_HELD_ASSET_URL = new URL(
  '../public/assets/art/characters/trevor/default/held.png',
  import.meta.url,
);
const ACCEPTED_TREVOR_HELD_SHA256 =
  'f4113af0392bf2b2df21f35f3f021e08bdab91e4adfd6823d6c89db035a52f22';

function authoredCapabilities(source) {
  const poses = new Set();
  const actions = new Set();
  for (const appearance of Object.values(source.appearances)) {
    Object.keys(appearance.clips).forEach((pose) => poses.add(pose));
    Object.keys(appearance.aliases ?? {}).forEach((pose) => poses.add(pose));
    Object.keys(appearance.actions ?? {}).forEach((action) => actions.add(action));
  }
  return {
    poses: [...poses].sort(),
    actions: [...actions].sort(),
  };
}

describe('Chapter Three character packages', () => {
  it('publishes exact stable identities and complete player-visible semantics', () => {
    expect(PACKAGES.map(({ id }) => id)).toEqual([
      'character.flitwick',
      'character.neville',
      'character.trevor',
      'character.friendly-ghost',
    ]);

    for (const characterPackage of PACKAGES) {
      const {
        id, displayName, voiceRole, definition, source, module, review, descriptor, actions,
      } = characterPackage;
      const authored = authoredCapabilities(source);
      expect(definition.id).toBe(id);
      expect(definition.metadata.displayName).toBe(displayName);
      expect(definition.metadata.voiceRole).toBe(voiceRole);
      expect(definition.surfaces).toEqual(['world', 'portrait']);
      expect([...definition.capabilities.poses].sort()).toEqual(authored.poses);
      expect([...definition.capabilities.actions].sort()).toEqual(authored.actions);
      expect(definition.capabilities.actions).toEqual(actions);
      expect(definition.capabilities.supportsReducedMotion).toBe(true);
      expect(module.definition).toBe(definition);
      expect(module.loadRuntime).toBe(characterPackage.loadRuntime);
      expect(module.reviews).toEqual([
        expect.objectContaining({ sceneId: `${characterPackage.slug}-sprite-review` }),
      ]);
      expect(review.captureProfiles).toEqual([
        { width: 1280, height: 720 },
        { width: 2560, height: 1440 },
      ]);
      expect(descriptor.sceneId).toBe(`${characterPackage.slug}-sprite-review`);
      expect(descriptor.characterDependencies).toEqual([id]);
      expect(new Set(descriptor.entries.map(({ surface }) => surface))).toEqual(
        new Set(['world', 'portrait']),
      );
      expect(Object.isFrozen(definition)).toBe(true);
      expect(Object.isFrozen(module)).toBe(true);
      expect(Object.isFrozen(descriptor)).toBe(true);
    }
  });

  it('maps every reviewed production frame into each package manifest', () => {
    for (const {
      id, slug, definition, source, frameNames,
    } of PACKAGES) {
      const manifest = createFullFrameCharacterManifest(source, { resolveFrame: (path) => path });
      expect(manifest.id).toBe(id);
      expect(manifest.fullFrame.assetFiles).toEqual(
        frameNames.map((name) => `assets/art/characters/${slug}/default/${name}.png`),
      );
      expect(Object.values(definition.assets).map(({ path }) => path).sort()).toEqual(
        [...manifest.fullFrame.assetFiles].sort(),
      );
    }
  });

  it('pins Trevor held.png to the accepted held-v2 replacement provenance', async () => {
    const [editMetadataText, batchMetadataText, shippingBytes] = await Promise.all([
      readFile(TREVOR_HELD_EDIT_METADATA_URL, 'utf8'),
      readFile(TREVOR_BATCH_METADATA_URL, 'utf8'),
      readFile(TREVOR_HELD_ASSET_URL),
    ]);
    const editMetadata = JSON.parse(editMetadataText);
    const batchMetadata = JSON.parse(batchMetadataText);
    const shippingHash = createHash('sha256').update(shippingBytes).digest('hex');
    const supersededBatchFrame = batchMetadata.deterministic_extraction.frames.find(
      ({ name }) => name === 'held',
    );

    expect(editMetadata).toMatchObject({
      status: 'accepted production replacement',
      deterministic_processing: {
        frame: {
          path: 'art/characters/trevor/edits/held-v2-frame.png',
          sha256: ACCEPTED_TREVOR_HELD_SHA256,
        },
      },
      review: { result: 'accepted' },
      promotion: {
        source: 'art/characters/trevor/edits/held-v2-frame.png',
        path: 'public/assets/art/characters/trevor/default/held.png',
        sha256: ACCEPTED_TREVOR_HELD_SHA256,
      },
    });
    expect(shippingHash).toBe(ACCEPTED_TREVOR_HELD_SHA256);
    expect(supersededBatchFrame).toMatchObject({
      path: 'public/assets/art/characters/trevor/default/held.png',
      sha256: '673a18a46ddfda69ee604b9ceca4064860fb2750aaf2ade6650950d87515a0f7',
    });
    expect(shippingHash).not.toBe(supersededBatchFrame.sha256);
  });

  it('resolves every authored pose and set-piece action without fallback art', () => {
    for (const { definition, source } of PACKAGES) {
      const manifest = createFullFrameCharacterManifest(source, { resolveFrame: (path) => path });
      for (const pose of definition.capabilities.poses) {
        expect(() => resolveFullFrameCharacterAnimation(manifest, {
          appearance: 'default', pose, reducedMotion: true,
        })).not.toThrow();
      }
      for (const action of definition.capabilities.actions) {
        expect(() => resolveFullFrameCharacterAnimation(manifest, {
          appearance: 'default',
          pose: definition.defaults.pose,
          action,
          actionTime: 0.4,
          actionProgress: 0.5,
          reducedMotion: true,
        })).not.toThrow();
      }
    }
  });

  it('lazy-loads registry-shaped runtimes without decoding images at import time', async () => {
    let imageConstructions = 0;
    vi.stubGlobal('Image', class {
      constructor() {
        imageConstructions += 1;
      }
    });

    try {
      expect(imageConstructions).toBe(0);
      for (const { loadRuntime } of PACKAGES) {
        const runtime = await loadRuntime();
        expect(runtime).toMatchObject({
          renderers: {
            world: expect.any(Function),
            portrait: expect.any(Function),
          },
          preload: expect.any(Function),
          release: expect.any(Function),
        });
        expect(Object.isFrozen(runtime)).toBe(true);
      }
      expect(imageConstructions).toBe(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps the unnamed ghost identity out of story-facing metadata', () => {
    expect(friendlyGhostCharacterDefinition.metadata.displayName).toBe('Friendly Ghost');
    expect(JSON.stringify(friendlyGhostCharacterDefinition)).not.toMatch(/Peregrine|Parchment/u);
  });
});
