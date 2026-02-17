import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseRegisterBody } from '../.tmp-openapi/auth.js';
import { parseLeaderboardQuery } from '../.tmp-openapi/leaderboard.js';
import {
  parseItemsDeleteBody,
  parseItemsGetQuery,
  parseItemsPatchBody,
  parseItemsPostBody,
} from '../.tmp-openapi/items.js';
import { parseSuggestionBody } from '../.tmp-openapi/suggestions.js';

const specRaw = readFileSync('openapi/openapi.v1.json', 'utf-8');
const spec = JSON.parse(specRaw);

assert.equal(spec.openapi, '3.0.3');
assert.ok(spec.paths['/api/items']);
assert.ok(spec.paths['/api/leaderboard']);
assert.ok(spec.paths['/api/suggestions']);
assert.ok(spec.paths['/api/auth/register']);
assert.ok(spec.components.securitySchemes.bearerAuth);

assert.equal(parseItemsGetQuery(new URLSearchParams('flagged=true&limit=10')).ok, true);
assert.equal(parseItemsGetQuery(new URLSearchParams('flagged=maybe')).ok, false);
assert.equal(parseItemsGetQuery(new URLSearchParams('limit=abc')).ok, false);
assert.equal(parseItemsGetQuery(new URLSearchParams('q=cloak&test=foo')).ok, false);

assert.equal(
  (await parseItemsPostBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'Short sword', type: 'weapon' }) }))).ok,
  true,
);
assert.equal(
  (await parseItemsPostBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ item: { name: 'Short sword', type: 'weapon' } }) }))).ok,
  true,
);
assert.equal(
  (await parseItemsPostBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ raw: 'identify output...' }) }))).ok,
  true,
);
assert.equal(
  (await parseItemsPostBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ items: [{ name: 'Short sword', type: 'weapon' }] }) }))).ok,
  true,
);
assert.equal(
  (await parseItemsPostBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ item: { name: 'Missing type' } }) }))).ok,
  false,
);
assert.equal(
  (await parseItemsPostBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: 'Short sword', type: 'weapon', junk: true }) }))).ok,
  false,
);

assert.equal(
  (await parseItemsPatchBody(new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ item: { name: 'Axe', type: 'weapon' } }) }))).ok,
  true,
);
assert.equal(
  (await parseItemsPatchBody(new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ items: [] }) }))).ok,
  false,
);

assert.equal(
  (await parseItemsDeleteBody(new Request('http://localhost', { method: 'DELETE', body: JSON.stringify({ id: 'abc123' }) }))).ok,
  true,
);
assert.equal(
  (await parseItemsDeleteBody(new Request('http://localhost', { method: 'DELETE', body: JSON.stringify({}) }))).ok,
  false,
);

assert.equal(parseLeaderboardQuery(new URLSearchParams('limit=25')).ok, true);
assert.equal(parseLeaderboardQuery(new URLSearchParams('limit=abc')).ok, false);

assert.equal(
  (await parseSuggestionBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ itemId: 'item-1', note: 'needs review' }) }))).ok,
  true,
);
assert.equal(
  (await parseSuggestionBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ itemId: '', note: '' }) }))).ok,
  false,
);
assert.equal(
  (await parseSuggestionBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ itemId: 'item-1', note: 'x', extra: true }) }))).ok,
  false,
);

assert.equal(
  (await parseRegisterBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'a@b.com', name: 'Alice', password: 'password123' }) }))).ok,
  true,
);
assert.equal(
  (await parseRegisterBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'bad-email', name: 'Alice', password: 'password123' }) }))).ok,
  false,
);
assert.equal(
  (await parseRegisterBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'a@b.com', name: 'Alice', password: 'short' }) }))).ok,
  false,
);
assert.equal(
  (await parseRegisterBody(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ email: 'a@b.com', name: 'Alice', password: 'password123', role: 'admin' }) }))).ok,
  false,
);

console.log('API schema checks passed');
