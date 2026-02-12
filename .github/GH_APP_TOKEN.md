# GitHub App Token Setup

The `prepare-release.yaml` workflow requires a GitHub App token stored as a repository secret named `GH_APP_TOKEN`.

## Why GitHub App Token?

GitHub's default `GITHUB_TOKEN` has a security limitation: actions performed with it (like pushing commits or tags) **do not trigger other workflows**. This prevents infinite workflow loops but also means our `prepare-release` workflow cannot automatically trigger the `release` workflow when it pushes a tag.

Using a GitHub App token bypasses this limitation because the app is a separate identity from GitHub Actions.

## Setup

1. **GitHub App**: Ensure your GitHub App is installed on this repository with the following permissions:
   - Repository permissions:
     - Contents: Read and write
     - Metadata: Read-only

2. **Generate Token**: Your GitHub App should generate installation access tokens

3. **Add Secret**: Store the token as a repository secret:
   - Go to: Settings → Secrets and variables → Actions
   - Name: `GH_APP_TOKEN`
   - Value: Your GitHub App installation token

## Alternative: Personal Access Token (PAT)

If you don't have a GitHub App, you can use a classic PAT with `repo` scope:
- Create PAT at: Settings → Developer settings → Personal access tokens → Tokens (classic)
- Scope required: `repo`
- Store as `GH_APP_TOKEN` secret

**Note**: PATs are tied to your user account; GitHub Apps are preferred for organizational use.

## Validation

After setup, the `prepare-release` workflow will automatically trigger the `release` workflow when it pushes a tag. You should see both workflows run in sequence without manual intervention.
