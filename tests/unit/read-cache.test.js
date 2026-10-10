import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cacheReadResource,
  clearReadCache,
  isReadCacheGenerationCurrent,
  isReadCacheSessionCurrent,
  readCachedResource,
  readCacheSession,
  resetReadCacheSession,
  setReadCacheUser,
} from '../../src/frontend/src/hooks/readCache.js';
import { api } from '../../src/frontend/src/api.js';

const originalFetch = globalThis.fetch;
beforeEach(() => {
  resetReadCacheSession();
  setReadCacheUser(1);
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetReadCacheSession();
});

test('cached reads are isolated from source values and caller drafts', () => {
  const session = readCacheSession(1);
  const value = { notes: [{ title: 'Saved note' }] };
  cacheReadResource(session, 'notes', value, 1000);
  value.notes[0].title = 'Changed input';
  const read = readCachedResource(session, 'notes', 1001);
  assert.equal(read.value.notes[0].title, 'Saved note');
  read.value.notes[0].title = 'Unsaved draft';
  assert.equal(readCachedResource(session, 'notes', 1002).value.notes[0].title, 'Saved note');
  assert.equal(read.lastSynced.getTime(), 1000);
});

test('expired entries and least recently used entries are discarded', () => {
  const session = readCacheSession(1);
  cacheReadResource(session, 'decks', { decks: [] }, 1000);
  assert.equal(readCachedResource(session, 'decks', 61000), null);
  for (let i = 0; i < 32; i++) cacheReadResource(session, `deck:${i}`, { id: i }, 62000);
  readCachedResource(session, 'deck:0', 62001);
  cacheReadResource(session, 'deck:32', { id: 32 }, 62002);
  assert.equal(readCachedResource(session, 'deck:1', 62003), null);
  assert.equal(readCachedResource(session, 'deck:0', 62003).value.id, 0);
});

test('large values cannot exceed the cache memory budget', () => {
  const session = readCacheSession(1);
  cacheReadResource(session, 'large', { body: 'x'.repeat(1024 * 1024) });
  assert.equal(readCachedResource(session, 'large'), null);
  for (let i = 0; i < 10; i++) {
    cacheReadResource(session, `notes:${i}`, { body: 'x'.repeat(500000) }, 1000);
  }
  assert.equal(readCachedResource(session, 'notes:0', 1001), null);
  assert.equal(readCachedResource(session, 'notes:9', 1001).value.body.length, 500000);
});

test('mutation invalidation rejects a read that began before the mutation', () => {
  const previous = readCacheSession(1);
  cacheReadResource(previous, 'decks', { decks: [{ name: 'Old' }] });
  clearReadCache();
  assert.equal(isReadCacheGenerationCurrent(previous), false);
  assert.equal(isReadCacheSessionCurrent(previous), true);
  cacheReadResource(previous, 'decks', { decks: [{ name: 'Late old response' }] });
  assert.equal(readCachedResource(readCacheSession(1), 'decks'), null);
  cacheReadResource(readCacheSession(1), 'decks', { decks: [{ name: 'Fresh' }] });
  assert.equal(readCachedResource(readCacheSession(1), 'decks').value.decks[0].name, 'Fresh');
});

test('account changes and session expiry reject old responses', () => {
  const first = readCacheSession(1);
  cacheReadResource(first, 'decks', { decks: [{ name: 'Private account A' }] });
  setReadCacheUser(2);
  assert.equal(isReadCacheSessionCurrent(first), false);
  cacheReadResource(first, 'decks', { decks: [{ name: 'Late A response' }] });
  assert.equal(readCachedResource(readCacheSession(2), 'decks'), null);
  resetReadCacheSession();
  setReadCacheUser(1);
  assert.equal(isReadCacheSessionCurrent(first), false);
  assert.equal(readCachedResource(readCacheSession(1), 'decks'), null);
});

test('missing context, authentication reads and review queues are not cached', () => {
  assert.equal(readCacheSession(null), null);
  assert.equal(readCacheSession(2), null);
  for (const resource of ['me', '/me', 'review', 'review:1', 'review?course=1', '/review?deck=1']) {
    cacheReadResource(readCacheSession(1), resource, { value: 'Must remain fresh' });
    assert.equal(readCachedResource(readCacheSession(1), resource), null);
  }
});

test('successful writes invalidate cached reads while failed writes preserve them', async () => {
  let status = 503;
  globalThis.fetch = async () => ({
    ok: status === 200,
    status,
    json: async () => (status === 200 ? { ok: true } : { error: 'Unavailable' }),
  });
  cacheReadResource(readCacheSession(1), 'decks', { decks: [] });
  await assert.rejects(api('/notes', 'POST', { title: 'New note' }), /Unavailable/);
  assert.notEqual(readCachedResource(readCacheSession(1), 'decks'), null);
  status = 200;
  await api('/notes', 'POST', { title: 'New note' });
  assert.equal(readCachedResource(readCacheSession(1), 'decks'), null);
});

test('401 and successful login end the previous cached session', async () => {
  const previous = readCacheSession(1);
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Expired' }),
  });
  await assert.rejects(api('/me'), /Expired/);
  assert.equal(isReadCacheSessionCurrent(previous), false);
  assert.equal(readCacheSession(1), null);
  setReadCacheUser(1);
  const next = readCacheSession(1);
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });
  await api('/login', 'POST', {});
  assert.equal(isReadCacheSessionCurrent(next), false);
});
