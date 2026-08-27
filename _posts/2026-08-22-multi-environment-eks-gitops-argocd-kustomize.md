---
layout: post
title: "Scaling Multi-Environment EKS GitOps with ArgoCD ApplicationSets and Kustomize"
description: "How to eliminate YAML duplication and manage multi-cluster Kubernetes deployments across dev, staging, and production using ArgoCD ApplicationSets and Kustomize components."
date: 2026-08-22 10:00:00 -0400
categories: [Kubernetes, DevOps]
tags: [kubernetes, eks, argocd, gitops, kustomize, aws, devops, infrastructure-as-code]
pin: false
mermaid: true
---

Managing Kubernetes manifests across multiple environments (`dev`, `staging`, `prod`) often starts with simple Helm values or individual Kustomize overlays. However, as microservices multiply and infrastructure scales across multiple Amazon EKS clusters and regions, maintaining individual ArgoCD `Application` CRDs quickly becomes an operational nightmare.

Teams inevitably encounter configuration drift, copy-pasted boilerplate, and forgotten environment updates.

The combination of **ArgoCD ApplicationSets** and **Kustomize Components** provides a DRY (*Don't Repeat Yourself*), scalable pattern for managing hundreds of applications across multiple clusters from a single declarative Git repository.

---

## GitOps Architecture Overview

In this pattern, a single root ApplicationSet controller dynamically discovers application definitions and environments from Git directories, automatically instantiating and synchronizing target ArgoCD applications across development and production EKS clusters.

```mermaid
flowchart TD
    subgraph GitRepo["📦 GitOps Repository (Single Source of Truth)"]
        AppsDir["apps/\n├── web-api/\n└── worker/"]
        EnvDir["environments/\n├── dev/\n├── staging/\n└── prod/"]
        AppSetManifest["ApplicationSet Controller Manifest\n(git generator / directory matrix)"]
    end

    subgraph ArgoCDControlPlane["⚡ ArgoCD Management Control Plane"]
        AppSetEngine["ApplicationSet Controller"]
        ArgoApp1["ArgoCD App: web-api-dev"]
        ArgoApp2["ArgoCD App: web-api-prod"]
    end

    subgraph TargetEKS["☸️ Target AWS EKS Clusters"]
        subgraph DevCluster["🧪 EKS Dev Cluster (us-east-1)"]
            DevPods["Pods (1 replica, spot instances)\nIngress: dev.api.internal"]
        end
        subgraph ProdCluster["🚀 EKS Prod Cluster (us-east-1 multi-AZ)"]
            ProdPods["Pods (5 replicas, HPA, PDB)\nIngress: api.company.com"]
        end
    end

    GitRepo -->|Webhook / Polling| AppSetEngine
    AppSetEngine -->|Generates CRDs| ArgoApp1
    AppSetEngine -->|Generates CRDs| ArgoApp2

    ArgoApp1 -->|Syncs Overlays| DevCluster
    ArgoApp2 -->|Syncs Overlays| ProdCluster
```text

---

## Repository Structure: Bases, Overlays, and Components

To prevent duplication while allowing environment-specific customizations (like replica counts, ingress hostnames, and resource limits), structure your repository using Kustomize bases and reusable components:

```text
gitops-fleet/
├── apps/
│   └── web-service/
│       ├── base/
│       │   ├── deployment.yaml
│       │   ├── service.yaml
│       │   └── kustomization.yaml
│       ├── components/
│       │   ├── hpa/
│       │   │   ├── horizontal-pod-autoscaler.yaml
│       │   │   └── kustomization.yaml
│       │   └── ingress-tls/
│       │       ├── ingress.yaml
│       │       └── kustomization.yaml
│       └── overlays/
│           ├── dev/
│           │   ├── patches/
│           │   │   └── resources.yaml
│           │   └── kustomization.yaml
│           ├── staging/
│           │   ├── patches/
│           │   │   └── resources.yaml
│           │   └── kustomization.yaml
│           └── prod/
│               ├── patches/
│               │   └── resources.yaml
│               └── kustomization.yaml
└── bootstrap/
    └── applicationset.yaml
```text

### The Base Manifest

The base defines the minimal, shared definition of the service:

```yaml
# apps/web-service/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-service
  template:
    metadata:
      labels:
        app: web-service
    spec:
      containers:
        - name: web-service
          image: ghcr.io/org/web-service:v1.0.0
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
```text

### Reusable Kustomize Components

Instead of duplicating HPA configurations or Ingress rules across staging and production, create modular **Kustomize Components**:

```yaml
# apps/web-service/components/hpa/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1alpha1
kind: Component
resources:
  - horizontal-pod-autoscaler.yaml
```text

```yaml
# apps/web-service/components/hpa/horizontal-pod-autoscaler.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 75
```text

### Environment Overlay with Components

The production overlay pulls the base, enables the HPA component, and patches replica counts:

```yaml
# apps/web-service/overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

components:
  - ../../components/hpa
  - ../../components/ingress-tls

patches:
  - path: patches/resources.yaml
    target:
      kind: Deployment
      name: web-service
```text

---

## Declarative ApplicationSets: Git Directory Matrix Generator

{% raw %}
Instead of manually declaring an ArgoCD `Application` YAML for every service in every environment, use an **ApplicationSet with a Git Directory Generator**.

```yaml
# bootstrap/applicationset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: fleet-applications
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          # Generator 1: Discover all microservices in apps/
          - git:
              repoURL: https://github.com/ShahzebMahmood/gitops-fleet.git
              revision: HEAD
              directories:
                - path: apps/*
          # Generator 2: Discover target environment overlays
          - git:
              repoURL: https://github.com/ShahzebMahmood/gitops-fleet.git
              revision: HEAD
              directories:
                - path: apps/*/overlays/*

  template:
    metadata:
      name: '{{path[1]}}-{{path.basename}}'
      labels:
        environment: '{{path.basename}}'
        app: '{{path[1]}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/ShahzebMahmood/gitops-fleet.git
        targetRevision: HEAD
        path: '{{path}}'
      destination:
        # Maps environment name to target cluster secret registered in ArgoCD
        name: 'eks-cluster-{{path.basename}}'
        namespace: '{{path[1]}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
          - ApplyOutOfSyncOnly=true
        retry:
          limit: 5
          backoff:
            duration: 5s
            factor: 2
            maxDuration: 3m
```text
{% endraw %}

---

## Secrets Management with External Secrets Operator (ESO)

Storing raw secrets in Git repositories is unacceptable. We integrate **External Secrets Operator (ESO)** with AWS Secrets Manager, allowing Kustomize to deploy declarative `ExternalSecret` manifests that dynamically fetch credentials at runtime.

```yaml
# apps/web-service/base/external-secret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: web-service-db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: db-credentials
    creationPolicy: Owner
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: production/web-service/database
        property: password
```text

This guarantees:
1. Zero plaintext tokens or keys exist anywhere in the GitOps repository.
2. IAM roles for Service Accounts (IRSA) / EKS Pod Identity authenticate ESO directly to AWS Secrets Manager without static IAM keys.

---

## Preventing Deployment Stampedes with Sync Waves

When deploying complex multi-tier applications (e.g., database schema migrations followed by backend APIs, then frontend ingress), race conditions can cause pods to crash-loop.

Use **ArgoCD Sync Waves** annotations to order execution:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1" # Runs first (e.g. CRDs, DB Migration Job)
---
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "2" # Runs after wave 1 succeeds (Deployments)
---
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "3" # Runs last (Ingress, DNS)
```text

---

## Best Practices and Lessons Learned

1. **Enable `ApplyOutOfSyncOnly=true`**: In large multi-cluster environments, standard sync attempts re-apply every manifest in the tree. Enabling `ApplyOutOfSyncOnly` reduces Kubernetes API server load by over 80%.
2. **Use Directory Matrix Generators**: Matrix generators eliminate cross-product combinatorial explosions while keeping directory hierarchies intuitive.
3. **Automate PR Pre-Validation**: Run `kustomize build` and `kubeconform` inside CI checks before merging into the main GitOps branch to catch syntax and schema errors before ArgoCD processes them.

---

## Key Takeaways

- **Single Control Plane**: Manage hundreds of microservice instances across multiple EKS clusters declaratively.
- **DRY Configurations**: Kustomize Components isolate shared capabilities (HPA, Ingress, Monitoring) without duplicating YAML files.
- **Zero Drift**: Continuous self-healing ensures cluster state always matches the audited Git commit history.

---

## Related Posts

- [Building an EKS Cluster with Terraform and Least-Privilege IAM](/posts/building-production-ready-eks-cluster-with-terraform/)
- [A Deep Dive into Kustomize for Multi-Environment Setups](/posts/a-deep-dive-into-kustomize-for-multi-env-setups/)
- [Zero-Trust Mesh Networking: Subnet Routing and Tailscale ACLs](/posts/zero-trust-tailscale-subnet-routing-private-cloud/)
