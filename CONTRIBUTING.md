# Contributing

Thanks for your interest in contributing! Please follow the standards below to keep the project healthy.

## 1. Setup pre-commit hooks

After installing dependencies (`npm ci`), run:

```bash
npm run prepare
```

This installs the Husky pre-commit hook that runs lint, tests, and build before each commit.

## 2. Use Conventional Commits (PR Titles Too)

All commits **and PR titles** must follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add streamable HTTP docs`, `fix: upload endpoint boundary error`). CI enforces this to keep auto-changelog and release automation working (release-please reads commit/PR metadata to version and update the changelog).

## 3. Update docs for user-facing changes

If you add or modify functionality that affects users (new tools, flags, features), update the relevant documentation in `README.md` and/or `docs/`. Documentation must stay in sync with the behavior.

## 4. Lint and run pre-commit hooks

Before pushing, ensure:

```bash
npm run lint
npm test
npm run build
```

The Husky hook enforces this on commits, but double-check locally to avoid CI failures.

---

By contributing, you agree to follow these standards. We appreciate your help!
