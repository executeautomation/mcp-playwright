# Contributing

Thanks for your interest in contributing! Please follow the standards below to keep the project healthy.

## 1. Setup pre-commit hooks

After installing dependencies (`npm ci`), run:

```bash
npm run prepare
```

This installs the Husky pre-commit hook that runs lint, tests, and build before each commit.

## 2. Use Conventional Commits

All commits **and PR titles** must follow [Conventional Commits](https://www.conventionalcommits.org/) format. This is critical because the project uses [Release Please](https://github.com/googleapis/release-please) to:
- Automatically version releases
- Generate CHANGELOG.md
- Categorize changes in release notes

### Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types

Choose the appropriate type for your changes:

- `feat:` - A new feature (bumps minor version: 0.1.0 → 0.2.0)
- `fix:` - A bug fix (bumps patch version: 0.1.0 → 0.1.1)
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `perf:` - Performance improvement
- `test:` - Adding or updating tests
- `build:` - Changes to build system or dependencies
- `ci:` - Changes to CI configuration files and scripts
- `chore:` - Other changes that don't modify src or test files
- `revert:` - Reverts a previous commit

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the commit footer or add `!` after the type:

```bash
feat!: change API response format

BREAKING CHANGE: The API now returns JSON instead of XML
```

This will bump the major version (0.1.0 → 1.0.0).

### Examples

```bash
# Feature commit
feat: add support for multiple browser tabs
feat(navigation): add go back and forward tools

# Bug fix commit
fix: resolve screenshot timeout issue
fix(upload): handle large file uploads correctly

# Documentation commit
docs: update installation instructions
docs(api): add examples for HTTP tools

# Test commit
test: add integration tests for browser tools
```

### Why This Matters

The commit format directly affects:
- **Version numbering** - `feat` vs `fix` vs `BREAKING CHANGE`
- **CHANGELOG categories** - Each type appears in a different section
- **Release notes** - Your changes are automatically categorized with emojis:
  - 🚀 Features
  - 🐛 Bug Fixes
  - 📚 Documentation
  - 🧪 Tests
  - And more...

**Important**: CI validates commit messages using commitlint, so improperly formatted commits will fail the build.

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

## 5. Pull Request Guidelines

- Ensure all tests pass and lint checks succeed
- Add tests for new functionality
- Update documentation for user-facing changes
- Keep commits atomic and well-described
- Reference related issues in your PR description
- Use conventional commit format for PR titles

---

## For Maintainers: Release Process

This section is for project maintainers who manage releases.

### Automated Release Workflow

The project uses **Release Please** to automate the release process:

1. **Release Please monitors commits** to the `main` branch
2. **Creates/updates a Release PR** with:
   - Version bump in `package.json` (following semantic versioning)
   - Updated `CHANGELOG.md` with categorized changes
   - All unreleased commits grouped by type
3. **When the Release PR is merged**:
   - A **draft GitHub Release** is created (not auto-published)
   - Version tag is created (e.g., `v0.2.0`)
   - CHANGELOG.md is committed to the repository

### Publishing a Release

After merging the Release Please PR:

1. Go to [GitHub Releases](https://github.com/executeautomation/mcp-playwright/releases)
2. Find the draft release created by Release Please
3. Review the release notes:
   - Verify all changes are categorized correctly
   - Check that the version number is appropriate
   - Add any additional context or migration notes if needed
4. Click **"Publish release"** when ready
5. The release will be published and users will be notified

### Release Categories

Changes are automatically grouped with emojis based on commit type:

- 🚀 **Features** (`feat:`) - New features or enhancements
- 🐛 **Bug Fixes** (`fix:`) - Bug fixes
- ⚡ **Performance Improvements** (`perf:`) - Performance optimizations
- 📚 **Documentation** (`docs:`) - Documentation updates
- 🧪 **Tests** (`test:`) - Test additions or updates
- ♻️ **Code Refactoring** (`refactor:`) - Code restructuring
- 🛠 **Miscellaneous Chores** (`chore:`) - Maintenance tasks
- 📦 **Build System** (`build:`) - Build configuration changes
- 🔧 **Continuous Integration** (`ci:`) - CI/CD updates

### Version Bumping Strategy

Release Please determines version bumps based on commit types:

- **Major** (1.0.0 → 2.0.0): Commits with `BREAKING CHANGE:` in footer or `!` after type
- **Minor** (1.0.0 → 1.1.0): Commits with `feat:` type
- **Patch** (1.0.0 → 1.0.1): Commits with `fix:` type
- **No bump**: Other commit types (included in next feature/fix release)

### Configuration Files

- `release-please-config.json` - Release Please configuration
- `.release-please-manifest.json` - Tracks current version
- `.github/workflows/release-please.yml` - GitHub Actions workflow

### Manual Release (Emergency)

If you need to create a release manually:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit: `chore: release v0.2.0`
4. Push to main
5. Manually create a GitHub Release with the tag
6. Update `.release-please-manifest.json` with the new version

---

By contributing, you agree to follow these standards. We appreciate your help!
