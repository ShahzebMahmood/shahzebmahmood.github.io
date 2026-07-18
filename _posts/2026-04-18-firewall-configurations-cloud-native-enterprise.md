---
layout: post
title: "Firewall Configurations for Cloud-Native Enterprise Platforms: A Guide to Secure Network Access"
description: "A comprehensive guide to configuring firewalls, DNS allowlisting, and dynamic IP ranges for secure enterprise middleware and cloud-native application deployments."
date: 2026-04-18 10:00:00 -0400
categories: [Security, DevOps]
tags: [security, firewall, cloudflare, networking, devops, cloud]
---

# Firewall Configuration for Enterprise Cloud Platforms

> This is a blog post from the Cloud Infrastructure Engineering team that describes firewall configurations to apply when working with enterprise cloud-native products.

## Why This Matters

Proper firewall configuration is essential for secure infrastructure. This blog post covers firewall setup for two main scenarios:

- **Managed Cloud Services**: When cloud services need to connect to internal resources within your network (storage servers, container registries, etc.)
- **Self-Hosted Enterprise**: When you're running the Enterprise Platform in your own environment

Without proper firewall configuration, essential services such as dynamic container builds or distributed data services may fail to function properly.

## DNS Allowlisting (Recommended Approach)

DNS-based firewall rules with wildcards are the preferred method for allowlisting platform services. This approach is more reliable and easier to maintain than IP-based rules.

### Cloud Users - Minimal Rules

If your firewall supports DNS-based rules with wildcards, allow the following domains:

```
*.enterprise-cloud-platform.com
*.connect.cloud.enterprise-cloud-platform.com
*.enterprise-cloud-platform.com.cdn.cloudflare.net
```

### Enterprise Users - Specific Services

For Enterprise users who need more granular control, here are the specific endpoints by service:

**Core Platform Services:**
- `api.cloud.enterprise-cloud-platform.com` - Platform API
- `cloud.enterprise-cloud-platform.com` - Main platform interface
- `auth.cr.enterprise-cloud-platform.com` - Container Registry Authentication
- `user-data.cloud.enterprise-cloud-platform.com` - User data services

**Container Registries:**
- `cr.enterprise-cloud-platform.com` - Main container registry
- `public-cr-prod.enterprise-cloud-platform.com` - Public container registry
- `community-cr-prod.enterprise-cloud-platform.com` - Community container registry
- `public.cr.enterprise-cloud-platform.com` - Public registry interface

**Dynamic Container Build Services:**
- `build.enterprise-cloud-platform.com` - Container build service
- `community.build.enterprise-cloud-platform.com` - Community build service
- `build-cache-prod-cloudflare.enterprise-cloud-platform.com` - Build cache service

**Distributed Data Services:**
- `datafs.enterprise-cloud-platform.com` - Distributed file system
- `pipeline-xpack.enterprise-cloud-platform.com` - Distributed pipeline extension pack

**Other Services:**
- `licenses.enterprise-cloud-platform.com` - License Validation Endpoints
- `meta.enterprise-cloud-platform.com` - Metadata and IP ranges
- `hub.enterprise-cloud-platform.com` - Platform hub
- `api.metrics.internal` - Metrics API
- `intern.enterprise-cloud-platform.com` - Internal services
- `auth-service.enterprise-cloud-platform.com` - Authentication service

### Interactive Workspaces Requirements

Interactive workspaces use dynamic subdomains under `*.connect.cloud.enterprise-cloud-platform.com`, so wildcard support is required for using interactive workspaces.

> ⚠️ **Note:** If your firewall blocks wildcard domains, interactive workspaces will not function unless `*.connect.cloud.enterprise-cloud-platform.com` is explicitly allowed.

> **Enterprise Note:** The wildcard requirement should be removed in version 25.2 for Enterprise deployments.

## IP-Based Rules (Alternative Approach)

If your firewall doesn't support DNS-based rules, you can use IP addresses instead.

### Dynamic IP Address Management

The platform provides a dynamically updated list of IP ranges at [https://meta.enterprise-cloud-platform.com/v3](https://meta.enterprise-cloud-platform.com/v3).

> **Important:** Use version v3 of the endpoint as older versions use a different JSON schema.

The endpoint returns a JSON object using the following schema:

```json
{
  "egress": [
    "a.b.c.d/32",
    "...",
    "w.x.y.z/32"
  ],
  "ingress": [
    "d.c.b.a/32",
    "...",
    "z.y.x.w/32"
  ]
}
```

- **Egress**: IP addresses that outbound traffic from Cloud services will originate from (e.g., when accessing S3 buckets, your container registries, etc.)
- **Ingress**: IP addresses that need to be allowed to access services when pushing data to the cloud or communicating with self-hosted environments

### Cloudflare IPs

Since the services use Cloudflare, you'll also need to allow all IPs listed at [https://www.cloudflare.com/ips/](https://www.cloudflare.com/ips/).

> **Note:** The endpoint at meta.enterprise-cloud-platform.com/v3 is updated daily. Automated updates based on this endpoint are recommended.

## Cloud vs Enterprise Scenarios

### Managed Cloud Services

When using Managed Cloud Services, you need to configure your firewall to allow:

1. **Outbound access** to platform services (DNS allowlisting above)
2. **Inbound access** from platform egress IPs when the platform needs to access your storage, container registries, etc.

Allow access from the egress IPs listed at [https://meta.enterprise-cloud-platform.com/v3](https://meta.enterprise-cloud-platform.com/v3) to reach your internal resources.

### Self-Hosted Enterprise

For self-hosted Enterprise deployments, different rules apply since the services run in your environment.

## Self-Hosted Enterprise Setup

If you are self-hosting the Enterprise Platform, ensure the following connections are permitted.

### License Validation

Allow access to the license server at:

```
licenses.enterprise-cloud-platform.com:443
```

### Data Services and Other Plugins

Data services and other plugins include built-in license checks. The compute environment running distributed pipelines must be allowed outbound network access to the license server:

```
licenses.enterprise-cloud-platform.com:443
```

### Interactive Workspaces

For self-hosted Interactive Workspaces, no additional firewall rules are required since they run in your environment.

For workspace architecture and networking details, refer to the official documentation.

## Build Service Configuration

### Self-Hosted Build Service

If you're using a self-hosted build service, no firewall configuration is needed as it runs in your environment.

For installation details, see the official documentation.

### Managed Build Service

If you're using a managed build service ([`build.enterprise-cloud-platform.com`](https://build.enterprise-cloud-platform.com)) and want it to mirror or freeze images to your registry, allow access to the egress IPs listed at [https://meta.enterprise-cloud-platform.com/v3](https://meta.enterprise-cloud-platform.com/v3) on port 443.

## Restricting Outbound Traffic

If you're locking down outbound traffic from your Enterprise instance, ensure your firewall allows egress to the following endpoints on port `443`:

**Required Services:**
- `licenses.enterprise-cloud-platform.com` - For license validation
- `build.enterprise-cloud-platform.com` - If using managed build services

**Pipeline Dependencies:**
Distributed pipelines need to download plugins and other resources from GitHub:
- `github.com`
- `api.github.com`
- `raw.githubusercontent.com`

**Third-Party Code Repositories:**
Allow access to any other code repositories you use to host your distributed pipelines, such as GitLab, Bitbucket, Artifactory, etc.

---

By following the guidelines in this blog post, you can ensure that your Cloud and Enterprise installations are properly configured to communicate with necessary services while maintaining security through firewall rules. Regularly review and update your firewall settings based on the dynamic IP lists provided to keep your environment secure and functional.
