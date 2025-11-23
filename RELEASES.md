# Release Management

This project uses [Conventional Commits](https://www.conventionalcommits.org/), [Release Please](https://github.com/googleapis/release-please), and GitHub Actions to automate versions, changelog generation, and releases.

## How Releases Work

### 1. Conventional Commits Drive Automation

All commits and PR titles must follow conventional commit format:

```
<type>(<scope>): <description>
```

**Version Bumps**:
- `feat:` → Minor version bump (0.1.0 → 0.2.0)
- `fix:` → Patch version bump (0.1.0 → 0.1.1)
- `BREAKING CHANGE:` or `feat!:` → Major version bump (0.1.0 → 1.0.0)
- `chore:`, `docs:`, `test:`, etc. → No version bump (included in next release)

### 2. Release Please Creates Release PRs

When commits are pushed to `main`, Release Please:
- Analyzes commits since the last release
- Determines the next version based on commit types
- Creates or updates a **Release PR** (e.g., `chore: release mcp-playwright 0.2.0`) with:
  - Updated `CHANGELOG.md` with categorized changes
  - Bumped version in `package.json`
  - Tag proposal (e.g., `v0.2.0`)

### 3. Merging the Release PR

When the Release PR is merged:
- A **draft GitHub Release** is created (NOT auto-published)
- A Git tag is created (e.g., `v0.2.0`)
- `CHANGELOG.md` is committed to the repository
- Docker build workflow is triggered (if configured)

### 4. Publishing the Release

**Important**: Releases are created as **drafts** and require manual publishing:

1. Go to [GitHub Releases](https://github.com/executeautomation/mcp-playwright/releases)
2. Find the draft release created by Release Please
3. Review the release notes
4. Add any additional context or migration notes if needed
5. Click **"Publish release"** when ready

This ensures you have full control over when releases go live.

## Changelog Categories

Changes are automatically grouped with emojis based on commit type:

- 🚀 **Features** - `feat:` commits
- 🐛 **Bug Fixes** - `fix:` commits
- ⚡ **Performance Improvements** - `perf:` commits
- ⏪ **Reverts** - `revert:` commits
- 📚 **Documentation** - `docs:` commits
- 💎 **Styles** - `style:` commits
- 🛠 **Miscellaneous Chores** - `chore:` commits
- ♻️ **Code Refactoring** - `refactor:` commits
- 🧪 **Tests** - `test:` commits
- 📦 **Build System** - `build:` commits
- 🔧 **Continuous Integration** - `ci:` commits

## Contributor Guidelines

### Writing Commits

Use conventional commit format for all commits:

```bash
# Good examples
feat: add browser navigation tool
feat(api): add support for custom headers
fix: resolve timeout in screenshot capture
fix(upload): handle large files correctly
docs: update installation instructions
test: add integration tests for browser tools

# Breaking changes
feat!: change API response format
# OR
feat: change API response format

BREAKING CHANGE: The API now returns JSON instead of XML
```

### Pull Request Titles

PR titles must also follow conventional commit format:

```
feat: add new browser automation features
fix: resolve navigation timeout issues
docs: update API documentation
```

CI will validate commit messages and PR titles using commitlint.

## Admin Notes for Release PRs

### Reviewing Release PRs

Before merging a Release Please PR:
- ✅ Verify the version bump is appropriate (major/minor/patch)
- ✅ Review the CHANGELOG.md updates
- ✅ Check that all changes since last release are included
- ✅ Ensure categorization is correct
- ✅ Edit the release PR description if needed

### Adjusting Releases

If you need to modify the release:
- Edit the CHANGELOG.md in the Release PR
- Adjust the version number if needed
- Update the PR title to match the new version
- Commit changes directly to the release PR branch

### After Merging

Once the Release PR is merged:
1. A draft release is automatically created
2. Review the draft on GitHub Releases page
3. Add any additional release notes or migration guides
4. Publish the release manually when ready
5. Docker images will be built and tagged automatically (if applicable)

### Emergency/Manual Releases

If you need to create a release manually:

1. Update version in `package.json`
2. Update `CHANGELOG.md` with changes
3. Commit: `chore: release v0.2.0`
4. Push to `main`
5. Manually create GitHub Release with the tag
6. Update `.release-please-manifest.json` with new version

## Configuration Files

- **`release-please-config.json`** - Main configuration with changelog sections and versioning strategy
- **`.release-please-manifest.json`** - Tracks current version (updated by Release Please)
- **`.github/workflows/release-please.yml`** - GitHub Actions workflow

## CI/CD Integration

- **Build workflow** (`build.yml`) runs on all pushes and validates commits
- **Release Please workflow** (`release-please.yml`) runs on pushes to `main`
- **Docker workflow** (if configured) builds images when releases are published

## Best Practices

✅ **Always use conventional commits** - Enables automatic versioning
✅ **Keep commits atomic** - One logical change per commit
✅ **Write descriptive commit bodies** - Explain the "why" not just the "what"
✅ **Review Release PRs carefully** - They determine what users see
✅ **Test before publishing** - Drafts give you time to verify everything works
✅ **Update docs with features** - Keep documentation in sync with releases

---

For more details on contributing and commit format, see [CONTRIBUTING.md](CONTRIBUTING.md).
