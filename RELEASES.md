# Release Management

This project uses conventional commits, release-please, and CI to automate versions, changelog entries, and Docker image tagging. Keep commit and PR titles conventional so automation can do its job.

## How releases work
- **Conventional commits** (and PR titles) drive version bumps: `feat` → minor, `fix`/`chore` → patch, `BREAKING CHANGE` → major.
- **Release-please** runs on `main` and opens a release PR (e.g., `release-please--branches--main`) with:
  - Updated `CHANGELOG.md`
  - Bumped versions in `package.json`/lockfile
  - A tag proposal (e.g., `v0.1.0`)
- **Merging the release PR**:
  - Creates the Git tag and GitHub Release.
  - Triggers the Docker workflow to build and push images with semver tags (and `latest` when applicable).

## Contributor guidelines
- Use conventional commit messages and PR titles.
- Keep user-facing changes documented so release notes are accurate.
- CI will fail on non-conventional commit/PR titles.

## Admin notes for release PRs
- Release PRs are opened by release-please on `main`.
- You can edit the release PR description and changelog entries before merging.
- If you need a different version, adjust the release PR (e.g., change the version bump) before merge.
- Once merged, tags and releases are created automatically; Docker images are pushed with the new version.
