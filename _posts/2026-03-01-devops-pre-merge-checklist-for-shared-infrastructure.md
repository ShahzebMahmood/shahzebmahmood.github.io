---
layout: post
title: "DevOps Pre-Merge Checklist for Shared Infrastructure"
description: "The practical checklist I run before merging Terraform and platform deployment changes that can hit multiple environments."
date: 2026-03-01 09:00:00 -0500
categories: [DevOps, Terraform]
tags: [devops, terraform, infrastructure, ci-cd, reliability, change-management]
pin: false
---

I used to look at small Terraform PRs and think, "this is tiny, it will be fine." A few incidents taught me that tiny infrastructure changes can still cause big headaches when a module is shared across environments.

Now I run the same pre-merge routine every time. It is not fancy, but it has saved me more than once.

## First thing I check

Before I even read the full diff, I check where that code is used. If the change touches a shared module, I assume `dev`, `staging`, and `prod` are all in play until I prove otherwise.

I ask myself three quick questions:

- Is this path reused across environments?
- Is this changing IAM, networking, secrets, or deployment behavior?
- Is this likely to create drift or hidden side effects?

If I cannot answer those quickly, I stop and map dependencies first.

## Terraform checks I always run

I do this before long PR discussions so we are not debating a change that fails basic validation.

```bash
terraform fmt -recursive
terraform validate
terraform plan -out tfplan
terraform show -no-color tfplan > tfplan.txt
```

If it is a shared module, I run plans from each relevant environment folder. Running one plan and assuming the rest are fine is how surprises happen.

## What I check in the PR itself

I look for open PRs that touch the same area and I check if this PR depends on anything still unmerged. I do not like hidden dependencies between repos because they are hard to debug later.

I also do a fast security pass. I am mainly looking for wildcard permissions, long-lived credentials, and anything accidentally exposed to the public internet. That quick pass catches real problems.

## Rollback and monitoring

If a PR does not have a clear rollback note, I treat that as not ready. I want to know exactly what gets reverted and how I verify recovery.

Then I check observability. If I cannot see health checks, error rate, and latency after rollout, we are basically deploying blind.

## Why I stick to this

This routine actually speeds things up because review comments are cleaner and plans are less noisy. Most importantly, merges feel predictable.

For infrastructure, boring is good. I want boring merges and quiet deploys.

## Related Posts

- [How to Purge Cloudflare Cache When Your CDN Serves Stale Files](/posts/how-to-purge-cloudflare-cache-when-your-cdn-serves-stale-files/)
- [CI/CD Pipelines for Harbor to ECR Migration and Terraform Plan](/posts/creating-ci-cd-pipelines-that-scale/)
- [Terraform Modules: How I Built Reusable Azure and GCP Building Blocks](/posts/terraform-azure-gcp-modules-my-approach/)
