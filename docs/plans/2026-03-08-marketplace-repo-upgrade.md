# FDA Data MCP Marketplace Repo Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the public MCP setup repo into a marketplace-ready GitHub repo for the hosted FDA Data MCP product, without open-sourcing the private backend.

**Architecture:** Keep the repo public and lightweight, but make it feel like a first-class MCP product. The repo should become the GitHub-facing install and discovery layer, while the live hosted endpoint at `https://www.regdatalab.com/mcp` remains the canonical backend. Use a single source of truth for setup copy to prevent GitHub Pages drift.

**Tech Stack:** Markdown, static HTML, GitHub Pages, npm package metadata, optional Node wrapper, GitHub Actions, MCP marketplace metadata files.

---

## Context

Current repo state:

- Files: `README.md`, `index.html`
- GitHub Pages is enabled from `/`
- No license
- No releases
- No MCP marketplace metadata files
- Repo name is `fda-data-docs`, which undersells the product
- Current Pages content is stale relative to the live product positioning and auth flow

Target repo shape:

- repo renamed to something like `fda-data-mcp`
- strong README above the fold
- trustworthy legal/support basics
- machine-readable MCP marketplace files
- no stale duplicate setup site
- thin installable wrapper added only after trust and docs are fixed

## Task 1: Rename and Reposition the Repo

**Files:**
- Modify: GitHub repo settings
- Verify: `README.md`

**Step 1: Rename the repository**

Rename:

- From: `medley/fda-data-docs`
- To: `medley/fda-data-mcp` (recommended)

Command:

```bash
gh repo rename fda-data-mcp --repo medley/fda-data-docs
```

**Step 2: Update repo metadata**

Set:

- description to clearly describe the hosted MCP product
- homepage to canonical setup docs
- topics to include `mcp`, `model-context-protocol`, `fda`, `ai-agents`, `cursor`, `claude-code`

Command:

```bash
gh repo edit medley/fda-data-mcp \
  --description "Hosted MCP server for FDA regulatory, manufacturing, and compliance intelligence." \
  --homepage "https://www.regdatalab.com/connect.md" \
  --add-topic mcp --add-topic model-context-protocol --add-topic fda --add-topic ai-agents --add-topic cursor --add-topic claude-code
```

**Step 3: Verify rename + metadata**

Run:

```bash
gh repo view medley/fda-data-mcp --web
```

Expected:

- new repo name visible
- updated description visible
- homepage visible

**Step 4: Commit**

No git commit needed if only GitHub settings changed.

## Task 2: Add Trust-Building Repo Basics

**Files:**
- Create: `LICENSE`
- Create: `SECURITY.md`
- Create: `SUPPORT.md`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Modify: `README.md`

**Step 1: Add license**

Use a simple permissive license for the public wrapper/docs repo.

Recommended:

- `MIT`

**Step 2: Add security policy**

`SECURITY.md` should explain:

- do not open public issues for secret leakage
- use email for security reports
- expected response window

**Step 3: Add support file**

`SUPPORT.md` should explain:

- where to get help
- where canonical docs live
- where billing/signup questions go

**Step 4: Add issue template config**

Disable blank issues unless you want them, and point users to support/docs first.

**Step 5: Run basic verification**

Run:

```bash
git diff --stat
```

Expected:

- only the new trust/support files and README changes appear

**Step 6: Commit**

```bash
git add LICENSE SECURITY.md SUPPORT.md .github/ISSUE_TEMPLATE/config.yml README.md
git commit -m "chore: add GitHub trust and support basics"
```

## Task 3: Rewrite README as a Product Landing Page

**Files:**
- Modify: `README.md`

**Step 1: Replace the current README structure**

New README structure:

1. product headline
2. one-paragraph explanation
3. instant install section
4. supported clients
5. example prompts
6. what data is covered
7. auth / pricing basics
8. canonical docs / support links

**Step 2: Add a strong above-the-fold section**

It should answer in 10 seconds:

- what this is
- why it matters
- how to install it

**Step 3: Add client-specific setup**

Cover:

- Claude Code
- Claude Desktop
- Cursor
- VS Code
- OpenAI / generic MCP clients

**Step 4: Add example prompts**

Use high-value prompts such as:

- manufacturing risk summary for a company
- recent VAI / OAI inspections
- warning letters / enforcement / recalls

**Step 5: Add clear hosted-product language**

Make it explicit:

- this is a hosted MCP
- the backend stays private
- the public repo is the install/discovery layer

**Step 6: Verify**

Run:

```bash
sed -n '1,220p' README.md
```

Expected:

- strong headline
- install visible without scrolling too far
- no outdated pricing/tool-count claims

**Step 7: Commit**

```bash
git add README.md
git commit -m "docs: turn README into marketplace landing page"
```

## Task 4: Eliminate GitHub Pages Drift

**Files:**
- Modify: `index.html`
- Optional Create: `.github/workflows/pages-sync.yml`

**Step 1: Choose the simplest safe strategy**

Recommended:

- keep GitHub Pages
- turn `index.html` into a minimal redirect/landing page
- do not maintain a second full pricing/setup page here

**Step 2: Remove stale product specifics**

Delete or avoid:

- hardcoded pricing tiers
- hardcoded tool counts
- old signup wording

**Step 3: Point users to canonical live docs**

The GitHub Pages page should send users to:

- `https://www.regdatalab.com/connect.md`
- `https://www.regdatalab.com/docs`
- `https://www.regdatalab.com/pricing`

**Step 4: Verify**

Run:

```bash
python3 -m http.server 8000
```

Expected:

- page loads locally
- no stale pricing/tool language remains

**Step 5: Commit**

```bash
git add index.html
git commit -m "fix: make GitHub Pages a canonical redirect landing page"
```

## Task 5: Add MCP Marketplace Metadata

**Files:**
- Create: `server.json`
- Create: `smithery.yaml`
- Create: `glama.json`

**Step 1: Add `server.json`**

Include:

- product name
- description
- auth expectations
- endpoint
- client-compatible metadata

**Step 2: Add `smithery.yaml`**

Use Smithery-compatible metadata for hosted install/discovery.

**Step 3: Add `glama.json`**

Use Glama-compatible metadata.

**Step 4: Verify**

Run:

```bash
cat server.json
cat smithery.yaml
cat glama.json
```

Expected:

- values match live endpoint and auth pattern
- no stale Heroku URLs

**Step 5: Commit**

```bash
git add server.json smithery.yaml glama.json
git commit -m "feat: add MCP marketplace metadata"
```

## Task 6: Add a Thin Installable Wrapper

**Files:**
- Create: `package.json`
- Create: `bin/fda-data-mcp.js`
- Create: `.gitignore`
- Optional Create: `Dockerfile`

**Step 1: Reuse an existing pattern**

Do not build custom transport logic first. Prefer the existing `mcp-remote` pattern unless there is a clear reason not to.

**Step 2: Define wrapper behavior**

Wrapper should:

- read `FDA_DATA_API_KEY`
- connect to hosted endpoint
- expose a simple install/run story for MCP clients

**Step 3: Add npm metadata**

Package metadata should support:

- `npx`
- repo discoverability
- versioning

**Step 4: Add wrapper entrypoint**

Thin launcher only. No private business logic here.

**Step 5: Verify**

Run:

```bash
npm pack
```

Expected:

- package builds cleanly
- wrapper files are included

**Step 6: Commit**

```bash
git add package.json bin/fda-data-mcp.js .gitignore Dockerfile
git commit -m "feat: add thin hosted MCP wrapper"
```

## Task 7: Add GitHub-Native Install Surfaces

**Files:**
- Modify: `README.md`

**Step 1: Add one-click/deeplink installs where supported**

Add:

- Cursor deeplink
- VS Code MCP install link
- copy/paste config blocks

**Step 2: Add badges**

Recommended:

- website
- GitHub Pages
- npm version (once published)
- Smithery badge if applicable

**Step 3: Add visual proof**

Add at least one:

- screenshot
- short GIF
- architecture diagram

**Step 4: Verify**

Run:

```bash
sed -n '1,260p' README.md
```

Expected:

- install surfaces are visible
- repo feels comparable to other MCP product repos

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add GitHub-native install surfaces"
```

## Task 8: Add Release and Maintenance Signals

**Files:**
- Create: `.github/workflows/ci.yml`
- Optional Create: `CHANGELOG.md`

**Step 1: Add a lightweight CI workflow**

CI should:

- validate links if practical
- validate JSON/YAML syntax
- fail if obvious metadata files are broken

**Step 2: Start using releases**

Create a `v0.1.0` release after the repo is upgraded enough to feel coherent.

**Step 3: Verify**

Run:

```bash
gh workflow list
```

Expected:

- CI visible alongside Pages workflow

**Step 4: Commit**

```bash
git add .github/workflows/ci.yml CHANGELOG.md
git commit -m "chore: add maintenance and release signals"
```

## Definition of Done

The upgrade is complete when:

- repo name matches the product
- README is strong enough to act as the landing page
- GitHub Pages is no longer stale
- license/support/security files exist
- machine-readable MCP metadata exists
- install path works cleanly for hosted usage
- releases and maintenance signals are visible

## Notes for Execution

- Do not open-source private backend logic.
- Do not duplicate long-lived docs in both GitHub Pages and the main site.
- Prefer one source of truth for setup/install copy.
- Prefer small commits per task.
- Validate every external URL before merging.

