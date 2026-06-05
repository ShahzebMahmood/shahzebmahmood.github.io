---
layout: post
title: "Replacing Static AWS Keys with OIDC: A CI/CD Publisher Walkthrough"
description: "How to harden GitHub Actions CI/CD by migrating from static AWS credentials to OIDC, scoped to specific S3 prefixes and branches."
date: 2026-05-28 10:00:00 -0400
categories: [Security, GitHub Actions]
tags: [aws, github-actions, oidc, security, devops, iam, s3]
---

Static AWS credentials stored in GitHub Secrets represent a significant security liability. If compromised, they provide persistent access until manually revoked. A more secure approach is to migrate to **OIDC (OpenID Connect)**, which provides temporary, scoped-down credentials for CI/CD workflows.

This walkthrough demonstrates how to implement a generic OIDC pattern scoped to a specific S3 prefix and a single branch.

## The Problem: Persistent Credentials

Traditionally, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are used for automation. These keys are often overly permissive and valid indefinitely, making them high-value targets for attackers.

## The Solution: GitHub Actions OIDC

With OIDC, GitHub acts as an Identity Provider (IdP). AWS is configured to trust GitHub, allowing specific repositories, branches, or environments to assume a dedicated IAM role.

### Step 1: The IAM Trust Policy

The trust policy is the primary guardrail. It should be restricted to a specific repository and branch.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:my-organization/my-repository:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

### Step 2: Scoping S3 Permissions

To adhere to the principle of least privilege, the IAM role should only have access to the necessary S3 prefix.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:GetObject"],
            "Resource": "arn:aws:s3:::my-artifact-bucket/artifacts/*"
        }
    ]
}
```

### Step 3: Workflow Configuration

In the GitHub Actions workflow, the `id-token` permission must be requested to enable the use of the OIDC token.

```yaml
permissions:
  id-token: write # Required for requesting the JWT
  contents: read  # Required for actions/checkout

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/ArtifactPublisherRole
          aws-region: us-east-1

      - name: Publish Artifacts
        run: ./publish.sh --bucket my-artifact-bucket --prefix artifacts
```

## Benefits

1. **Elimination of Secret Rotation:** There is no need to manually rotate static keys.
2. **Branch-Level Security:** Access can be restricted so that only the `main` branch (or other protected branches) can publish artifacts.
3. **Temporal Access:** Credentials are valid only for the duration of the job, significantly reducing the blast radius of a potential compromise.

## Conclusion

Migrating to OIDC replaces static, high-risk credentials with a dynamic and verifiable identity flow. This shift significantly improves the security posture of any CI/CD pipeline.
