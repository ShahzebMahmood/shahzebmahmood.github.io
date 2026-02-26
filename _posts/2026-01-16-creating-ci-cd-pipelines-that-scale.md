---
layout: post
title: "CI/CD Pipelines for Harbor to ECR Migration and Terraform Plan"
date: 2026-01-16 10:00:00 -0500
categories: [DevOps, CI/CD]
tags: [ci-cd, github-actions, harbor, ecr, terraform, aws, automation]
pin: false
---

# CI/CD Pipelines for Harbor to ECR Migration and Terraform Plan

I recently worked on two pipelines that solved real delivery problems:

- Migrating container images from Harbor to AWS ECR
- Running Terraform `plan` automatically on pull requests

Both pipelines were designed to be repeatable, auditable, and safe to run in shared environments.

## Pipeline 1: Harbor to ECR Migration

The objective was to move existing images from Harbor into ECR without rebuilding images or changing tags.

### Approach

1. Store source image list in a file (`images.txt`)
2. Authenticate to Harbor and AWS using GitHub Actions secrets + OIDC
3. Create ECR repositories if they do not exist
4. Copy images directly registry-to-registry
5. Keep logs for each migrated image

I used `skopeo` so the pipeline copies manifests/layers directly and keeps tags intact.

```yaml
name: harbor-to-ecr-migration

on:
  workflow_dispatch:
    inputs:
      image_tag:
        description: "Tag to migrate"
        required: true
        default: "latest"

permissions:
  id-token: write
  contents: read

jobs:
  migrate:
    runs-on: ubuntu-latest
    env:
      AWS_REGION: us-east-1
      AWS_ACCOUNT_ID: "123456789012"
      HARBOR_REGISTRY: harbor.example.com
      ECR_REGISTRY: 123456789012.dkr.ecr.us-east-1.amazonaws.com
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-ecr-migration-role
          aws-region: ${{ env.AWS_REGION }}

      - name: Install skopeo
        run: sudo apt-get update && sudo apt-get install -y skopeo

      - name: Login to Harbor
        run: echo "${{ secrets.HARBOR_PASSWORD }}" | skopeo login $HARBOR_REGISTRY -u "${{ secrets.HARBOR_USERNAME }}" --password-stdin

      - name: Login to ECR
        run: aws ecr get-login-password --region $AWS_REGION | skopeo login $ECR_REGISTRY -u AWS --password-stdin

      - name: Copy images Harbor -> ECR
        run: |
          TAG="${{ github.event.inputs.image_tag }}"
          while read -r IMAGE; do
            [ -z "$IMAGE" ] && continue
            aws ecr describe-repositories --repository-names "$IMAGE" >/dev/null 2>&1 || \
              aws ecr create-repository --repository-name "$IMAGE" >/dev/null

            skopeo copy --all \
              docker://$HARBOR_REGISTRY/$IMAGE:$TAG \
              docker://$ECR_REGISTRY/$IMAGE:$TAG
            echo "Migrated $IMAGE:$TAG"
          done < images.txt
```

## Pipeline 2: Terraform Plan on Pull Requests

This pipeline gives quick feedback before merge and keeps infrastructure review in the PR workflow.

### What it does

1. Runs on pull requests
2. Executes `fmt`, `init`, `validate`, and `plan`
3. Uploads `tfplan` output as an artifact
4. Fails the PR if validation or plan fails

```yaml
name: terraform-plan

on:
  pull_request:
    paths:
      - "terraform/**"

permissions:
  id-token: write
  contents: read

jobs:
  plan:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: terraform/envs/dev
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-terraform-plan-role
          aws-region: us-east-1

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.8.5

      - name: Terraform fmt
        run: terraform fmt -check -recursive

      - name: Terraform init
        run: terraform init -input=false

      - name: Terraform validate
        run: terraform validate

      - name: Terraform plan
        run: terraform plan -input=false -no-color -out=tfplan

      - name: Save plan output
        run: terraform show -no-color tfplan > tfplan.txt

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: terraform-plan-dev
          path: terraform/envs/dev/tfplan.txt
```

## What I Learned

- OIDC is critical for both pipelines so we avoid long-lived credentials
- Migration jobs should be manually triggered and logged carefully
- Terraform `plan` in PRs improves quality before `apply`
- Keep production `apply` as a separate workflow with approvals

These two pipelines made migrations safer and IaC reviews faster for the team.
