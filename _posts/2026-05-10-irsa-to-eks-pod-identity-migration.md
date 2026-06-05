---
layout: post
title: "IRSA to EKS Pod Identity: Migrating a Multi-Controller Stack"
description: "A deep dive into migrating from IAM Roles for Service Accounts (IRSA) to EKS Pod Identity, featuring common cluster controllers like Load Balancers and Storage CSI drivers."
date: 2026-05-10 10:00:00 -0400
categories: [AWS, EKS]
tags: [aws, eks, iam, pod-identity, irsa, kubernetes, devops]
---

As EKS Pod Identity gains traction, many are weighing the trade-offs against the established IAM Roles for Service Accounts (IRSA) pattern. In a recent modernization of a production Kubernetes environment, I migrated a multi-controller stack—including identity managers, the AWS Load Balancer Controller, and the EFS CSI driver—to this new model.

Here is an analysis of why the "Pod Identity" approach is fundamentally changing how identity is handled in Kubernetes.

## The Problem with IRSA

IRSA has been the standard for years, but it comes with operational overhead:
1. **OIDC Provider per Cluster:** You need to manage OIDC identity providers in IAM for every cluster.
2. **Service Account Annotations:** Every service account needs a specific ARN annotation.
3. **Trust Policy Verbosity:** IAM role trust policies become massive as more clusters and namespaces are added.

## The EKS Pod Identity Advantage

EKS Pod Identity simplifies this by removing the OIDC requirement. Instead, the EKS runtime handles the credential exchange natively.

### Concrete Example: AWS Load Balancer Controller

Previously, with IRSA, the trust policy looked like this:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLE"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLE:sub": "system:serviceaccount:kube-system:aws-load-balancer-controller"
        }
      }
    }
  ]
}
```

With Pod Identity, the trust policy is significantly cleaner:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowEksAuthToAssumeRoleForPodIdentity",
            "Effect": "Allow",
            "Principal": {
                "Service": "pods.eks.amazonaws.com"
            },
            "Action": [
                "sts:AssumeRole",
                "sts:TagSession"
            ]
        }
    ]
}
```

## Migrating the Stack: Storage & Identity Controllers

The migration focuses on the EKS Pod Identity Agent addon. 

1. **Install the Addon:** Ensure the `eks-auth-agent` is running on the nodes.
2. **Map the Role:** Use the `aws_eks_pod_identity_association` resource to link the ServiceAccount to the IAM Role.
3. **Remove Annotations:** There is no longer a need for `eks.amazonaws.com/role-arn` on ServiceAccounts.

## Real Trade-offs

| Feature | IRSA | Pod Identity |
|---------|------|--------------|
| **Setup** | OIDC Provider + Annotations | EKS Addon + Association |
| **Complexity** | High (Trust Policies) | Low (Centralized) |
| **Cross-Account** | Supported | Not yet natively seamless |
| **Performance** | Native STS | Local Agent Proxy |

## Conclusion

Adopting Pod Identity reduces IAM boilerplate significantly. For those running EKS 1.24+ and looking to scale controller management, this is a highly recommended transition.
