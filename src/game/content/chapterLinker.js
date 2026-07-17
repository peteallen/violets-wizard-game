import { freezePureData, isPlainObject } from './chapterAuthoring.js';

const ACTION_ARRAY_KEYS = new Set([
  'actions',
  'assistActions',
  'onComplete',
  'onEnter',
  'onExit',
  'onInteract',
  'onSelect',
  'onStart',
]);

function registryHas(registry, id) {
  if (!registry) return false;
  if (typeof registry === 'function') return Boolean(registry(id));
  if (typeof registry.has === 'function') return registry.has(id);
  if (Array.isArray(registry)) return registry.includes(id);
  return isPlainObject(registry) && Object.hasOwn(registry, id);
}

function registryEntry(registry, id) {
  if (!registry) return null;
  if (typeof registry.get === 'function') return registry.get(id) ?? null;
  if (isPlainObject(registry)) return registry[id] ?? null;
  return null;
}

function objectValues(value) {
  return isPlainObject(value) ? Object.values(value) : [];
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function pathEntries(record, root) {
  if (!isPlainObject(record)) return [];
  return Object.entries(record).map(([id, value]) => ({ id, value, path: `${root}.${id}` }));
}

export function linkChapterPackage(chapter, registries = {}) {
  const issues = [];
  const issueKeys = new Set();
  const addIssue = (code, path, reference, message) => {
    const key = `${code}\u0000${path}\u0000${String(reference)}`;
    if (issueKeys.has(key)) return;
    issueKeys.add(key);
    issues.push({ code, path, reference, message });
  };

  const rooms = isPlainObject(chapter?.rooms) ? chapter.rooms : {};
  const scenes = isPlainObject(chapter?.scenes) ? chapter.scenes : {};
  const npcs = isPlainObject(chapter?.npcs) ? chapter.npcs : {};
  const dialogues = isPlainObject(chapter?.dialogues) ? chapter.dialogues : {};
  const setPieces = isPlainObject(chapter?.setPieces) ? chapter.setPieces : {};
  const maps = isPlainObject(chapter?.maps) ? chapter.maps : {};
  const declaredAssets = isPlainObject(chapter?.assets) ? chapter.assets : {};
  const dependencies = new Set(array(chapter?.characterDependencies));
  const yearbookMoments = new Set(array(chapter?.yearbookMoments));
  const actualAssets = registries.assets ?? declaredAssets;
  const chapterRegistry = registries.chapters ?? registries.chapterCatalog;

  const roomExists = (roomId, path) => {
    if (typeof roomId === 'string' && Object.hasOwn(rooms, roomId)) return true;
    addIssue('unresolved-room', path, roomId, `Room ${String(roomId)} is not defined by ${chapter?.id ?? 'the chapter'}.`);
    return false;
  };
  const spawnExists = (roomId, spawnId, path) => {
    if (!roomExists(roomId, path.replace(/\.spawn$/u, '.room'))) return false;
    const spawns = rooms[roomId]?.spawns;
    if (isPlainObject(spawns) && Object.hasOwn(spawns, spawnId)) return true;
    addIssue('unresolved-spawn', path, `${roomId}:${String(spawnId)}`, `Spawn ${String(spawnId)} is not defined in ${roomId}.`);
    return false;
  };
  const npcExists = (npcId, path) => {
    if (typeof npcId === 'string' && Object.hasOwn(npcs, npcId)) return true;
    addIssue('unresolved-npc', path, npcId, `NPC ${String(npcId)} is not defined by ${chapter?.id ?? 'the chapter'}.`);
    return false;
  };
  const dialogueExists = (dialogueId, path) => {
    if (typeof dialogueId === 'string' && Object.hasOwn(dialogues, dialogueId)) return true;
    addIssue('unresolved-dialogue', path, dialogueId, `Dialogue ${String(dialogueId)} is not defined by ${chapter?.id ?? 'the chapter'}.`);
    return false;
  };
  const setPieceExists = (setPieceId, path) => {
    if (typeof setPieceId === 'string' && Object.hasOwn(setPieces, setPieceId)) return true;
    addIssue('unresolved-set-piece', path, setPieceId, `Set piece ${String(setPieceId)} is not defined by ${chapter?.id ?? 'the chapter'}.`);
    return false;
  };
  const mapExists = (mapId, path) => {
    if (typeof mapId === 'string' && Object.hasOwn(maps, mapId)) return true;
    addIssue('unresolved-map', path, mapId, `Map ${String(mapId)} is not defined by ${chapter?.id ?? 'the chapter'}.`);
    return false;
  };
  const assetExists = (assetKey, path) => {
    if (typeof assetKey === 'string' && registryHas(actualAssets, assetKey)) return true;
    addIssue('unresolved-asset', path, assetKey, `Asset ${String(assetKey)} is not registered.`);
    return false;
  };
  const cardExists = (cardId, path) => {
    if (typeof cardId === 'string' && registryHas(registries.cards, cardId)) return true;
    addIssue('unresolved-card', path, cardId, `Card ${String(cardId)} is not registered.`);
    return false;
  };
  const chapterExists = (chapterId, path) => {
    if (typeof chapterId === 'string' && registryHas(chapterRegistry, chapterId)) return true;
    addIssue('unresolved-chapter', path, chapterId, `Chapter ${String(chapterId)} is not registered.`);
    return false;
  };
  const characterExists = (characterId, path) => {
    if (registryHas(registries.characters, characterId)) return true;
    addIssue('unresolved-character', path, characterId, `Character ${String(characterId)} is not registered.`);
    return false;
  };
  const declaredCharacterExists = (characterId, path) => {
    if (!dependencies.has(characterId)) {
      addIssue(
        'undeclared-character-dependency',
        path,
        characterId,
        `Character ${characterId} must be declared in characterDependencies.`,
      );
    }
    return characterExists(characterId, path);
  };

  const hotspotsByRoom = new Map();
  const addHotspots = (roomId, hotspots) => {
    const ids = hotspotsByRoom.get(roomId) ?? new Set();
    for (const hotspot of array(hotspots)) if (typeof hotspot?.id === 'string') ids.add(hotspot.id);
    hotspotsByRoom.set(roomId, ids);
  };
  for (const [roomId, room] of Object.entries(rooms)) addHotspots(roomId, room?.hotspots);
  for (const scene of Object.values(scenes)) addHotspots(scene?.room, scene?.layer?.hotspots);

  const checkHotspot = (roomId, hotspotId, path) => {
    if (!roomExists(roomId, `${path}.room`)) return false;
    if (hotspotsByRoom.get(roomId)?.has(hotspotId)) return true;
    addIssue('unresolved-hotspot', `${path}.hotspot`, hotspotId, `Hotspot ${String(hotspotId)} is not defined in ${roomId}.`);
    return false;
  };

  const linkAction = (action, path) => {
    if (!isPlainObject(action) || typeof action.type !== 'string') {
      addIssue('unresolved-action', `${path}.type`, action?.type, 'Action must have a registered type.');
      return;
    }
    const actionRegistered = registryHas(registries.actions, action.type);
    if (!actionRegistered) {
      addIssue('unresolved-action', `${path}.type`, action.type, `Action type ${action.type} is not registered.`);
      return;
    }
    if (action.type === 'dialogue.start') dialogueExists(action.script, `${path}.script`);
    if (action.type === 'setPiece.play') setPieceExists(action.id, `${path}.id`);
    if (action.type === 'travel.request') spawnExists(action.room, action.spawn, `${path}.spawn`);

    const actionDefinition = registryEntry(registries.actions, action.type);
    const referenceProvider = typeof registries.actions?.references === 'function'
      ? () => registries.actions.references(action, path)
      : typeof actionDefinition?.references === 'function'
        ? () => actionDefinition.references(action)
        : null;
    if (referenceProvider) {
      let references;
      try {
        references = referenceProvider() ?? [];
      } catch (error) {
        addIssue('action-link-error', path, action.type, error instanceof Error ? error.message : String(error));
        references = [];
      }
      array(references).forEach((reference, index) => {
        const referencePath = reference.path ? `${path}.${reference.path}` : `${path}.references[${index}]`;
        if (reference.kind === 'room') roomExists(reference.id, referencePath);
        else if (reference.kind === 'npc') npcExists(reference.id, referencePath);
        else if (reference.kind === 'dialogue') dialogueExists(reference.id, referencePath);
        else if (reference.kind === 'map') mapExists(reference.id, referencePath);
        else if (reference.kind === 'setPiece') setPieceExists(reference.id, referencePath);
        else if (reference.kind === 'asset') assetExists(reference.id, referencePath);
        else if (reference.kind === 'character') characterExists(reference.id, referencePath);
        else if (reference.kind === 'card') cardExists(reference.id, referencePath);
        else if (reference.kind === 'durableWrite' && !reference.id.startsWith(`${chapter.id}.`)) {
          addIssue(
            'foreign-durable-write',
            referencePath,
            reference.id,
            `Durable write ${reference.id} must belong to ${chapter.id}.`,
          );
        } else if (reference.kind === 'chapterOwner' && reference.id !== chapter.id) {
          addIssue(
            'chapter-owner-mismatch',
            referencePath,
            reference.id,
            `Chapter completion owner ${reference.id} must match ${chapter.id}.`,
          );
        } else if (reference.kind === 'chapterDestination') {
          chapterExists(reference.id, referencePath);
        } else if (reference.kind === 'yearbookMoment' && !yearbookMoments.has(reference.id)) {
          addIssue(
            'undeclared-yearbook-moment',
            referencePath,
            reference.id,
            `Yearbook moment ${reference.id} is not declared by ${chapter.id}.`,
          );
        }
      });
    }
  };

  const scanActions = (value, path, visited = new WeakSet()) => {
    if (value === null || typeof value !== 'object') return;
    if (visited.has(value)) return;
    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach((entry, index) => scanActions(entry, `${path}[${index}]`, visited));
      return;
    }
    for (const [key, entry] of Object.entries(value)) {
      const entryPath = `${path}.${key}`;
      if (ACTION_ARRAY_KEYS.has(key) && Array.isArray(entry)) {
        entry.forEach((action, index) => linkAction(action, `${entryPath}[${index}]`));
      } else {
        scanActions(entry, entryPath, visited);
      }
    }
  };

  if (chapter?.start) spawnExists(chapter.start.room, chapter.start.spawn, 'chapter.start.spawn');
  if (chapter?.start?.scene && !Object.hasOwn(scenes, chapter.start.scene)) {
    addIssue('unresolved-scene', 'chapter.start.scene', chapter.start.scene, `Scene ${chapter.start.scene} is not defined.`);
  }

  for (const { id, value: scene, path } of pathEntries(scenes, 'chapter.scenes')) {
    spawnExists(scene.room, scene.spawn, `${path}.spawn`);
    if (scene.resumeAt) spawnExists(scene.resumeAt.room, scene.resumeAt.spawn, `${path}.resumeAt.spawn`);
    const mapId = scene.mapId ?? (typeof scene.map === 'string' ? scene.map : null);
    if (mapId) mapExists(mapId, `${path}.mapId`);
    const layer = scene.layer;
    if (isPlainObject(layer)) {
      linkRoomElements(layer, path, scene.room, {
        npcExists, spawnExists, setPieceExists,
      });
    }
    if (scene.id !== id) {
      addIssue('mismatched-id', `${path}.id`, scene.id, `Scene map key ${id} does not match its value id.`);
    }
  }

  for (const { id: roomId, value: room, path } of pathEntries(rooms, 'chapter.rooms')) {
    linkRoomElements(room, path, roomId, { npcExists, spawnExists, setPieceExists });
    for (const key of array(room?.background?.layers)) assetExists(key, `${path}.background.layers`);
    for (const [variant, keys] of Object.entries(room?.background?.variants ?? {})) {
      for (const key of array(keys)) assetExists(key, `${path}.background.variants.${variant}`);
    }
  }

  for (const { value: npc, path } of pathEntries(npcs, 'chapter.npcs')) {
    if (npc.defaultTalk) dialogueExists(npc.defaultTalk, `${path}.defaultTalk`);
    const characterId = npc.character ?? npc.characterId;
    if (characterId) {
      declaredCharacterExists(characterId, `${path}.character`);
    }
  }

  for (const { value: dialogue, path } of pathEntries(dialogues, 'chapter.dialogues')) {
    for (const [nodeId, node] of Object.entries(dialogue?.nodes ?? {})) {
      const nodePath = `${path}.nodes.${nodeId}`;
      if (node?.type === 'line') {
        npcExists(node.speaker, `${nodePath}.speaker`);
        assetExists(node.voice, `${nodePath}.voice`);
      } else if (node?.type === 'choice') {
        array(node.choices).forEach((choice, choiceIndex) => {
          if (choice?.characterId) {
            declaredCharacterExists(
              choice.characterId,
              `${nodePath}.choices[${choiceIndex}].characterId`,
            );
          }
        });
      }
    }
  }

  for (const { value: quest, path } of pathEntries(chapter?.quests, 'chapter.quests')) {
    if (quest.offerScript) dialogueExists(quest.offerScript, `${path}.offerScript`);
    for (const [stepId, step] of Object.entries(quest?.steps ?? {})) {
      const stepPath = `${path}.steps.${stepId}`;
      if (step?.objective?.speaker) npcExists(step.objective.speaker, `${stepPath}.objective.speaker`);
      if (step?.objective?.voice) assetExists(step.objective.voice, `${stepPath}.objective.voice`);
      if (step?.objective?.mapStar) {
        checkHotspot(step.objective.mapStar.room, step.objective.mapStar.hotspot, `${stepPath}.objective.mapStar`);
      }
    }
  }

  for (const { value: setPiece, path } of pathEntries(setPieces, 'chapter.setPieces')) {
    for (const key of array(setPiece.assets)) assetExists(key, `${path}.assets`);
    if (setPiece.fallback) setPieceExists(setPiece.fallback, `${path}.fallback`);
    if (setPiece.reducedMotion) setPieceExists(setPiece.reducedMotion, `${path}.reducedMotion`);
    if (setPiece.renderer && registries.setPieceRenderers && !registryHas(registries.setPieceRenderers, setPiece.renderer)) {
      addIssue(
        'unresolved-set-piece-renderer',
        `${path}.renderer`,
        setPiece.renderer,
        `Set-piece renderer ${setPiece.renderer} is not registered.`,
      );
    }
  }

  for (const { value: map, path } of pathEntries(maps, 'chapter.maps')) {
    if (map.asset) assetExists(map.asset, `${path}.asset`);
    array(map.locations).forEach((location, index) => {
      const locationPath = `${path}.locations[${index}]`;
      if (location?.to) spawnExists(location.to.room, location.to.spawn, `${locationPath}.to.spawn`);
      if (location?.objectiveTarget) {
        checkHotspot(
          location.objectiveTarget.room,
          location.objectiveTarget.hotspot,
          `${locationPath}.objectiveTarget`,
        );
      }
    });
  }

  if (chapter?.chapterCard?.art) assetExists(chapter.chapterCard.art, 'chapter.chapterCard.art');
  if (chapter?.chapterCard?.voice) assetExists(chapter.chapterCard.voice, 'chapter.chapterCard.voice');
  array(chapter?.recaps).forEach((recap, index) => {
    if (recap?.voice) assetExists(recap.voice, `chapter.recaps[${index}].voice`);
  });
  array(chapter?.characterDependencies).forEach((characterId, index) => {
    characterExists(characterId, `chapter.characterDependencies[${index}]`);
  });

  scanActions(chapter, 'chapter');
  issues.sort((left, right) => (
    left.path.localeCompare(right.path)
    || left.code.localeCompare(right.code)
    || String(left.reference).localeCompare(String(right.reference))
  ));
  return freezePureData({ ok: issues.length === 0, issues }, `chapter ${chapter?.id ?? 'unknown'} link result`);
}

function linkRoomElements(value, path, roomId, {
  npcExists,
  spawnExists,
  setPieceExists,
}) {
  array(value?.occupants).forEach((occupant, index) => {
    const occupantPath = `${path}.occupants[${index}]`;
    npcExists(occupant?.npc, `${occupantPath}.npc`);
    if (occupant?.render?.lookAt?.target) {
      npcExists(occupant.render.lookAt.target, `${occupantPath}.render.lookAt.target`);
    }
  });
  array(value?.exits).forEach((exit, index) => {
    if (exit?.to) spawnExists(exit.to.room, exit.to.spawn, `${path}.exits[${index}].to.spawn`);
  });
  array(value?.ambientSetPieces).forEach((setPieceId, index) => {
    setPieceExists(setPieceId, `${path}.ambientSetPieces[${index}]`);
  });
  if (value?.room && value.room !== roomId) {
    spawnExists(value.room, value.spawn, `${path}.spawn`);
  }
}
