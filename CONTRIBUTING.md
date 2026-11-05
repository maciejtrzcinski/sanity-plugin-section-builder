# Contributing

Thanks for your interest in improving `sanity-plugin-section-builder`! This guide
covers everything you need to get a change merged.

## Prerequisites

- **Node.js 22.22+ or 24.11+** for the dev toolchain (the published plugin itself
  supports Node ≥ 20).
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

Before opening a pull request, run:

```sh
pnpm check && pnpm build
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
3. Ensure `pnpm check && pnpm build` pass.
4. Open a pull request describing the change and the motivation. Reference any
   related issue.
5. Give the PR a [Conventional Commits] title: it becomes the squash commit on
   `main`, and that commit decides the next version (see below).

## Commits and releases

Releases are automated with [semantic-release], so **commit messages decide
version numbers**. Use [Conventional Commits] on the subject line:

- `fix: …` → patch release
- `feat: …` → minor release
- `feat!: …`, or a `BREAKING CHANGE:` footer → major release
- `docs: …`, `chore: …`, `ci: …`, `refactor: …`, `test: …` → no release

Every push to `main` runs the **Release** workflow: it re-runs `pnpm check`,
builds, then semantic-release works out whether the new commits warrant a
version, updates `CHANGELOG.md`, commits it as `chore(release): x.y.z`, tags
`vx.y.z` and cuts a GitHub release. The workflow then stages that version on
npm under the `latest` dist-tag. Don't bump `version` in `package.json` or edit
`CHANGELOG.md` yourself. Put `[skip release]` in a commit message to skip the
workflow for that push.

> **Maintainers:** npm uses [staged publishing] here. `NPM_TOKEN` is a
> stage-only granular token: CI can stage a version but not publish it, so
> each release waits on npm until you approve it with 2FA, through
> `npm stage approve <stage-id>` (`npm stage list` shows the ids) or the
> Staged Packages tab on npmjs.com. You can swap the token for a stage-only
> trusted publisher on npmjs.com; the workflow already has `id-token: write`.

[semantic-release]: https://semantic-release.gitbook.io/
[staged publishing]: https://docs.npmjs.com/staged-publishing/
[Conventional Commits]: https://www.conventionalcommits.org/

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
