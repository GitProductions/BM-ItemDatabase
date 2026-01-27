## Gitproductions Portfolio (Next.js 16 + Velite)

This is a showcase site for Gitproductions covering website design, esports production/admin, application development, and graphics support. It uses Next.js 16 (App Router) with a Velite content layer, native CSS animations, and a light/dark theme.

### Prerequisites

- Node.js 18.20+ (LTS recommended)
- pnpm 10.x (project is configured for pnpm)

### Install

```bash
pnpm install
```

### Content build (Velite)

```bash
pnpm content:build   # one-off build
pnpm content:watch   # watch mode
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
