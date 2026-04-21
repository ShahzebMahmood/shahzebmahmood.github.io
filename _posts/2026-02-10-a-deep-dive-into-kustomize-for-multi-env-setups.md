---
layout: post
title: "A Deep Dive into Kustomize for Multi-Env Setups"
description: "How I use Kustomize to manage Kubernetes configurations across different environments without duplicating YAML."
date: 2026-03-10 11:30:00 -0500
categories: [DevOps, Kubernetes]
tags: [kubernetes, kustomize, gitops, iac, best-practices]
pin: false
---

# A Deep Dive into Kustomize for Multi-Env Setups

In my post about building an EKS cluster, I mentioned that Kustomize "saved my sanity." That wasn't an exaggeration. Before I adopted it, managing Kubernetes configurations for different environments (dev, staging, prod) was a mess of duplicated YAML files and error-prone `sed` commands in shell scripts. Every small change had to be manually propagated across files, which was both tedious and risky.

Kustomize changed my entire approach. It allows you to customize raw, template-free YAML files for multiple purposes, leaving the original YAML untouched and usable as is. It's built into `kubectl`, which is a huge plus. Here’s a deeper look at how I use it to keep my Kubernetes manifests DRY (Don't Repeat Yourself) and maintainable.

## The Core Idea: Base and Overlays

The Kustomize workflow revolves around two concepts: a `base` and `overlays`.

-   **Base:** This is a directory containing the common, environment-agnostic Kubernetes resource definitions (Deployment, Service, etc.) and a `kustomization.yaml` file that lists them. This is the single source of truth for your application's structure.
-   **Overlays:** These are environment-specific directories (e.g., `dev`, `prod`) that build upon the `base`. Each overlay has its own `kustomization.yaml` that points to the `base` and specifies patches or modifications.

This structure is incredibly powerful. You define the core resources once and then apply small, targeted changes for each environment.

## A Practical Example

Let's walk through a simple setup for a web application.

Our directory structure looks like this:
```
my-app/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   ├── deployment-patch.yaml
    │   └── kustomization.yaml
    └── prod/
        ├── deployment-patch.yaml
        └── kustomization.yaml
```

### The `base`

The `base` contains the standard stuff.

`base/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-org/my-app:1.0.0
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

`base/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
```

### The `dev` Overlay

For dev, I usually just want to use a different image tag and maybe add a label to help me identify it easily.

`overlays/dev/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

commonLabels:
  env: dev

images:
  - name: my-org/my-app
    newTag: "dev-latest"
```

Now, to see the final YAML for `dev`, we can run:
```bash
kubectl kustomize overlays/dev
```
This will output the full Kubernetes manifests with the `env: dev` label and the `dev-latest` image tag applied.

### The `prod` Overlay

For production, we need higher replica counts and more robust resource limits. We'll use a patch for this.

`overlays/prod/deployment-patch.yaml`:
```yaml
# This is a Strategic Merge Patch
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: my-app
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1"
```

`overlays/prod/kustomization.yaml`:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

commonLabels:
  env: prod

images:
  - name: my-org/my-app
    newTag: "2.1.0" # Use a specific version tag for prod

patchesStrategicMerge:
  - deployment-patch.yaml
```

By running `kubectl kustomize overlays/prod`, we get manifests with 3 replicas, higher resource limits, and the correct image tag. The original `base/deployment.yaml` remains untouched.

## Why I Prefer Kustomize Over Helm (Sometimes)

I use both Helm and Kustomize, but I often reach for Kustomize first for application configuration because:

1.  **It's YAML-native:** There's no new templating language to learn (like Go templates in Helm). You're just writing and patching standard Kubernetes YAML.
2.  **Declarative Over Imperative:** You declare *what* you want to change, not *how* to change it. This feels more aligned with the Kubernetes philosophy.
3.  **No Tiller/Server-Side Component:** It's a purely client-side tool, which simplifies things.
4.  **Great for GitOps:** The structure of bases and overlays maps perfectly to GitOps workflows. Your Git repository becomes a clear, auditable record of your application's configuration across all environments.

## Common Pitfalls and Tips

-   **Start with a Solid Base:** Make your `base` as generic as possible. Environment-specific details should always live in overlays.
-   **Use `commonLabels` and `commonAnnotations`:** This is the easiest way to apply metadata consistently across all resources in an overlay.
-   **Understand Patching:** Kustomize supports different patching strategies (Strategic Merge, JSON patches). Strategic Merge is often the easiest, but JSON patches offer more power for complex modifications.

Kustomize has a learning curve, but the payoff in maintainability is huge. It forces a clean separation of concerns and makes managing multi-environment Kubernetes applications far less painful. It brought structure to my chaos, and for that, it will always be one of my favorite tools in the Kubernetes ecosystem.