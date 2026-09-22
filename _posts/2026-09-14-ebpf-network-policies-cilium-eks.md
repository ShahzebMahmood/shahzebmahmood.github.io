---
layout: post
title: "Zero-Trust Pod Networking on EKS: Replacing kube-proxy and iptables with Cilium eBPF"
description: "Benchmarking and implementing Cilium eBPF on AWS EKS to eliminate iptables latency, enforce Layer 7 DNS and HTTP network policies, and inspect traffic with Hubble."
date: 2026-09-14 10:00:00 -0400
categories: [Kubernetes, Networking]
tags: [cilium, ebpf, kubernetes, networking, security, eks]
pin: false
mermaid: true
---

As Kubernetes clusters scale to hundreds of microservices and thousands of active pods, traditional networking internals begin to show strain. By default, Kubernetes routes cluster traffic through `kube-proxy`, which translates Service virtual IPs to Pod endpoints using Linux kernel `iptables` or `ipvs` rules.

In high-density environments, sequential `iptables` rule evaluation introduces noticeable packet latency, high CPU overhead during service endpoint updates, and severe connection tracking (`conntrack`) table exhaustion. Furthermore, standard Kubernetes NetworkPolicies operate solely at Layer 3 (IP addresses) and Layer 4 (ports), making it impossible to enforce granular security policies like "allow GET requests to `/api/v1/health` while denying POST requests to `/api/v1/admin`".

Cilium addresses these challenges by replacing `kube-proxy` and `iptables` entirely with extended Berkeley Packet Filter (eBPF).

Here is a technical analysis of why eBPF outperforms `iptables`, how to deploy Cilium on AWS EKS, and how to write Layer 7 network policies with deep observability via Hubble.

---

## The Bottleneck with iptables and kube-proxy

To understand why `iptables` degrades at scale, consider how the Linux packet filter processes an incoming network packet.

`iptables` stores packet filtering rules in sequential lists. When a packet arrives on a network interface:

1. The kernel iterates through the chain line by line until it finds a matching rule.
2. The algorithmic complexity is $O(N)$, where $N$ represents the total number of rules (proportional to services $\times$ endpoints).
3. Whenever a pod starts, terminates, or fails a readiness probe, `kube-proxy` must regenerate and re-synchronize the entire `iptables` rule set, causing intermittent CPU spikes on worker nodes.

```mermaid
flowchart TD
    subgraph TraditionalIPTables["Traditional kube-proxy & iptables: O(N) Traversal"]
        P1["Incoming Packet"] --> R1["Rule 1: Check IP & Port"]
        R1 -->|No Match| R2["Rule 2: Check IP & Port"]
        R2 -->|No Match| R3["... Rule 10,000+"]
        R3 -->|Match Found| A1["Forward Packet to Target Pod"]
    end

    subgraph CiliumEBPF["Cilium eBPF Architecture: O(1) Hash Map Lookup"]
        P2["Incoming Packet"] --> BPF["eBPF Socket / XDP Program"]
        BPF -->|Direct Hash Key Lookup| Map["BPF Endpoint Hash Map"]
        Map -->|Constant Time O(1)| A2["Direct In-Kernel Packet Forwarding"]
    end
```

### The eBPF Advantage

eBPF allows developers to run sandboxed bytecode inside the Linux kernel without changing kernel source code or loading kernel modules.

Instead of evaluating sequential lists:

1. Cilium compiles BPF programs that attach directly to kernel network hooks (Traffic Control `tc` and eXpress Data Path `XDP`).
2. Endpoints and services are stored in **BPF Maps** (in-kernel hash tables).
3. When a packet arrives, the eBPF program performs an $O(1)$ constant-time key lookup in the hash table to determine the target pod IP and execute policy verdicts immediately.
4. Scale-ups, scale-downs, and endpoint updates only require updating an entry in the hash table, eliminating CPU spikes and lock contention.

---

## Deploying Cilium on AWS EKS in kube-proxy Replacement Mode

When running EKS, you have two primary options:

1. **Chaining Mode:** Run Cilium on top of the AWS VPC CNI for IPAM, using Cilium solely for policy enforcement and eBPF service routing.
2. **Pure Cilium Mode:** Disable the AWS VPC CNI and run Cilium natively with its own ENI IPAM allocator.

For most enterprise setups requiring VPC-native pod IPs, Cilium running in ENI mode alongside the AWS VPC CNI provides the cleanest architecture.

### Step 1: Disable kube-proxy

To allow Cilium to manage service routing natively, scale down or delete the existing `kube-proxy` DaemonSet:

```bash
kubectl -n kube-system patch daemonset kube-proxy -p '{"spec": {"template": {"spec": {"nodeSelector": {"non-existing": "true"}}}}}'
```

### Step 2: Install Cilium with Helm

Install Cilium with `kubeProxyReplacement=true` and enable the Hubble observability engine:

```bash
helm repo add cilium https://helm.cilium.io/
helm repo update

helm install cilium cilium/cilium \
  --namespace kube-system \
  --set kubeProxyReplacement=true \
  --set k8sServiceHost="YOUR_EKS_API_ENDPOINT" \
  --set k8sServicePort=443 \
  --set eni.enabled=true \
  --set ipam.mode=eni \
  --set egressGateway.enabled=true \
  --set bpf.masquerade=true \
  --set hubble.enabled=true \
  --set hubble.relay.enabled=true \
  --set hubble.ui.enabled=true
```

Verify that Cilium and eBPF programs are operational across all cluster nodes:

```bash
cilium status --wait
```

---

## Enforcing Layer 7 Zero-Trust Network Policies

Standard Kubernetes `NetworkPolicy` cannot inspect HTTP verbs, path prefixes, or external Fully Qualified Domain Names (FQDNs). Cilium extends policy capabilities via `CiliumNetworkPolicy`.

### Use Case 1: Granular HTTP Path and Verb Filtering

Consider a frontend service that should only call the health and status endpoints of a backend billing service, while being blocked from modifying records:

```yaml
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: restrict-billing-access
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: billing-api
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: frontend-dashboard
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
          rules:
            http:
              - method: "GET"
                path: "/api/v1/status"
              - method: "GET"
                path: "/api/v1/health"
```

If a compromised frontend pod attempts to send a `POST /api/v1/charges` or `DELETE /api/v1/customers`, the Cilium eBPF proxy drops the packet at the socket layer and returns an HTTP `403 Forbidden` without the packet ever reaching the backend application container.

### Use Case 2: Restricting Egress to External APIs via FQDN

Traditional firewall rules rely on static IP addresses, which fail when integrating with cloud APIs that rotate IPs dynamically behind CDNs.

Cilium allows egress filtering based on DNS domain names:

```yaml
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: allow-stripe-egress-only
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: payment-worker
  egress:
    - toFQDNs:
        - matchName: "api.stripe.com"
      toPorts:
        - ports:
            - port: "443"
              protocol: TCP
    - toEndpoints:
        - matchLabels:
            k8s:k8s-app: kube-dns
      toPorts:
        - ports:
            - port: "53"
              protocol: ANY
          rules:
            dns:
              - matchPattern: "*"
```

Cilium intercepts DNS requests, tracks the resolved IPs in a dynamic in-kernel cache, and allows outbound traffic only to the current IP addresses returned for `api.stripe.com`. All other outbound connections are immediately blocked.

---

## Real-Time Network Observability with Hubble

One of the largest hurdles in implementing zero-trust network policies is the fear of breaking existing inter-service communications.

Hubble provides distributed network, service, and security observability built directly on top of eBPF.

### Viewing Traffic Flows in the Terminal

Using the Hubble CLI, operators can inspect live packet flows, DNS resolutions, and dropped packets in real time:

```bash
# Stream all dropped packets in the production namespace
hubble observe --namespace production --verdict DROPPED -f

# Inspect DNS queries originating from a specific pod
hubble observe --pod payment-worker-678df-xyz --protocol dns
```

The output gives clear, actionable visibility into policy denials:

```text
TIMESTAMP             SOURCE                         DESTINATION                    TYPE            VERDICT
Sep 14 10:15:22.102   production/frontend-pod:51234  production/billing-api:8080    HTTP/1.1 POST   DROPPED (Policy denied)
Sep 14 10:15:24.450   production/frontend-pod:51236  production/billing-api:8080    HTTP/1.1 GET    FORWARDED (Allowed)
```

By auditing flows in monitoring mode before enforcing default-deny policies, teams can build network policy allow-lists with complete confidence.

---

## Production Considerations

1. **Kernel Compatibility:** Cilium eBPF requires a modern Linux kernel. AWS Bottlerocket and Amazon Linux 2023 both run Linux 6.1+, providing full eBPF feature support out of the box.
2. **BPF Map Sizing:** On clusters running tens of thousands of connections, tune `bpf.mapDynamicSizeRatio` and `bpf.ctMaxTcp` in your Helm values to ensure the kernel connection tracking maps do not overflow during traffic surges.
3. **Layer 7 Proxy Overhead:** Layer 3 and Layer 4 policies run entirely in the kernel with near-zero latency. Layer 7 HTTP policies require redirecting packets to Cilium's local Envoy proxy instance. Use L7 rules deliberately where application payload filtering is strictly needed.

---

## Summary

Migrating from `kube-proxy` and `iptables` to Cilium eBPF transforms Kubernetes networking from an $O(N)$ sequential bottleneck into a deterministic $O(1)$ kernel pipeline. In addition to sub-millisecond routing efficiency, Cilium delivers granular Layer 7 network policies and real-time observability via Hubble, making zero-trust pod communication realistic in high-scale production clusters.
