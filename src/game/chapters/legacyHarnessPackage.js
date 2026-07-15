import { listActionFixtures } from '../../harness/actionFixtures.js';
import { listStateFixtures } from '../../harness/stateFixtures.js';

export function buildLegacyChapterHarnessPackage(chapterId, chapterNumber) {
  const actionsById = new Map(listActionFixtures().map(({ id, value }) => [id, value]));
  const registrations = listStateFixtures()
    .filter(({ value }) => value.entry.chapter === chapterNumber)
    .map(({ id, value: state }) => {
      const actions = actionsById.get(id);
      if (!actions) throw new Error(`Chapter harness scene ${id} has no matching action fixture.`);
      return Object.freeze({ sceneId: id, state, actions });
    });

  return Object.freeze({
    chapterId,
    registrations: Object.freeze(registrations),
  });
}
