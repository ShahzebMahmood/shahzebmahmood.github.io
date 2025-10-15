---
layout: post
title: "Terraform Modules: How I Built Reusable Azure and GCP Building Blocks"
date: 2025-10-08 13:00:00 -0500
categories: [DevOps, Terraform]
tags: [terraform, azure, gcp, modules, iac, best-practices]
pin: false
---

# Terraform Modules: Azure and GCP, My Way

I spent some time last week refactoring IaC into proper Terraform modules for both Azure and GCP. The goal was simple: make it easy to stamp out secure, tagged, and observable infrastructure with as little duplication as possible.

## What I Optimized For
- Predictable inputs/outputs across clouds
- Opinionated defaults (security, tags/labels, naming)
- Clear separation between core infra and environment overlays

## Azure: Resource Group + Network + Storage
I started with a tiny module that creates a resource group, a VNet, and a storage account with private access. It’s the baseline for most of my workloads.

```bash
# repo layout (example)
modules/
  azure-core/
    main.tf
    variables.tf
    outputs.tf
envs/
  dev/
    main.tf
```

Example usage:

```hcl
module "core" {
  source = "../modules/azure-core"

  location            = "eastus"
  resource_group_name = "rg-app-dev"
  vnet_cidr           = ["10.10.0.0/16"]
  tags = {
    owner = "shahzeb"
    env   = "dev"
  }
}
```

What helped: consistent naming via a small locals block and a `required_tags` variable that I pass through to all resources.

## GCP: Project Services + Network + Buckets
On GCP I mirrored the Azure shape: enable APIs, create a VPC with subnets, and a locked‑down bucket with uniform access.

```hcl
module "gcp_core" {
  source = "../modules/gcp-core"

  project_id   = var.project_id
  region       = "us-central1"
  network_cidr = "10.20.0.0/16"
  labels = {
    owner = "shahzeb"
    env   = "dev"
  }
}
```

## Little Things That Made A Big Difference
- A `providers` block inside modules is optional; I pass providers from root for clarity
- `terraform fmt` + `tflint` + `pre-commit` kept everything neat
- Outputs are for consumers, not for me—only expose what callers actually need

## Where I Tripped Up (And How I Fixed It)
- Linting got noisy fast across clouds; provider mismatches and unused variables were my biggest offenders.
- Pre-commit saved me from bad commits. Running fmt/validate/tflint locally surfaced problems earlier than CI.
- Docs helped a bit, but the real fix was reading module source and running tiny repros.

My `.pre-commit-config.yaml` (minimal but effective):

```yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.88.4
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
        args: ["--args=--enable-rule=terraform_deprecated_interpolation"]
```

I keep it strict enough to catch drift, but not so strict that it blocks flow.

## Testing The Modules Quickly
I use tiny `envs/dev/main.tf` stacks to prove the modules work before wiring CI/CD.

```bash
terraform -chdir=envs/dev init
terraform -chdir=envs/dev plan -var-file=dev.tfvars
terraform -chdir=envs/dev apply -auto-approve
```

## What I’d Do Next
- Add optional DNS modules for both clouds
- Publish modules to a private registry and version them
- Wire GitHub Actions to run `plan` on PRs with cost estimation

## My Takeaways
- Keep modules boring and composable; opinions belong in defaults, not hardcoded logic
- Make tags/labels first‑class; you’ll thank yourself during audits and cost reviews
- Parity across clouds reduces cognitive load when context switching

---

Working in DevOps can feel fast‑paced and performative. I move more slowly, and that’s sometimes looked down upon but it’s also why my changes stick. Not knowing is not a bad thing it helps you investigate and grow


