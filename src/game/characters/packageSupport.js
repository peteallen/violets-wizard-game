export const CHARACTER_REVIEW_CAPTURE_PROFILES = Object.freeze([
  Object.freeze({ width: 1280, height: 720 }),
  Object.freeze({ width: 2560, height: 1440 }),
]);

export function characterImageAssets(characterSlug, relativePaths) {
  if (typeof characterSlug !== 'string' || characterSlug.trim() === '') {
    throw new TypeError('Character asset slug must be a non-empty string.');
  }
  if (!Array.isArray(relativePaths)) throw new TypeError('Character asset paths must be an array.');
  const assets = {};
  for (const relativePath of relativePaths) {
    if (typeof relativePath !== 'string' || !relativePath.endsWith('.png')) {
      throw new TypeError(`Character asset ${relativePath} must be a PNG path.`);
    }
    const key = `characters/${characterSlug}/${relativePath.replace(/\.png$/u, '')}`;
    if (Object.hasOwn(assets, key)) throw new TypeError(`Duplicate character asset ${key}.`);
    assets[key] = Object.freeze({
      path: `assets/art/characters/${characterSlug}/${relativePath}`,
      kind: 'image',
    });
  }
  return Object.freeze(assets);
}

export function defineCharacterReview(sceneIds) {
  if (!Array.isArray(sceneIds) || sceneIds.length === 0) {
    throw new TypeError('Character review metadata requires at least one scene.');
  }
  return Object.freeze({
    sceneIds: Object.freeze([...sceneIds]),
    captureProfiles: CHARACTER_REVIEW_CAPTURE_PROFILES,
  });
}

export function characterReviewRegistrations(review) {
  if (!review || !Array.isArray(review.sceneIds) || !Array.isArray(review.captureProfiles)) {
    throw new TypeError('Character review registrations require sceneIds and captureProfiles arrays.');
  }
  return Object.freeze(review.sceneIds.map((sceneId) => Object.freeze({
    sceneId,
    captureProfiles: review.captureProfiles,
  })));
}
