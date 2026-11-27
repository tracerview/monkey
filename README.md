# Composite Domain Part (TEMPLATE:DOMAIN/PART)

This is a composite domain part that belongs to a [composite domain](https://github.com/ctracey/composite-domain).

- This repo handles config and deploy of the part content to a registered Cloudflare Worker.
- The composite domain central repo is responsible for the domain, registering the part, and routing domain traffic to the part.

## 1. Getting Started

- Create repo for your part from this GitHub template
- **Dependency:** [Composite domain](https://github.com/ctracey/composite-domain) exists for the parent domain
- Setup dev env — [Operations Guide > Dev Env > Setup](docs/operations.md#11-setup)
- Follow [Composite Domain Part Lifecycle](docs/lifecycle.md) (tailor, author, register, publish)
- [Register this part](https://github.com/ctracey/composite-domain/blob/main/docs/composite-domain-usage-guide.md#5-register-composite-domain-part) with the parent [composite domain](https://github.com/ctracey/composite-domain) so that domain traffic can be routed to this part's Cloudflare Worker

## 2. Docs

- [Composite Domain Part Lifecycle](docs/lifecycle.md) — composite domain part pattern and workflow
- [Operations Guide](docs/operations.md) — dev env, pipeline, and manual operations
