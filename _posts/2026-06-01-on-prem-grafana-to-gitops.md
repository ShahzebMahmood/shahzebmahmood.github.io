---
layout: post
title: "On-Prem Grafana to GitOps: Migrating Dashboards as Code"
description: "A deep dive into migrating a large set of on-prem dashboards to a GitOps workflow using the Grafana Operator."
date: 2026-06-01 10:00:00 -0400
categories: [Observability, GitOps]
tags: [grafana, kubernetes, gitsync, observability, infrastructure-as-code, devops]
---

Manual dashboard management in Grafana often leads to configuration drift. In a recent initiative, I tackled the migration of over 50 legacy dashboards from an on-prem instance to a modern, GitOps-driven architecture.

The objective was clear: every dashboard must be defined in Git, managed as a Kubernetes Custom Resource (CRD), and synchronized automatically.

## The Strategy: Custom Resource Management

The **Grafana Operator** was utilized to manage the instances. Instead of manual updates via the UI, dashboards are now defined as GrafanaDashboard objects.

**Example Dashboard CRD:**
```yaml
apiVersion: grafana.integreatly.org/v1beta1
kind: GrafanaDashboard
metadata:
  name: platform-overview
  namespace: monitoring
spec:
  instanceSelector:
    matchLabels:
      dashboards: "true"
  configMapRef:
    name: platform-overview-json
    key: dashboard.json
```

## Challenges: Schema Versioning and Cleanup

The primary technical hurdle was **schema migration**. The legacy instance was running an older version of Grafana, and several panel types had been deprecated in the target v10 environment.

1. **Extraction:** The Grafana API was used to bulk-export all dashboard JSON definitions.
2. **Sanitization:** Environment-specific IDs (uid, id, datasource references) were stripped to ensure portability.
3. **Validation:** A linter was used to identify schema errors prior to deployment.
4. **Pruning:** During the audit, multiple obsolete dashboards were identified and decommissioned rather than migrated.

## Continuous Sync with GitOps

To maintain parity, a GitOps approach using git-sync was implemented.

- **Source Control:** Raw JSON files are stored in a dedicated repository.
- **Synchronization:** A sidecar process monitors the repository and pulls updates periodically.
- **Automation:** Changes are automatically reflected as ConfigMaps which the Operator then applies to the Grafana instance.

## Benefits of Observability as Code

1. **Auditability:** Git history provides a clear record of who modified a panel and why.
2. **Resilience:** In a disaster recovery scenario, the entire dashboard suite can be restored in seconds by applying the stored manifests.
3. **Consistency:** Global variables for data sources ensure dashboards work seamlessly across Development, Staging, and Production environments.

## Conclusion

This migration was about more than just moving files; it was a shift in operational philosophy. Observability is now a first-class citizen in the deployment pipeline, ensuring that monitoring infrastructure is as versioned and resilient as the code it tracks.
