---
title: "Setting up Amazon CloudWatch in EKS"
date: 2025-08-03 12:00:00 -0500
categories: [AWS, EKS]
tags: [CloudWatch, EKS]
pin: false
---

## Introduction

Recently I was provided a ticket to troubleshoot why our CloudWatch pods were crash-looping. After investigating the issue, I noticed that the deployment was outdated and had not been updated in years. The deployment was created manually using the DaemonSet and an old version of the CloudWatch agent which is no longer supported or compatible with the current EKS version and node version.

The first thing I did was navigate to the cluster and namespace using the command below to get the current context:

There are two tools I used to do this which make life easier when navigating through clusters and namespaces. These tools are called [kubectx](https://github.com/ahmetb/kubectx) and [kubens](https://github.com/ahmetb/kubectx).

```
kubectx <context>
kubens <namespace>
```

Once I navigated to the namespace, I used another tool called [k9s](https://k9scli.io/) to get a better visual representation of the resources in the namespace. 

```
k9s -n cloudwatch
```

This is where I found that the CloudWatch pods that are on the old Amazon-Linux nodes are failing to start (`CrashLoopBackOff`). This then led me to investigate the deployment and configmaps to ascertain the root cause of the issue. This is what really stopped me in my tracks because I had difficulty figuring out how this was deployed and what the intended configuration was. However, once I checked the [official AWS documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-setup-logs-FluentBit.html), I noticed there is a deployment for DaemonSet which seems to be deprecated and now [AWS Observability](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/install-CloudWatch-Observability-EKS-addon.html) is the recommended way of deploying the CloudWatch agent and Fluent Bit.

I decided to take the Helm chart approach as it would probably make the deployment and management easier and more configurable for our use case.

## What I implemented
 My manager mentioned it would have been better if I had created a more detailed design document. While I did create one initially, I realized I didn't have much context for the CloudWatch agent and Fluent Bit. So after a bit of research, I decided to do a test deployment in our dev environment. 

 So this was my thought process:
 - GitOps deployment
 - Kustomize and since I can use patching which will be needed due to the AWS Helm chart being strict.
 - Helm chart for easier deployment and management
 - Testing in a development environment

 I created a new directory in our git repo called `test`, then I created a base directory and two files: one called `kustomization.yaml` and a base `values.yaml` file. Since I was testing in dev, my understanding was that by adding a base configuration, I could deploy it to different environments using an ApplicationSet. The `{{ .Values.cluster }}` template variable in the values file would be replaced with the correct cluster name for each environment.

 The base directory will handle the Helm chart deployment and configuration. This will span all environments we need to deploy to.

<details>
<summary>base/kustomization.yaml</summary>

```yaml
---
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources: []

helmCharts:
  - name: amazon-cloudwatch-observability
    repo: https://aws-observability.github.io/helm-charts
    version: 4.3.1
    releaseName: amazon-cloudwatch-observability
    namespace: amazon-cloudwatch
    valuesInline:
      clusterName: "{{ .cluster }}"
      region: <AWS_REGION>
      containerLogs:
        enabled: true
        fluentBit:
          resources:
            requests:
              memory: 128Mi
              cpu: 250m
            limits:
              memory: 512Mi
              cpu: 500m
      agent:
        name: cloudwatch-agent
        mode: daemonset
        replicas: 1
        resources:
          requests:
            memory: 128Mi
            cpu: 250m
          limits:
            memory: 512Mi
            cpu: 500m
        serviceAccount:
          name: cloudwatch-agent
          annotations:
            eks.amazonaws.com/role-arn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/<EKS_ROLE_NAME>
        defaultConfig:
          agent:
            region: <AWS_REGION>
          logs:
            metrics_collected:
              kubernetes:
                cluster_name: "{{ .cluster }}"
                enhanced_container_insights: true
                force_flush_interval: 30
                metrics_collection_interval: 300
              application_signals:
                hosted_in: "{{ .cluster }}"
          metrics:
            namespace: CWAgent
            metrics_collected:
              cpu:
                measurement:
                  - name: cpu_usage_idle
                    rename: CPU_USAGE_IDLE
                    unit: Percent
                  - name: cpu_usage_iowait
                    rename: CPU_USAGE_IOWAIT
                    unit: Percent
                  - name: cpu_usage_user
                    rename: CPU_USAGE_USER
                    unit: Percent
                  - name: cpu_usage_system
                    rename: CPU_USAGE_SYSTEM
                    unit: Percent
                metrics_collection_interval: 60
          traces:
            traces_collected:
              application_signals: {}
      dcgmExporter:
        enabled: false
      neuronMonitor:
        enabled: false
      tolerations:
        - operator: Exists
      updateStrategy:
        type: RollingUpdate
        rollingUpdate:
          maxUnavailable: 1
          maxSurge: 1
    includeCRDs: true

patches:
  # Patch FluentBit DaemonSet with correct environment variables
  - target:
      kind: DaemonSet
      name: fluent-bit
      namespace: amazon-cloudwatch
    patch: |-
      - op: replace
        path: /spec/template/spec/containers/0/env/0/value
        value: <AWS_REGION>
      - op: replace
        path: /spec/template/spec/containers/0/env/1/value
        value: "{{ .cluster }}"
  # Patch ServiceAccounts with IAM role
  - target:
      kind: ServiceAccount
      name: amazon-cloudwatch-observability-controller-manager
      namespace: amazon-cloudwatch
    patch: |-
      - op: add
        path: /metadata/annotations
        value:
          eks.amazonaws.com/role-arn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/<EKS_ROLE_NAME>

```
</details>

<details>
<summary>base/values.yaml</summary>

```yaml
---
# Values for Amazon CloudWatch Observability Helm Chart
# This file structure must match the chart's values.yaml format

# Cluster configuration
clusterName: "{{ .Values.cluster }}" 
region: <AWS_REGION>

# Container logs configuration
containerLogs:
  enabled: true
  fluentBit:
    resources:
      requests:
        memory: 128Mi
        cpu: 250m
      limits:
        memory: 512Mi
        cpu: 500m

# CloudWatch agent configuration
agent:
  name: cloudwatch-agent
  mode: daemonset
  replicas: 1
  resources:
    requests:
      memory: 128Mi
      cpu: 250m
    limits:
      memory: 512Mi
      cpu: 500m
  serviceAccount:
    name: cloudwatch-agent

  defaultConfig:
    agent:
      region: <AWS_REGION>
    logs:
      metrics_collected:
        kubernetes:
          enhanced_container_insights: true
          force_flush_interval: 30
          metrics_collection_interval: 300
        application_signals: {}
    traces:
      traces_collected:
        application_signals: {}

# Disable GPU monitoring (only needed for NVIDIA GPU nodes)
dcgmExporter:
  enabled: false

# Disable Neuron monitoring (only needed for Inferentia/Trainium nodes)
neuronMonitor:
  enabled: false

# Tolerations
tolerations:
  - operator: Exists

# Update strategy
updateStrategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1

```
</details>

The above code is generic and can be customized for specific environments by overriding the values in the respective environment's `values.yaml` file. Just a note I found out the hard way is that the AWS observability Helm chart is strict - something like `clusterName` will need to be patched to the correct name in the `kustomization.yaml` file for each environment.

<details>
<summary>Environment-specific kustomization example</summary>

```yaml
---
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

patches:
  - target:
      kind: AmazonCloudWatchAgent
      name: cloudwatch-agent
      namespace: cloudwatch
    patch: |-
      - op: replace
        path: /spec/config
        value: '{"agent":{"region":"<AWS_REGION>"},"logs":{"metrics_collected":{"application_signals":{"hosted_in":"<ENVIRONMENT>"},"kubernetes":{"cluster_name":"<ENVIRONMENT>","enhanced_container_insights":true,"force_flush_interval":30,"metrics_collection_interval":300}}},"metrics":{"namespace":"CWAgent","metrics_collected":{"cpu":{"measurement":[{"name":"cpu_usage_idle","rename":"CPU_USAGE_IDLE","unit":"Percent"},{"name":"cpu_usage_iowait","rename":"CPU_USAGE_IOWAIT","unit":"Percent"},{"name":"cpu_usage_user","rename":"CPU_USAGE_USER","unit":"Percent"},{"name":"cpu_usage_system","rename":"CPU_USAGE_SYSTEM","unit":"Percent"}],"metrics_collection_interval":60}}},"traces":{"traces_collected":{"application_signals":{}}}}'
---
```
</details>

This just works for me and my work, yours could be different.

Once I had these configured and ready, well to be frank, I was not sure if what I had configured was correct, so I guess it had to be trial by fire and just deploy and see what happens.

So I went ahead and created an ApplicationSet and AppProject within the same file. These are what we use to deploy and create the app in our deployment interface.

## Deployment

One thing most developers or even tech people underestimate is the fear and caution one has when deploying an app or change to any environment. This is where I would check, check, and check again. I asked for help; however, I would still be hesitant to apply this to the cluster.

In the end, I did press enter and the app was deployed. I saw the notification on our communication platform stating it was created. I navigated to our deployment interface and checked—it was there in an unknown state. This is where I noticed the error `.Values.clusterName is required` which is due to the Helm chart being so strict. I fixed this with the patching solution and did a `sync`, which created everything successfully.

My next issue was a permission problem with the EKS role I specified. I had made an error in the IAM role configuration—once that was corrected, everything was fixed and sending to CloudWatch properly. Since I'm paranoid, I double-checked in AWS CloudWatch and confirmed metrics and logs were being sent. Simple mistake but something that's easily overlooked.

Boom! Everything was working as intended. The joy and relief of not breaking anything is a great feeling.

## Lessons Learned
In tech there's not much help, and even if you do ask, it's often met with disdain or seen negatively, especially at work where most people want to do their job and go home, which you can't fault them for. However, one thing I want to do is not just follow the status quo. For this task, I created a guide and put it on our internal documentation so it can help other junior workers. I do think that if we had more interactions and less judgment as tech folk, we would increase our skills and level even more. 

Testing in dev is a must. I did break the deployment a few times, but I learned from it and fixed it. I think I learned more from my testing than from anyone telling me what to do. 

Even though our work is hard and stressful, it's just work at the end of the day and shouldn't consume your life. It took me a while to get this task completed—maybe someone could have done it quicker and better.

If you work in DevOps or any tech role, the best thing you can do is try, try, and try again because at the end of the day you will learn more from doing it yourself than from anyone telling you what to do.

If you got this far, thanks for reading this blog post. I hope you found it useful or at least entertaining. 