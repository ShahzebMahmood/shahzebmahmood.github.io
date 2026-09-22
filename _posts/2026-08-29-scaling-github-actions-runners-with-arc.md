---
layout: post
title: "Scaling GitHub Actions Runners on Kubernetes with Actions Runner Controller"
description: "A comprehensive guide to deploying ephemeral self-hosted GitHub Actions runners using Actions Runner Controller ARC, AutoScalingRunnerSets, and rootless container isolation."
date: 2026-08-29 10:00:00 -0400
categories: [DevOps, CI-CD]
tags: [github-actions, kubernetes, arc, cicd, devops, docker]
pin: false
mermaid: true
---

Running continuous integration and deployment pipelines on GitHub-hosted runners offers simplicity, but teams often hit walls around compute constraints, concurrency limits, and mounting costs. For organizations running Docker builds, heavy integration suites, or workloads requiring private VPC access, self-hosted runners become necessary.

However, traditional self-hosted runners hosted on static virtual machines bring severe operational headaches:

1. **State Leakage:** Previous jobs leave artifacts, Docker layers, and credentials on disk, leading to unpredictable pipeline failures.
2. **Security Risks:** If an untrusted pull request runs on a persistent VM runner, it can access residual environment secrets or compromise the host.
3. **Inefficient Capacity Utilization:** VM runners sit idle overnight while racking up cloud bills, yet queue times spike during working hours when developer activity peaks.

The solution is ephemeral runners running on Kubernetes, managed by Actions Runner Controller (ARC).

Here is an architectural walkthrough of the modern ARC controller architecture and a guide to deploying secure, ephemeral runner scale sets.

---

## Architectural Evolution of Actions Runner Controller

Early iterations of ARC used custom webhook listeners and custom resource definitions like `RunnerDeployment` and `RunnerReplicaSet`. While functional, they suffered from synchronization delays, race conditions when jobs completed, and fragile webhook routing.

The modern architecture redesigns ARC to use GitHub native runner scale sets (`gha-runner-scale-set`).

Instead of managing runners through ad-hoc webhooks, ARC establishes a persistent outbound long-poll connection directly to the GitHub Actions Service via an autoscaling listener.

```mermaid
flowchart TD
    subgraph GitHubCloud["GitHub Platform"]
        GHA["GitHub Actions Workflow Queue"]
    end

    subgraph KubernetesCluster["Kubernetes Cluster"]
        subgraph ARCSystem["arc-systems Namespace"]
            ARC_Controller["ARC Controller Pod"]
        end

        subgraph RunnerNamespace["arc-runners Namespace"]
            Listener["AutoScaling Listener Pod (Outbound HTTPS Long Poll)"]
            Pod1["Ephemeral Runner Pod 1 (Active Job)"]
            Pod2["Ephemeral Runner Pod 2 (Active Job)"]
        end
    end

    Listener -->|Outbound HTTPS Long Poll| GHA
    GHA -->|Job Dispatched| Listener
    Listener -->|Request Pod Creation| ARC_Controller
    ARC_Controller -->|Spawn Ephemeral Pod| Pod1
    ARC_Controller -->|Spawn Ephemeral Pod| Pod2
    Pod1 -->|Execute & Terminate| GHA
```

### Key Advantages of the Listener Model

1. **Zero Inbound Ingress:** The listener connects outward over standard HTTPS (port 443). You do not need to open public firewall ports, manage load balancers, or expose public webhooks to GitHub.
2. **Accurate Queue Depth:** The listener reads the exact pending job demand directly from GitHub Actions, scaling pods up immediately when workflows trigger and down to zero when queues empty.
3. **Guaranteed Ephemerality:** Each runner pod executes exactly one job and terminates immediately. The pod storage is discarded, ensuring zero cross-job pollution.

---

## Deploying ARC with Helm

ARC is deployed in two tiers: the controller operator in a system namespace, and one or more `AutoScalingRunnerSet` instances in dedicated runner namespaces.

### Step 1: Deploy the ARC Controller Manager

First, install the core controller into `arc-systems`:

```bash
helm install arc \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller \
  --namespace arc-systems \
  --create-namespace
```

Verify that the controller manager pod is in a ready state:

```bash
kubectl get pods -n arc-systems
```

### Step 2: Configure Authentication

ARC authenticates to GitHub using either a GitHub App or a Personal Access Token. A GitHub App is the recommended standard because it provides finer-grained repository permissions and higher API rate limits.

Create a Kubernetes secret containing your GitHub App private key and credentials:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: github-app-secret
  namespace: arc-runners
type: Opaque
stringData:
  github_app_id: "123456"
  github_app_installation_id: "7891011"
  github_app_private_key: |
    -----BEGIN RSA PRIVATE KEY-----
    MIIEowIBAAKCAQEA0m...
    -----END RSA PRIVATE KEY-----
```

---

## Configuring the AutoScalingRunnerSet

The `AutoScalingRunnerSet` defines the runner image, container specifications, resource limits, and auto-scaling boundaries.

Here is a production-grade configuration that scales from 0 to 30 runners on demand:

```yaml
apiVersion: actions.github.com/v1alpha1
kind: AutoscalingRunnerSet
metadata:
  name: k8s-ephemeral-runner
  namespace: arc-runners
spec:
  githubConfigUrl: "https://github.com/my-org-or-repo"
  githubConfigSecret: github-app-secret
  minRunners: 0
  maxRunners: 30
  template:
    spec:
      containers:
        - name: runner
          image: ghcr.io/actions/actions-runner:latest
          command: ["/home/runner/run.sh"]
          env:
            - name: ACTIONS_RUNNER_HOOK_JOB_STARTED
              value: "/etc/arc/hooks/job-started.sh"
          resources:
            requests:
              cpu: "2"
              memory: "4Gi"
            limits:
              cpu: "4"
              memory: "8Gi"
          securityContext:
            readOnlyRootFilesystem: false
            runAsNonRoot: true
            runAsUser: 1001
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: work
              mountPath: /home/runner/_work
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: work
          emptyDir: {}
        - name: tmp
          emptyDir: {}
```

---

## Solving the Docker-in-Docker Challenge

Most CI pipelines build container images. When running inside Kubernetes runner pods, workflows require a mechanism to interact with a Docker daemon.

Three common patterns exist, each with distinct security profiles:

### 1. Docker-in-Docker (dind) Sidecar

A secondary container running `docker:dind` runs alongside the runner container in the same pod.

- **Pros:** Full compatibility with standard `docker build`, `docker-compose`, and service containers.
- **Cons:** Requires running the sidecar with `securityContext.privileged: true`.
- **Mitigation:** Run the sidecar in an isolated node pool or namespace with restricted Kubernetes RBAC.

```yaml
# Pod spec snippet for dind sidecar
spec:
  containers:
    - name: runner
      image: ghcr.io/actions/actions-runner:latest
      env:
        - name: DOCKER_HOST
          value: tcp://localhost:2376
        - name: DOCKER_TLS_VERIFY
          value: "1"
        - name: DOCKER_CERT_PATH
          value: /certs/client
      volumeMounts:
        - name: dind-certs
          mountPath: /certs/client
          readOnly: true
    - name: dind
      image: docker:dind
      securityContext:
        privileged: true
      volumeMounts:
        - name: dind-certs
          mountPath: /certs/client
```

### 2. Kubernetes-Mode Runner (Container Hooks)

Rather than running Docker commands inside the runner container, ARC container hooks delegate step containers directly to the Kubernetes API, launching sibling pods on the cluster for each workflow step.

- **Pros:** No privileged daemon required; native Kubernetes pod isolation.
- **Cons:** Some third-party GitHub Actions that assume a local Docker socket will fail or require modification.

### 3. Daemonless Builders (Kaniko or Buildah)

Pipelines replace `docker build` with daemonless tools like Kaniko or Buildah.

- **Pros:** Completely unprivileged builds without Docker daemon dependencies.
- **Cons:** Workflows must be updated to use CLI alternatives rather than standard Docker commands.

---

## Target Workflow Usage

Once the runner scale set is registered, triggering it from GitHub Actions requires specifying the runner set name in `runs-on`:

```yaml
name: Production Test Suite

on:
  pull_request:
    branches: [main]

jobs:
  integration-test:
    runs-on: k8s-ephemeral-runner
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Runtime
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install and Test
        run: |
          npm ci
          npm test
```

When this pull request is opened:

1. GitHub registers a queued job targeting `k8s-ephemeral-runner`.
2. The ARC listener detects the demand and requests a new runner pod.
3. Kubernetes schedules the pod on an available node.
4. The pod executes the checkout and test commands.
5. Upon job completion, the pod terminates and deletes its temporary storage.

---

## Production Best Practices

1. **Set `minRunners: 0` for Non-Critical Queues:** Scaling to zero saves compute costs during off-hours. For high-priority pipelines where waiting 30 seconds for pod startup is unacceptable, maintain a warm pool of 1 to 2 idle runners with `minRunners: 2`.
2. **Combine with Dynamic Node Autoscaling:** Pair ARC with Karpenter. When a burst of 20 PRs triggers simultaneously, ARC spawns 20 runner pods, which prompts Karpenter to rapidly provision dedicated spot instances. Once finished, pods terminate, nodes consolidate, and costs drop back to baseline.
3. **Enforce Ephemeral Volumes:** Always use `emptyDir` backed by memory or local SSDs for `/home/runner/_work` and `/tmp`. This guarantees that high I/O test suites run fast and prevents disk exhaustion on host nodes.
4. **Monitor Queue Metrics:** Scrape ARC Prometheus metrics (`gha_runner_scale_set_running_jobs` and `gha_runner_scale_set_queued_jobs`) to identify runner pool saturation and track CI wait times across engineering teams.

---

## Summary

Migrating from static virtual machine runners to ephemeral Actions Runner Controller scale sets eliminates state contamination, secures CI workflows against cross-run tampering, and cuts idle cloud infrastructure spend to zero.
