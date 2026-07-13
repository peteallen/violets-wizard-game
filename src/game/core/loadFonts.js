const GAME_FONT_FACES = Object.freeze([
  '400 24px "Andika"',
  '700 24px "Andika"',
  '700 72px "Almendra"',
]);

export async function loadGameFonts(documentRef = globalThis.document) {
  if (!documentRef?.fonts?.load) return false;
  await Promise.all(GAME_FONT_FACES.map((face) => documentRef.fonts.load(face, 'Violet Hogwarts')));

  const warmup = documentRef.createElement?.('canvas');
  const context = warmup?.getContext?.('2d');
  if (warmup && context) {
    warmup.width = 64;
    warmup.height = 32;
    for (const face of GAME_FONT_FACES) {
      context.font = face;
      context.fillText('Violet', 0, 24);
    }
    warmup.width = 1;
    warmup.height = 1;
  }
  return true;
}

export { GAME_FONT_FACES };
