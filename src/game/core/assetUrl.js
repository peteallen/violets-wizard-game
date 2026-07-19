const FULL_GIT_SHA = /^[a-f0-9]{40}$/;

export function revisionedAssetUrl(path, {
  baseUrl = './',
  buildSha = '',
  production = false,
} = {}) {
  if (!path) return null;
  const clean = path.replace(/^\/+/, '');
  const url = `${baseUrl}${clean}`;
  if (!production || !FULL_GIT_SHA.test(buildSha)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${buildSha}`;
}

export function assetUrl(path) {
  return revisionedAssetUrl(path, {
    baseUrl: import.meta.env.BASE_URL,
    buildSha: import.meta.env.VITE_BUILD_SHA,
    production: import.meta.env.PROD,
  });
}
