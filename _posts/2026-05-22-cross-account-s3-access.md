---
layout: post
title: "Cross-Account S3 Access: Bucket Policies vs. Role Chaining"
description: "Best practices for cross-account S3 access in cloud-native compute environments, comparing bucket policies and IAM role chaining."
date: 2026-05-22 10:00:00 -0400
categories: [AWS, Security]
tags: [aws, s3, iam, security, cross-account, devops]
---

In complex enterprise AWS setups, data storage (S3) and compute resources often reside in different accounts. Configuring this cross-account access securely is a fundamental IAM challenge.

This post explores the two primary methods for managing this: **Bucket Policies** and **Role Chaining with External IDs**.

## The Scenario

- **Account A (Storage):** Owns the S3 bucket containing data or results.
- **Account B (Compute):** Runs the worker nodes or processing jobs.

## Option 1: The S3 Bucket Policy (Direct Access)

In this model, Account B access is granted direct access via a bucket policy in Account A.

**Bucket Policy in Account A:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::ACCOUNT_B:role/ComputeWorkerRole"
            },
            "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
            "Resource": [
                "arn:aws:s3:::my-data-bucket",
                "arn:aws:s3:::my-data-bucket/*"
            ]
        }
    ]
}
```

## Option 2: Role Chaining with External ID (Cross-Account Assumption)

This is a robust pattern for shared infrastructure. A role in Account B assumes a dedicated role in Account A.

1. **Role in Account A:** Defined with the necessary S3 permissions.
2. **Trust Policy in Account A:** Permits Account B to assume the role, provided a specific `ExternalId` is supplied.

**Trust Policy in Account A:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_B:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "SharedSecretForIdentityVerification"
        }
      }
    }
  ]
}
```

## Why Assume the Role in the Resource Account?

A common question is whether to assume a role in the compute account or the storage account.

**The recommendation is to assume the role in the account that owns the resource (Account A).**
This approach ensures that the compute process operates as a "native" entity within the storage account. This avoids complex cross-account S3 ACL issues and ensures that newly created objects are automatically owned by the storage account.

## Trade-offs

| Feature | IAM User Credentials | Assumed Role with External ID |
|---------|----------------------|-------------------------------|
| **Security** | Static Keys (High Risk) | Temporary Tokens (Low Risk) |
| **Rotation** | Manual Process | Automatic via STS |
| **Auditability** | Low | High (CloudTrail logs the assumption) |
| **Complexity** | Low | Medium |

## Conclusion

For multi-account infrastructure, **Role Chaining with External IDs** is often the superior choice. It provides a clean security boundary, simplifies object ownership, and allows the data owner to maintain strict control without overwhelming bucket policies.
