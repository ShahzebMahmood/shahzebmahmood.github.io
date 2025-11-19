---
layout: post
title: "Working with ArgoCD ApplicationSets: Making Changes in GitHub and Testing"
date: 2025-09-30 10:00:00 -0000
categories: [DevOps, Kubernetes, ArgoCD]
tags: [ArgoCD, ApplicationSet, GitOps, Kubernetes, Testing, GitHub]
pin: false
---

# Working with ArgoCD ApplicationSets: Making Changes in GitHub and Testing

When I first started working with ArgoCD ApplicationSets, I thought it would be straightforward. You make changes in GitHub, push them, and ArgoCD syncs everything automatically. What could be simpler? Well, as it turns out, a lot of things.

## The Challenge

The real challenge isn't just making changes in GitHub; it's making changes safely. How do you test your changes before they hit production? How do you know your ApplicationSet configuration is correct? How do you build confidence that your changes won't break everything?

I learned this the hard way when I was setting up CloudWatch monitoring across multiple environments. I created an ApplicationSet that would deploy to different clusters, but I didn't have a good testing strategy. I was making changes, pushing to GitHub, and hoping for the best. That's not a sustainable approach.

## What Are ApplicationSets?

ApplicationSets are ArgoCD's way of managing multiple applications from a single configuration. Instead of manually creating an ArgoCD Application for each environment, you define an ApplicationSet that generates applications based on a template and a list of parameters.

For example, if you need to deploy the same application to dev, staging, and production environments, you can create one ApplicationSet that generates three ArgoCD Applications, one for each environment.

## The Workflow

Here's how I approach making changes with ApplicationSets:

### 1. Start with a Test Environment

Before making any changes to production, I always test in a development or test environment. This might seem obvious, but it's easy to skip this step when you're in a hurry.

I create a separate branch in GitHub specifically for testing:

```bash
git checkout -b test/application-set-changes
```

### 2. Make Your Changes

Let's say I'm updating an ApplicationSet configuration. I'll modify the YAML file, making sure to test the syntax:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-applicationset
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - cluster: dev
            url: https://dev-cluster.example.com
          - cluster: staging
            url: https://staging-cluster.example.com
          - cluster: prod
            url: https://prod-cluster.example.com
  template:
    metadata:
      name: '{{cluster}}-my-app'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/myrepo
        targetRevision: main
        path: k8s/base
      destination:
        server: '{{url}}'
        namespace: my-namespace
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

## Using Template Patches

I recently discovered template patches in ApplicationSets, and they've been a game-changer for managing environment-specific configurations. Template patches allow you to modify the generated Application resources based on different generator values, which is perfect when you need slight variations between environments.

### What Are Template Patches?

Template patches let you apply JSON patches to the generated Application resources. This is incredibly useful when you need to customize certain fields for different environments without duplicating your entire template.

### My Experience with Template Patches

When I was setting up CloudWatch monitoring across multiple clusters, I needed different configurations for dev, staging, and production. Initially, I was creating separate ApplicationSets for each environment, which was tedious and hard to maintain.

Then I discovered template patches. Instead of managing multiple ApplicationSets, I could use one ApplicationSet with patches that modify the generated applications based on the environment.

### Example: Using Template Patches

Here's an example of how I use template patches in my ApplicationSet:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: cloudwatch-monitoring
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - cluster: dev
            url: https://dev-cluster.example.com
            retention: 7
          - cluster: staging
            url: https://staging-cluster.example.com
            retention: 14
          - cluster: prod
            url: https://prod-cluster.example.com
            retention: 30
  template:
    metadata:
      name: '{{cluster}}-cloudwatch'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/myrepo
        targetRevision: main
        path: k8s/base
      destination:
        server: '{{url}}'
        namespace: amazon-cloudwatch
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
  templatePatch: |
    - op: replace
      path: /spec/source/helm/values
      value: |
        clusterName: "{{cluster}}"
        retention: {{retention}}
    - op: add
      path: /metadata/annotations/retention-days
      value: "{{retention}}"
```

### Common Use Cases for Template Patches

I've found template patches particularly useful for:

1. **Environment-Specific Values**: Different resource limits, retention periods, or configuration values per environment
2. **Adding Annotations**: Adding metadata or annotations that vary by environment
3. **Modifying Sync Policies**: Different sync policies for dev vs production
4. **Customizing Destination**: Different namespaces or server configurations

### A Real Example from My Work

Here's a real example I used recently for CloudWatch monitoring:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: cloudwatch-observability
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - cluster: dev-cluster
            region: us-east-1
            logRetention: 7
          - cluster: prod-cluster
            region: us-east-1
            logRetention: 30
  template:
    metadata:
      name: '{{cluster}}-cloudwatch'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/infrastructure
        targetRevision: main
        path: k8s/cloudwatch/base
      destination:
        server: https://kubernetes.default.svc
        namespace: amazon-cloudwatch
  templatePatch: |
    - op: replace
      path: /spec/source/helm/values
      value: |
        clusterName: "{{cluster}}"
        region: "{{region}}"
        logs:
          retention: {{logRetention}}
        agent:
          resources:
            limits:
              memory: 512Mi
              cpu: 500m
```

### Tips for Using Template Patches

1. **Test Incrementally**: Start with one patch operation and test it before adding more
2. **Validate JSON Path**: Make sure your JSON path is correct. I use `kubectl get application -o jsonpath` to verify paths
3. **Watch for Type Errors**: Remember that patch values need to match the expected type (string, number, object, etc.)
4. **Use Dry Run**: Always test with `kubectl apply --dry-run=client` first

### The Learning Curve

Template patches took me some time to get right. The JSON patch syntax can be tricky, especially when you're dealing with nested objects or arrays. But once I understood the structure, it made managing multi-environment deployments so much easier.

The key is to start simple and build up. Start with a single patch operation, test it, and then add more complexity as needed.

### 3. Validate Your Configuration

Before pushing, I validate the YAML syntax:

```bash
# Check YAML syntax
yamllint my-applicationset.yaml

# Or use kubectl to validate
kubectl apply --dry-run=client -f my-applicationset.yaml
```

### 4. Test in a Safe Environment

I apply the changes to a test environment first:

```bash
# Apply to test cluster
kubectl apply -f my-applicationset.yaml --context=test-cluster

# Watch the ApplicationSet create the applications
kubectl get applicationset -n argocd -w
```

### 5. Verify the Generated Applications

After the ApplicationSet creates the applications, I verify they're correct:

```bash
# List all applications created by the ApplicationSet
kubectl get applications -n argocd -l app.kubernetes.io/name=my-applicationset

# Check the status of each application
kubectl get applications -n argocd -o wide
```

### 6. Test the Sync

I manually trigger a sync to make sure everything works:

```bash
# Sync a specific application
argocd app sync dev-my-app

# Or sync all applications from the set
kubectl get applications -n argocd -l app.kubernetes.io/name=my-applicationset -o name | xargs -I {} argocd app sync {}
```

## Testing Strategy

One thing I've learned is that testing ApplicationSets requires a different mindset than testing regular applications. You're not just testing the application itself; you're testing the generator logic and the template.

### Unit Testing the Template

I try to think of ApplicationSets like code. The template is the logic, and the generator provides the data. I test the template by:

1. **Manual Calculation**: I manually calculate what applications should be generated
2. **Dry Run**: I use `kubectl apply --dry-run` to see what would be created
3. **Incremental Testing**: I test with one generator element first, then add more

### Integration Testing

Once I'm confident the template is correct, I test the full workflow:

1. **Apply the ApplicationSet**: Create the ApplicationSet in ArgoCD
2. **Verify Generation**: Check that the correct number of applications are created
3. **Check Application Specs**: Verify each application has the correct configuration
4. **Test Sync**: Manually sync one application to ensure it works
5. **Monitor Sync Status**: Watch the sync process and check for errors

## Common Pitfalls

Here are some issues I've encountered and how I avoid them:

### 1. Template Variable Errors

**Problem**: ApplicationSet fails to generate applications because of incorrect template variables.

**Solution**: Always validate your template variables match what the generator provides. Use `kubectl get applicationset -o yaml` to see what ArgoCD is actually generating.

### 2. Sync Policy Issues

**Problem**: Applications sync automatically when you don't want them to, or they don't sync when you do want them to.

**Solution**: Be explicit about your sync policies. I always set `prune: true` and `selfHeal: true` explicitly, even though they might be defaults.

### 3. Multi-Environment Conflicts

**Problem**: Changes meant for one environment affect others.

**Solution**: Use separate branches or separate ApplicationSets for different environments. I prefer separate ApplicationSets because they're easier to manage and debug.

### 4. GitHub Webhook Issues

**Problem**: Changes pushed to GitHub don't trigger ArgoCD sync.

**Solution**: Always verify your webhook configuration. Test it by making a small change and watching the ArgoCD logs.

## Making Changes Safely

The most important lesson I've learned is that you need a process for making changes safely. Here's my workflow:

1. **Create a Feature Branch**: Never make changes directly to main/master
2. **Test Locally**: Validate your YAML and test the logic
3. **Test in Dev**: Apply to a development environment first
4. **Review Changes**: Use `kubectl diff` or `argocd app diff` to see what will change
5. **Create a PR**: Get someone else to review if possible
6. **Merge Carefully**: Only merge when you're confident
7. **Monitor After Deployment**: Watch the sync status after changes are applied

## The GitHub Workflow

Here's how I handle the GitHub side of things:

### Before Making Changes

```bash
# Pull latest changes
git pull origin main

# Create a feature branch
git checkout -b feature/update-applicationset

# Make your changes
# ... edit files ...

# Commit with a clear message
git add .
git commit -m "Update ApplicationSet to add new environment"
```

### Testing Locally

```bash
# Validate YAML
yamllint applicationset.yaml

# Dry run
kubectl apply --dry-run=client -f applicationset.yaml
```

### After Testing

```bash
# Push to GitHub
git push origin feature/update-applicationset

# Create a pull request
# ... review process ...

# After merge, ArgoCD will pick up the changes automatically
```

## Building Confidence

One thing most developers or even tech people underestimate is the fear and caution one has when deploying an app or change to any environment. This is where I would check, check, and check again.

Even when I ask for help, I'm still hesitant to apply changes to the cluster. This is actually a good thing. It means I'm taking the responsibility seriously. But it can also be paralyzing if you're not careful.

The way I build confidence is through:

1. **Incremental Changes**: Make small changes and test each one
2. **Clear Rollback Plan**: Always know how to undo your changes
3. **Monitoring**: Watch everything closely after making changes
4. **Documentation**: Write down what you're doing and why

## Lessons Learned

Working with ArgoCD ApplicationSets has taught me several valuable lessons:

1. **GitOps is Powerful, But Requires Discipline**: The automation is great, but you need to be careful about what you commit.

2. **Testing is Essential**: You can't just push changes and hope for the best. You need a testing strategy.

3. **Documentation Matters**: Write down your ApplicationSet configurations and why you made certain decisions. Future you will thank you.

4. **Start Simple**: Don't try to create complex ApplicationSets from the start. Start simple and add complexity as needed.

5. **Monitor Everything**: Watch your applications after making changes. ArgoCD provides great visibility into what's happening.

## The Reality

The reality is that working with ApplicationSets, making changes in GitHub, and testing those changes is a skill that takes time to develop. You'll make mistakes, you'll break things, and you'll learn from each mistake.

But the more you practice, the more confident you become. The more you test, the better you understand how things work. And the more you document, the easier it becomes to maintain and improve your setup.

If you're just starting with ApplicationSets, my advice is simple: start small, test everything, and don't be afraid to make mistakes. That's how you learn.

Thank you for reading, and happy GitOps-ing!

