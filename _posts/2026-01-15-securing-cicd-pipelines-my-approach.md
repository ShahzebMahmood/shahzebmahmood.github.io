---
layout: post
title: "My Approach to Securing CI/CD Pipelines (And Why I Stopped Focusing Just on Speed)"
description: "My journey from focusing on speed to embedding security into CI/CD pipelines, with practical tips for GitHub Actions."
date: 2026-04-15 09:00:00 -0500
categories: [DevOps, Security]
tags: [cicd, security, github-actions, devsecops, best-practices]
pin: false
---

# My Approach to Securing CI/CD Pipelines (And Why I Stopped Focusing Just on Speed)

For a long time, my main focus with CI/CD was speed. How fast can I get code from a commit to production? It was all about automation and efficiency. Security felt like a separate step, something to be handled by a different team or just bolted on at the end. 

That mindset changed recently after a close call. I realized that a leaked development key almost made it into a production build. It was a huge wake-up call that forced me to step back and realize the pipeline itself is a critical piece of infrastructure that needs to be secured just as much as the app.

Shifting to a DevSecOps mindset wasn't easy for me. It's not just about throwing security tools at the pipeline; it's about building security into the process without making developers want to pull their hair out. Here’s how I approach it now.

## How I Break Down Pipeline Security

I decided to break down pipeline security into a few main areas. 

### 1. Source Code Management (SCM)

Everything starts with the repo. If someone gets into your SCM, it's game over.

-   **Branch Protection:** I always make sure main/master branches are protected. Requiring pull requests and status checks to pass is non-negotiable for me now.
-   **Secret Scanning:** I rely heavily on tools like GitHub's secret scanning. It automatically detects leaked credentials in the code, and honestly, it’s a safety net that has saved me more than once.
-   **Code Scanning (SAST):** I started integrating tools like CodeQL or Snyk directly into the PR process. This gives us immediate feedback.

```yaml
{% raw %}
# A simple GitHub Actions workflow with CodeQL I use
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: ${{ matrix.language }}

# ... build steps ...

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v3
{% endraw %}
```

### 2. The Build Environment

The environment where your code is built and tested is a prime target.

-   **Dependency Scanning (SCA):** Your application is only as secure as its weakest dependency. Use tools like Dependabot, Snyk, or Trivy to scan for known vulnerabilities in your libraries. Automate PRs to update vulnerable packages.
-   **Secure Base Images:** Don't use `latest` tags for Docker images. Use specific, minimal base images (like `distroless` or `alpine`) and scan them for vulnerabilities. A smaller image has a smaller attack surface.
-   **Ephemeral and Isolated Builds:** Each build should run in a clean, isolated environment that is destroyed afterward. This prevents state from one build from leaking into another.

### 3. Artifact Management

The output of your build—a container image, a JAR file, etc.—needs to be protected.

-   **Use a Secure Registry:** Store artifacts in a private, secure registry like ECR, GCR, or Artifactory.
-   **Sign Your Artifacts:** Use tools like Cosign to sign container images. This allows you to verify the integrity and origin of an image before deploying it, preventing tampering.
-   **Immutable Tags:** Use immutable tags for container images (e.g., the git SHA) instead of mutable tags like `latest`. This ensures you are deploying exactly the version you tested.

```bash
# Example: Scanning an image with Trivy before pushing
trivy image my-app:${{ github.sha }}

# Example: Signing an image with Cosign
cosign sign --key cosign.key my-app:${{ github.sha }}
```

### 4. Deployment

The final step is getting your application into production.

-   **Secrets Management:** Never store secrets in Git. Use a proper secrets manager like AWS Secrets Manager, HashiCorp Vault, or GitHub's encrypted secrets. Inject them into the environment at runtime.
-   **Least Privilege for Deployments:** The identity your CI/CD pipeline uses to deploy should have the minimum permissions necessary. For Kubernetes, use a dedicated ServiceAccount. For cloud, use a specific IAM role with a narrow policy. OpenID Connect (OIDC) is a game-changer for this, allowing for short-lived, keyless credentials.
-   **Deployment Gating:** Use manual approval steps for production deployments. This provides a final human checkpoint to prevent accidental or malicious deployments.

## What Stuck With Me

-   **Security is a Shift-Left Activity:** The earlier you catch a vulnerability, the cheaper and easier it is to fix. Embedding security in the PR process is the most effective way to do this.
-   **Automation is Your Best Friend:** Don't rely on manual checks. Automate security scanning, dependency updates, and policy enforcement.
-   **It's a Continuous Process:** Security isn't a one-time setup. It's about continuous improvement, monitoring, and adapting to new threats.

Moving to a DevSecOps culture was challenging. It required changing habits and adding new steps to a workflow I thought was already optimized. But the peace of mind that comes from knowing you have multiple layers of defense is worth the effort. It's not about being perfect; it's about being resilient.