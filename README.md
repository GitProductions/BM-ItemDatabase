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

### Notes

- Velite outputs to `.velite/` and static assets to `public/static` (both ignored in git).
- Light/dark mode is handled with CSS variables and a small client toggle.
- In-view animations use native IntersectionObserver; gradients are minimal and controlled.
