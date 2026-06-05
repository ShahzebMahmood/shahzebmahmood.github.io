---
layout: post
title: "NLB Idle Timeouts and Container Image Builds: Why Large Pulls Die at 350s"
description: "A deep dive into a subtle networking bug where Network Load Balancers (NLB) kill long-running container image pulls during automated build processes."
date: 2026-06-03 10:00:00 -0400
categories: [Networking, AWS]
tags: [aws, nlb, networking, container, ci-cd, troubleshooting]
---

During a recent infrastructure audit, a bizarre CI failure was identified: container image pulls for large automated builds were terminating at exactly the 350-second mark. There was no error from the registry; just a silent "connection reset by peer."

The cause was the **AWS Network Load Balancer (NLB) Idle Timeout**.

## The Environment

The environment utilizes an automated system to generate container images on demand. Some of these images are quite large (multi-gigabyte stacks). The build process pulls large base layers through an NLB that facilitates access to a private container registry.

## The Issue: Hard-coded Timeouts

Unlike an Application Load Balancer (ALB), which supports configurable idle timeouts, an NLB has a fixed TCP idle timeout of 350 seconds.

If a connection is established but remains idle—meaning no data is transmitted—for 350 seconds, the NLB silently removes the entry from its flow table. When the client (the build node) eventually attempts to transmit data or acknowledge a packet, the NLB sends a RST (reset) because it no longer recognizes the connection.

### Why Image Pulls are Affected

During a large image pull:
1. One layer may be downloading rapidly, maintaining an active connection.
2. Simultaneously, another layer may be waiting for local processing or decompression.
3. If the local processing exceeds 350 seconds without transmitting a TCP packet, the NLB terminates the connection.

## NLB vs. ALB Comparison

| Feature | NLB | ALB |
|---------|-----|-----|
| **Protocol** | TCP/UDP (Layer 4) | HTTP/HTTPS (Layer 7) |
| **Idle Timeout** | 350s (Fixed for TCP) | Up to 4000s (Configurable) |
| **Performance** | Ultra-low latency | Higher processing overhead |

## Resolution Strategies

Two methods were tested to resolve this:

### 1. TCP keep-alive

The registry client transport layer was modified to send TCP keep-alive every 60 seconds. This ensures the NLB maintains the connection in its flow table, even if the application layer is busy with CPU-intensive tasks like decompression.

### 2. Utilizing ALB for Large Payloads

For specific registry endpoints that frequently handle multi-GB layers, the traffic was migrated to an ALB with a 1-hour idle timeout. While this introduces a negligible amount of latency, the increased reliability for long-running pulls is a significant benefit.

## Key Takeaways

- **Fixed timeouts can be deceptive:** 350 seconds seems ample until dealing with multi-gigabyte images and high-latency operations.
- **Analyze the Reset:** If "Connection reset by peer" occurs at a highly consistent interval, it is often a sign of a load balancer timeout.

## Conclusion

This investigation highlights that Layer 4 networking details remain critical in modern containerized environments. If automated builds fail mysteriously during large downloads, the NLB flow table is the first place to look.
