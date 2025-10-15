---
layout: post
title: "GitHub Actions Security Hardening — What I Actually Use"
date: 2025-10-07 12:00:00 -0500
categories: [DevOps, Security]
tags: [github-actions, oidc, ci-cd, security, least-privilege]
pin: false
---

# GitHub Actions Security Hardening — What I Actually Use

I tightened my pipelines without slowing anyone down. This is the short list that stuck for me across personal projects and DevOps work.

## What I Secured First
- OIDC to AWS/Azure/GCP (no long‑lived keys), least‑privilege roles
- Required reviews on workflow changes and branch protection on `main`
- Dependency + secret scanning on every PR

## Reusable Workflows That Helped
- `lint-test-build.yml` that app repos call with `workflow_call`
- `plan.yml` for IaC PRs; `apply.yml` on `main` with manual approval

```yaml
# .github/workflows/lint-test-build.yml (snippet)
permissions:
  contents: read
  id-token: write
on:
  workflow_call:
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm i && pnpm lint && pnpm test && pnpm build
```

## OIDC Role Examples (conceptual)
- AWS: role trust on `token.actions.githubusercontent.com` with conditions like `repo:owner/name` and `ref:refs/heads/main`
- Azure/GCP: workload identity bindings with minimal scopes and short session lifetimes

```yaml
# Example: minimal permissions in a job
permissions:
  id-token: write
  contents: read
```

## What Broke (and How I Fixed It)
- Token audience mismatch → set `audience` explicitly on the cloud side
- Excess default permissions → trim `permissions:` per job instead of repo‑wide
- Secret sprawl → moved to OIDC + per‑env roles; kept only non‑cloud secrets in store

## My Take
I think CI/CD can be good, but it comes with a lot of troubleshooting. I cannot tell you the amount of debugging I had to do 😅


