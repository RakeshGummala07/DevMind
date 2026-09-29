/**
 * Only allow plain http(s) links to be rendered as <a href>. Values such as
 * "javascript:..." or "data:..." coming back from an API (or from GitHub via
 * the API) would otherwise become script-execution links.
 */
export function safeExternalUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}
