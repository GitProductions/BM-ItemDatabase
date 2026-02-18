## Blackmud Item Database (Next.js 15.5.10 + Tailwind CSS)

Item database created for the Blackmud Community.

### Prerequisites

- Node.js 18.20+ (LTS recommended)
- pnpm 10.x (project is configured for pnpm)

### Install

```bash
pnpm install
```


### Develop

```bash
pnpm dev
```

### Lint

```bash
pnpm lint
```

### Build for production

```bash
pnpm build
```


### Public API (for Mudlet or other clients)

### Caching Notes (`/api/items`)

- Read responses are cached via Next/OpenNext tag cache in `src/app/api/items/route.ts` using tag `items`.
- Cache entries are invalidated on writes (`POST`, `PATCH`, `DELETE`) via `revalidateTag('items')`.
- `?_fresh=<timestamp>` bypasses tag cache for one request and forces a direct DB read.
- Client-side race guard in `src/components/app-provider.tsx` uses `latestUpdatedAt` to ignore late stale responses.

When it is safe to remove `_fresh` and the `latestUpdatedAt` guard:
- only if the app enforces strict request ordering so an older response can never overwrite newer state.

### Database Search Index (D1 FTS5)

- `items` is the source-of-truth table.
- `items_fts` is an FTS5 full-text index used for `q` search.
- `searchItems()` uses `items_fts MATCH ?` and joins back to `items` for filtered results.

#### FTS sync triggers

- `items_ai`: after insert on `items`, adds the new row to `items_fts`.
- `items_ad`: after delete on `items`, removes the row from `items_fts`.
- `items_au`: after update on `items`, deletes old indexed text and inserts updated text.

These triggers keep search index data synchronized automatically without app-side index maintenance.


### API Schema for Cloudflare (OpenAPI 3.0.3)

- Source-of-truth schemas use `zod` in `src/lib/api-schema/`.
- OpenAPI is generated from Zod using `@asteasolutions/zod-to-openapi`.
- Build the schema artifact:

```bash
npm run schema:api:build
```

- Generated file: `openapi/openapi.v1.json`
- Versioning rule: bump `info.version` in `src/lib/api-schema/build-openapi.ts` whenever request contracts change.

#### Drift checks

```bash
npm run schema:api:test
npm run schema:api:check
```




