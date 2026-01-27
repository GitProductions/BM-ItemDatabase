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

### MongoDB integration

- Create a `.env.local` file in the project root (add it to `.gitignore` if not already ignored).
- Add the MongoDB connection information before starting the app:

```bash
MONGODB_URI="mongodb+srv://<user>:<secret>@cluster.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB="bm-item-database"
MONGODB_COLLECTION="items"
```

- The API under `app/api/items` uses those variables to drive the new Mongo-backed database, so restart `pnpm dev` after editing `.env.local`.

### Notes

- Velite outputs to `.velite/` and static assets to `public/static` (both ignored in git).
- Light/dark mode is handled with CSS variables and a small client toggle.
- In-view animations use native IntersectionObserver; gradients are minimal and controlled.
