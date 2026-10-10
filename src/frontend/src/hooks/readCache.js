const lifetime = 60000;
const maximumEntries = 32;
const maximumBytes = 8 * 1024 * 1024;
const maximumEntryBytes = 2 * 1024 * 1024;
const entries = new Map();
let user = null;
let sessionVersion = 0;
let generation = 0;
let bytes = 0;

// Only the current account's recent reads live in memory. Nothing is persisted.
export function clearReadCache() {
  entries.clear();
  bytes = 0;
  generation++;
}

export function resetReadCacheSession() {
  user = null;
  sessionVersion++;
  clearReadCache();
}

export function setReadCacheUser(id) {
  const next = id == null ? null : String(id);
  if (next !== user) {
    resetReadCacheSession();
    user = next;
  }
}

export function readCacheSession(id) {
  if (id == null || user === null || String(id) !== user) return null;
  return { user, sessionVersion, generation };
}

export function isReadCacheSessionCurrent(session) {
  return Boolean(session && session.user === user && session.sessionVersion === sessionVersion);
}

export function isReadCacheGenerationCurrent(session) {
  return isReadCacheSessionCurrent(session) && session.generation === generation;
}

function remove(key) {
  const entry = entries.get(key);
  if (!entry) return;
  bytes -= entry.bytes;
  entries.delete(key);
}

function canCache(session, resource) {
  return (
    isReadCacheGenerationCurrent(session) &&
    typeof resource === 'string' &&
    !/^\/?(?:me|review)(?:$|[:/?])/i.test(resource)
  );
}

export function readCachedResource(session, resource, now = Date.now()) {
  if (!canCache(session, resource)) return null;
  const entry = entries.get(resource);
  if (!entry) return null;
  if (now - entry.created >= lifetime) {
    remove(resource);
    return null;
  }
  // Give callers their own value so editing a draft cannot change cached reads.
  entries.delete(resource);
  entries.set(resource, entry);
  return { value: JSON.parse(entry.json), lastSynced: new Date(entry.created) };
}

export function cacheReadResource(session, resource, value, now = Date.now()) {
  if (!canCache(session, resource)) return;
  let json;
  try {
    json = JSON.stringify(value);
  } catch {
    return;
  }
  if (json === undefined || json.length * 2 > maximumEntryBytes) return;
  for (const [key, entry] of entries) {
    if (now - entry.created >= lifetime) remove(key);
  }
  remove(resource);
  const size = json.length * 2;
  while (entries.size >= maximumEntries || bytes + size > maximumBytes) {
    remove(entries.keys().next().value);
  }
  entries.set(resource, { json, bytes: size, created: now });
  bytes += size;
}
