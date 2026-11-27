# Composite Domain Part Lifecycle

1. [The Composite Domain Part Pattern](#1-the-composite-domain-part-pattern)
2. [Tailoring the Composite Domain Part](#2-tailoring-the-composite-domain-part)
3. [Authoring the Part's Content](#3-authoring-the-parts-content)
4. [Making it a First-Class Composite Member](#4-making-it-a-first-class-composite-member)
5. [Publishing the Part](#5-publishing-the-part)
6. [Registering the Part](#6-registering-the-part)

## 1. The Composite Domain Part Pattern

_You have content that belongs under a shared domain. This is how you make it a part of it._

A composite domain is made up of parts — each part is a piece of content that lives at a specific path and is a registered member of the whole. This repo is the pattern for creating and publishing one.

Each part owns a subpath under `dist/`. The build places content there and generates the artefacts that make it a registered member of the composite.

```
dist/
  index.html                    ← nav page: makes the part discoverable
  <CDP_TARGET_PATH>/
    index.html                  ← part content (built from src/)
    _meta.json                  ← part spec: identity, git SHA, build timestamp
```

## 2. Tailoring the Composite Domain Part

_Before anything else, your part needs a name and a home in the composite._

Set these once in `.cdp` — they drive everything the composite knows about your part and where the build puts it.

| Var | What it represents |
|---|---|
| `CDP_LOGICAL_NAME` | Who your part is — its name within the composite |
| `CDP_TARGET_PATH` | Where your part lives — its path in the distribution (defaults to `CDP_LOGICAL_NAME`) |

Separating identity from placement means you can deploy to a different path without changing who the part is. `DIST_DEST` is derived from `CDP_TARGET_PATH` and used throughout the build.

## 3. Authoring the Part's Content

_The content you author in `src/` is what gets published — it's what the part delivers._

The content lives in `src/`. Vite builds it into `dist/<CDP_TARGET_PATH>/` — that's what lands on the domain at `domain.com/<CDP_TARGET_PATH>`.

## 4. Making it a First-Class Composite Member

_Content alone isn't enough — the part needs to declare itself and be discoverable within the composite._

> **NOTE:** This is fully automated via the build — no manual steps required.

The build generates two artefacts from templates that make the part a first-class member of the composite:

| Artefact | Template | Purpose |
|---|---|---|
| `dist/<CDP_TARGET_PATH>/_meta.json` | `templates/cdp-meta/_meta.json` | Declares the part — name, git SHA, build timestamp |
| `dist/index.html` | `templates/cdp-nav/index.html` | Makes the part discoverable — links consumers to the content |

Templates use `${key}` placeholders substituted at build time:

| Template | Placeholders |
|---|---|
| `cdp-meta/_meta.json` | `${cdpLogicalName}`, `${version}`, `${date}` |
| `cdp-nav/index.html` | `${cdpLogicalName}`, `${distDest}` |

## 5. Publishing the Part

_When you're ready, publishing happens via the GitHub workflow — it uses Vite (via npm) to prepare the distribution artefact and deploys it to Cloudflare._

### 5.1 Build and Test Locally

Run the build locally to verify before deploying:

```sh
npm run build
```

This cleans, builds, stamps, and generates the nav — your part is ready at `domain.com/<CDP_TARGET_PATH>`.

The build runs four steps in sequence:

1. **Clean** — wipes `dist/` to ensure a fresh distribution
2. **Build** — Vite builds `src/` into `dist/<CDP_TARGET_PATH>/`
3. **Spec** — renders `_meta.json` stamped with the current git SHA and timestamp
4. **Nav** — renders `dist/index.html` linking consumers to the content

### 5.2 Pre-deploy _(dev machine)_

> **Dependency:** Requires cfops set up on the local machine — see [Operations Guide](operations.md).

Uses cfops to create the Cloudflare wrangler config for this part — run once per new part instance on the dev machine, not the pipeline.

```sh
npm run pre-deploy
```

### 5.3 Deploy

> **Dependencies:**
> - Relies on the wrangler config created in 5.2.
> - Requires Cloudflare tokens set as GitHub Actions secrets — see [Operations Guide > GitHub Workflow Setup](operations.md#21-github-workflow-setup).

Pushing to `main` triggers the pipeline. The pipeline applies the wrangler config to deploy `dist/` to the Cloudflare Worker.

The output subpath maps directly to the domain route — `dist/<CDP_TARGET_PATH>/index.html` is served at `domain.com/<CDP_TARGET_PATH>`. No path rewriting needed.

`dist/index.html` serves as the composite nav page for this part, displaying the part spec and linking to the content at `./<CDP_TARGET_PATH>/index.html`.

The part will be live at:

```
https://<DOMAIN>/<CDP_TARGET_PATH>
```

## 6. Registering the Part

_Once published, register the part with the parent composite domain so traffic can be routed to its Cloudflare Worker._

Follow the [composite domain usage guide](https://github.com/ctracey/composite-domain/blob/main/docs/composite-domain-usage-guide.md#5-register-composite-domain-part) to complete registration.

> **Note:** This only needs to be done once when the Worker is first created, or again if `CDP_TARGET_PATH` changes.

