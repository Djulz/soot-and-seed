# Deploying Soot & Seed

## Canonical production route

**Source repository**
<https://github.com/Djulz/soot-and-seed>

**Expected public site**
<https://djulz.github.io/soot-and-seed/>

The public URL becomes live after the first successful GitHub Pages workflow.
Use the deployment URL reported by GitHub as the final verification source.

> **Private repository requirement:** On the current GitHub account, GitHub
> Pages cannot be enabled while this repository is private. GitHub's Pages
> settings require either a public repository or a GitHub Enterprise plan for
> privately published Pages. Keep the repository private only after Pages has
> been enabled through an eligible Enterprise plan; otherwise publish from a
> public repository or choose another hosting provider.

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

After the repository is eligible for GitHub Pages, in **Settings → Pages**,
set the source to **GitHub Actions**. The committed workflow at
`.github/workflows/pages.yml` then deploys every push to `main`.

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
