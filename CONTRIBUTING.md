# Contributing

Thanks for your interest in improving `sanity-plugin-section-builder`! This guide
covers everything you need to get a change merged.

## Prerequisites

- **Node.js ≥ 20** (required by both the published plugin and the dev toolchain).
- **pnpm** — this repo pins its version via the `packageManager` field. The
  easiest way to get the right one is [Corepack](https://nodejs.org/api/corepack.html):

  ```sh
  corepack enable
  ```

## Getting started

```sh
pnpm install
pnpm build      # produces dist/ so a linked studio can resolve the plugin
```

The `prepare` script installs a [husky](https://typicode.github.io/husky/)
pre-commit hook that runs [lint-staged](https://github.com/lint-staged/lint-staged)
(ESLint + Prettier) on your staged files automatically.

See the ["Using it locally before it's published"](./README.md#using-it-locally-before-its-published)
section of the README for wiring the plugin into a Sanity Studio via a link
dependency.

## Development workflow

| Command           | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| `pnpm watch`      | Rebuild `dist/` on change                            |
| `pnpm test`       | Run the unit tests once (`vitest run`)               |
| `pnpm lint`       | ESLint (`pnpm lint:fix` to autofix)                  |
| `pnpm format`     | Format with Prettier (`pnpm format:check` to verify) |
| `pnpm type-check` | `tsc --noEmit`                                       |
| `pnpm knip`       | Find unused files, dependencies, and exports         |
| `pnpm check`      | Run lint + type-check + format check + knip + tests  |
| `pnpm changeset`  | Record a change for the next release                 |

Before opening a pull request, run:

```sh
pnpm check
```

This is the same set of checks CI runs on every push and pull request.

## Coding style

- Formatting is owned by **Prettier** (using [`@sanity/prettier-config`](https://github.com/sanity-io/prettier-config)).
  Don't hand-format — run `pnpm format`.
- Linting uses [`@sanity/eslint-config-studio`](https://github.com/sanity-io/eslint-config-studio).
- Keep the public API surface small and documented with JSDoc; everything
  exported from `src/index.ts` is part of the package's contract.
- Add or update tests in `src/__tests__/` for any behavior change.

## Pull requests

1. Fork and create a topic branch from `main`.
2. Make your change, with tests.
3. Ensure `pnpm check` passes.
4. Run `pnpm changeset` for any user-facing change and commit the generated file
   under `.changeset/` (don't edit `CHANGELOG.md` by hand — Changesets owns it).
5. Open a pull request describing the change and the motivation. Reference any
   related issue.

## Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets)
and the **Release** GitHub Action — maintainers don't run `npm publish` by hand.

1. Every PR with a user-facing change includes a changeset (`pnpm changeset`),
   committed under `.changeset/`.
2. When changesets land on `main`, the action opens a **"Version Packages"** PR
   that bumps the version and updates `CHANGELOG.md`.
3. Merging that PR builds the package and publishes it to npm (with provenance),
   then pushes the git tag.

One-time repo setup: add an `NPM_TOKEN` repository secret (an npm automation
token with publish rights) for the Release workflow.

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
