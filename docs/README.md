# ckanext-gztr docs web app (gztr.dathere.com)

![Docs landing page example](./public/media/docs-home-example.png)

This directory includes a Next.js project built with [Fumadocs](https://github.com/fuma-nama/fumadocs) for documentation of ckanext-gztr. The documentation can be viewed at [gztr.dathere.com](https://gztr.dathere.com).

## Development

Run development server with [pnpm](https://pnpm.io):

```bash
pnpm i
pnpm dev
```

Open http://localhost:3000 with your browser to see the result.

## Explore

In the project, you can see:

- `lib/source.ts`: Code for content source adapter, `loader()` provides the interface to access your content.
- `lib/layout.shared.tsx`: Shared options for layouts, optional but preferred to keep.

| Route                     | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `app/(home)`              | The route group for your landing page and other pages. |
| `app/docs`                | The documentation layout and pages.                    |
| `app/api/search/route.ts` | The Route Handler for search.                          |

## Linting

We use [Biome](https://biomejs.dev) for linting. We recommend you install the [biome-vscode extension](https://github.com/biomejs/biome-vscode) if you are using [VSCodium](https://vscodium.com/) or VSCode for developing the docs.
