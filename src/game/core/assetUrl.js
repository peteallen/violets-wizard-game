export function assetUrl(path) {
  if (!path) return null;
  const clean = path.replace(/^\/+/, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}
