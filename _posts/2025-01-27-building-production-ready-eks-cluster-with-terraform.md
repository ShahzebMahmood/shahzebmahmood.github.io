---
layout: post
title: "My Journey Building an EKS Cluster: The Struggles, Breakthroughs, and Lessons Learned"
date: 2025-09-17 10:00:00 -0000
categories: [Personal, DevOps, Learning, AWS]
tags: [EKS, Terraform, Learning, Challenges, Growth]
---

# My Journey Building an EKS Cluster: The Struggles and Breakthroughs

When I decided to build a complete EKS cluster from scratch, I had no idea what I was getting into. Sure, I'd worked with Docker and had some Kubernetes experience, but even with that background, I found myself overthinking and over-engineering the solution. In hindsight, for a simple app like this, Kubernetes was probably overkill—running it on EC2 with Docker would have been more cost-effective and efficient.

I set out wanting to build something real—deploy a Node.js app to AWS using EKS, but not just as a quick demo. I wanted to do it the right way, with all the security, monitoring, and production-grade features that make something feel “finished.” What I didn’t expect was just how overwhelming that would feel. “Doing it properly” meant diving into a dozen different technologies, each with its own learning curve, and trying to make them all work together.

There were days I felt completely lost, frustrated, and honestly, a bit defeated. The constant context-switching and the pressure to get every detail right started to take a toll—not just on my time, but on my confidence. It’s easy to underestimate how much this kind of project can wear you down, especially when you care about doing it well.

After weeks of work, I ended up with:
- **Infrastructure as Code**: Terraform modules that actually work (after many iterations)
- **EKS Cluster**: Auto-scaling Kubernetes that doesn't break
- **CI/CD Pipeline**: GitHub Actions that sometimes work on the first try
- **Security**: Multiple layers I'm still learning about
- **Monitoring**: CloudWatch dashboards with useful information
- **Cost Control**: A setup that won't bankrupt me (hopefully)

## The Major Struggles

One of the biggest challenges I faced was setting up a GitHub Action to automate the entire deployment process—from code commit to a live app running on EKS. At first, I underestimated how complex this would be. It quickly became clear that managing Terraform state remotely was essential for reliable, repeatable deployments. This realization only hit me after several failed attempts and confusing errors, forcing me to rethink my workflow and integrate remote state management into the pipeline.

## The Breakthrough Moments

### 1. CI/CD Magic
The first time I pushed code and saw it automatically deploy to my cluster - that's when I felt like a real DevOps engineer. Watching the workflow complete and seeing my app live in minutes was pure satisfaction.

## Security: The Hard Way

One thing I love is security, but making something secure isn’t always efficient and can sometimes hinder the application. Security was the most intimidating part for me—I didn’t realize how many layers there were to consider. It’s all about balancing risk and accepting that some aspects may never be perfectly secure.

There’s always a trade-off!

### Container Security
Every line in a Dockerfile is a potential vulnerability. The non-root user, security audits, health checks - each serves a purpose I didn't initially understand.

```dockerfile
# This took me forever to get right
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs
```

### Kubernetes Security
Pod Security Standards, Network Policies, RBAC - I felt like I was learning a new language. Security in Kubernetes isn't optional - it needs to be designed in from the beginning.

### AWS IAM
Getting the right permissions without over-privileging was a constant battle. Understanding least privilege isn't just a best practice - it's a survival skill in the cloud.

## The Application: The Easy Part (Sort Of)

The Node.js application was the easiest part, but even here I learned that "simple" doesn't mean "basic."

### Security Headers
I initially thought security headers were nice-to-have. Then I learned about XSS attacks, clickjacking, and MIME type sniffing.

```javascript
// These few lines took me hours to research
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('Content-Security-Policy', "default-src 'self'")
  next()
})
```

### Health Checks
Health checks seemed trivial until I realized how critical they are for Kubernetes. The difference between `/health` and `/ready` endpoints was something I had to learn the hard way.

## Kubernetes Configuration

Kubernetes YAML files are deceptively simple. You write a few files, and everything should work, right? Wrong.

### Kustomize Saved My Sanity
Managing different environments was a nightmare until I discovered Kustomize. Understanding overlays was like learning a new programming language, but once I got it, I couldn't imagine managing Kubernetes without it.

### CI/CD: The Automation Dream
Getting GitHub Actions to work was like conducting an orchestra where every musician played a different song. But when it finally worked, it was a relief.

Understanding workflows, jobs, steps, and secrets was overwhelming. The feeling of pushing code and watching it automatically deploy was incredible.

## Monitoring: The Afterthought

I initially thought monitoring was something you add at the end. Boy, was I wrong. Understanding what's happening in your infrastructure is crucial.

Setting up CloudWatch dashboards seemed straightforward until I realized I had no idea what metrics were actually important. Not all metrics are created equal.

## The Cost Reality Check

Every time I ran `terraform apply`, I was holding my breath, wondering if I was about to create something expensive. Setting up billing alerts was one of the first things I did after my first deployment.

## What I Wish I Knew Before Starting

What I wish I knew earlier is the importance of building with a clear purpose, and understanding the value each piece of software brings to a specific part of the project. Choosing the right tool for the right job makes everything smoother and more maintainable in the long run.

## The Emotional Rollercoaster

### The Highs
- First successful deployment
- When Terraform modules finally clicked
- Getting CI/CD to work automatically
- Security breakthrough with IAM roles

### The Lows
- Terraform state conflicts: always use a remote state file when running actions to avoid headaches.
- Endless hours debugging Kubernetes networking issues.
- Cryptic IAM permission errors that seemed impossible to trace.
- Constant cost anxiety: this was a big one; that's why I created a `destroy.yaml` to quickly tear down infrastructure when needed.

## What This Project Taught Me

**Technical Skills**: Terraform requires discipline, Kubernetes is more complex than I thought, security is a never-ending learning process, and automation is hard but worth it.

**Soft Skills**: Persistence when I wanted to give up, breaking down complex problems, documenting what I learned, and realizing that sometimes help is hard to find and documentation can be lacking. You have to experiment, make mistakes, and keep trying until you find what works.

There are times when you just don't know, and even if you have the knowledge, it can be hard to put it into practice, which I don't think many people realize how difficult it is to put what on your mind to paper.

## The Final Result

After weeks of work, I had a working EKS cluster that deploys automatically, scales based on demand, monitors itself, costs less than $5/month, and follows security best practices.

But more importantly, I learned how to build production-ready infrastructure from scratch. The knowledge gained has been invaluable.

## Would I Do It Again?

Honestly, I wouldn't choose to do it again for a simple project like this. Building the EKS cluster was a challenging and time-consuming process, and in hindsight, it was overkill for my needs, even if I wanted to showcase my skills. It's important to clearly understand the purpose and desired outcome before committing to such a complex solution.

Start simple, be patient with yourself and just keep trying.

Thank you for reading all the way to the end, I know this was a long one!

---
