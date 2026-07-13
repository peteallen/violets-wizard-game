export function resolveRoomVariant(room, requestedVariant = 'base') {
  const variant = typeof requestedVariant === 'string' && requestedVariant
    ? requestedVariant
    : 'base';
  if (variant === 'base') return 'base';

  const variantLayers = room?.background?.variants?.[variant];
  return Array.isArray(variantLayers) && variantLayers.length ? variant : 'base';
}
