## Blackmud Item Database (Next.js 16 + Tailwind CSS)

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

# Search
curl "http://localhost:3000/api/items?q=broadsword&type=weapon&limit=20"

# Import identify dump
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"raw":"...identify output...","owner":"mudlet_user"}'

# Submit a single item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"item":{"name":"Shiny Dagger","keywords":"dagger shiny","type":"weapon","flags":["glow"],"stats":{"damage":"2d4","affects":[]}},"owner":"mudlet_user"}'


