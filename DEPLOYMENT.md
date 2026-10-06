# Deploying Soot & Seed

## Canonical production route

**Source repository**
<https://github.com/Djulz/soot-and-seed>

**Public site**
<https://djulz.github.io/soot-and-seed/>

Verified through the successful GitHub Pages deployment. Use the deployment
URL reported by GitHub as the final verification source.

> **Repository visibility:** This repository is intentionally public because
> GitHub Pages is not available for a private repository on the current GitHub
> plan. Keep it public for this deployment route, or move to an eligible
> Enterprise plan before making it private again.

## Normal release flow

1. Work from the current project source. The static production entry point is
   `index.html` at the repository root.
2. Validate the static page locally:

   ```sh
   git diff --check
   node --check <extracted inline script>
   ```

3. Commit the intended source changes.
4. Push the normal production branch (`main`) to GitHub.
5. The `Deploy Soot & Seed to GitHub Pages` workflow stages the root
   `index.html` and publishes it with the official GitHub Pages actions.
6. Verify the published URL, main menu, puzzle select, gameplay entry, and
   browser-local campaign progress on the deployed origin.

The game is a self-contained client-side HTML/CSS/JavaScript application. It
uses `localStorage`; no backend, database, or build server is required.

## GitHub Pages setup

In **Settings → Pages**, the source is set to **GitHub Actions**. The committed
workflow at `.github/workflows/pages.yml` deploys every push to `main`.

## Historical ChatGPT Sites note

ChatGPT Sites publishing may fail with:

```
Failed to connect to browser-proxy port 8889
```

This is deployment infrastructure failure. It must not trigger changes to
otherwise working Soot & Seed gameplay code. ChatGPT Sites can remain an
optional secondary deployment route later; GitHub Pages is the canonical
production path.

## Workspace hygiene

`grid-puzzle-autofire.tar.gz` is a user artifact. Preserve it locally and do
not stage it in new commits.
