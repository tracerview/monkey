# Operations Guide

## 1. Dev Env

### 1.1 Setup

#### 1.1.1 Node Version Manager

[nvm](https://nvm.sh) manages Node.js installation and version switching — follow the [install guide](https://github.com/nvm-sh/nvm#installing-and-updating).

This project requires Node.js v22 or later (pinned in `.nvmrc`). Once nvm is installed, activate the correct version:

```sh
nvm install
```

#### 1.1.2 Node Package Manager

[npm](https://www.npmjs.com) is bundled with Node.js — no separate install needed. Install project dependencies:

```sh
npm install
```

#### 1.1.3 Cloudflare Operations CLI Tool

[cfops](https://github.com/ctracey/cfops) is used for pre-deploy activities to help generate the Cloudflare Worker config.

If you have set up the [parent composite domain](https://github.com/ctracey/composite-domain) on this machine you're probably good to go — verify with:

```sh
mise -V
cfops -v
```

Then check that `.envrc` exists in the project root. If it doesn't, and you have already set up composite-domain on this machine, copy it from there:

```sh
cp ../<YOUR_COMPOSITE_DOMAIN_REPO>/.envrc .envrc
direnv allow
```

Then verify you're authenticated:

```sh
cfops -wr whoami
```

Otherwise follow the [cfops getting started guide](https://github.com/ctracey/cfops) to install tools and setup the project.

### 1.2 Build

See [Composite Domain Part Lifecycle](lifecycle.md) for usage context.

Vite packages the content in `src/` for distribution to `dist/`. On each build it:

- Outputs the part content to `dist/${CDP_LOGICAL_NAME}/`
- Generates `dist/${CDP_LOGICAL_NAME}/_meta.json` stamped with the commit SHA and timestamp
- Generates `dist/index.html` linking to the part content

```sh
npm run build
```

### 1.3 Build Pipeline Detail

The build is implemented as a set of Vite plugins in `vite.config.js`:

| Plugin | Hook | What it does |
|---|---|---|
| `cleanDist` | `buildStart` | Wipes `dist/` |
| Vite core | — | Builds `src/` into `dist/<DIST_DEST>/` |
| `generateCdpMeta` | `closeBundle` | Renders and writes `_meta.json` |
| `generateCdpNav` | `closeBundle` | Renders and writes `dist/index.html` |

`renderContent(template, context)` handles placeholder substitution. `generateFile({ templatePath, outPath, context })` is the generic plugin factory both generators use.

## 2. Pipeline

> **Trigger:** `.github/workflows/deploy.yml` on every push to `main`

> **Dependency:** Deploy fails without `wrangler.toml`. Generate it via [lifecycle > pre-deploy](lifecycle.md#52-pre-deploy-dev-machine).

1. **Build** — runs `npm run build`, producing `dist/` stamped with the commit SHA and timestamp
2. **Artifact** — uploads `dist/` as a GitHub Actions artifact named `dist-<sha>` for traceability
3. **Deploy** — runs `wrangler deploy`, pushing `dist/` to the Cloudflare Worker

### 2.1 GitHub Workflow Setup

One-time setup per repository — the pipeline requires Cloudflare credentials stored as GitHub repository secrets before the workflow can deploy.

#### 2.1.1 Create Initial Worker

The CI token is scoped to a specific worker, so the worker must exist before setting up the pipeline. At this point everything is set up except the CI pipeline — manually create the worker with:

```sh
npm run build
cfops worker --deploy
```

> **Note:** At this point the domain route hasn't been configured in composite-domain, but you should see the worker on the Cloudflare dashboard.

#### 2.1.2 Create Cloudflare API Token

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Settings → Account API Tokens → Create Token → Start from scratch**
2. Token name: `Worker provisioning token (<domain>-<logicalname>)` (e.g. `Worker provisioning token (acme-landingpage)`)
3. Add policy: scope **Specified Workers** → `cp-<CDP_LOGICAL_NAME>-<CDO_WORKER_CFOPS_SUFFIX>` (values from [`.cdp`](../.cdp))
   - Permission: Developer Platform > Individual Workers: Edit
4. Add policy: scope **Entire Account**
   - Permission: Account & Billing > Account Settings: Read
5. Set TTL expiration to 1 year from today
6. Click **Continue to summary → Create Token**
7. Copy the token — it is only shown once; store it in a secret manager (e.g. Bitwarden) before adding to GitHub

#### 2.1.3 Required GitHub Secrets

Add both as repository secrets under **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from the Cloudflare dashboard URL: `dash.cloudflare.com/<account_id>/...` |
| `CLOUDFLARE_API_TOKEN` | Token from [Create Cloudflare API Token](#212-create-cloudflare-api-token) |

### 2.2 Pre-deploy _(dev machine)_

> **Dependency:** Requires cfops set up on the local machine — see [Ops Tooling Setup](#31-ops-tooling-setup).

Uses cfops to create `wrangler.toml` for this part — run once per new part instance on the dev machine. The generated `wrangler.toml` is committed to the repo and used by the pipeline.

```sh
npm run pre-deploy
```

> **Note:** `npm run pre-deploy` delegates to `bin/create-worker`, which reads `.cdp` and executes `cfops` to generate the config.

### 2.3 Deploy

`wrangler deploy` uses `wrangler.toml` to identify the target Cloudflare Worker and deploys `dist/` as its static assets.

The output subpath maps directly to the domain route — `dist/<CDP_TARGET_PATH>/index.html` is served at `domain.com/<CDP_TARGET_PATH>`. No path rewriting needed.

`dist/index.html` serves as the composite nav page, displaying the part spec and linking to the content at `./<CDP_TARGET_PATH>/index.html`.

The part will be live at:

```
https://<DOMAIN>/<CDP_TARGET_PATH>
```

## 3. Manual Operations

> **Warning:** Prefer deploying via the pipeline (section 2). Manual deployment bypasses the build artifact and version stamping.

Uses [cfops](https://github.com/ctracey/cfops) to deploy cloudflare worker with wrangler

### 3.1 Ops Tooling Setup

Follow the [cfops install and setup guide](https://github.com/ctracey/cfops).

> **Note:** Do not apply any DNS, routing, zone, or worker config.

### 3.2 Deploy Content as Worker

```sh
cfops worker --create
cfops worker --deploy dist
```

> **Note:** Do not attach a domain to the worker here.

### 3.3 Domain Routing

Domain and worker routing is managed via Terraform in the composite domain central repo. Apply routing config there once the worker is deployed. (TODO: link to central repo)
