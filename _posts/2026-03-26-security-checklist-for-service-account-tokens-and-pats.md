---
layout: post
title: "Security Checklist for Service Account Tokens and PATs"
description: "A practical security checklist for managing service account tokens and GitHub PATs in DevOps workflows."
date: 2026-03-26 09:20:00 -0400
categories: [Security, DevOps]
tags: [security, devops, github, pat, credentials, least-privilege, incident-response]
pin: false
---

Most token incidents I have dealt with were not sophisticated attacks. They came from basic things like old PATs nobody owned, overly broad scopes, and credentials sitting in too many places.

So this is the system I follow now for service account tokens and GitHub PATs.

## One token, one purpose, one owner

I do not like shared team tokens. If one credential is used by multiple systems, you lose accountability fast.

I keep it simple:

- one token per service account
- one token per org when needed
- one clear owner

If I cannot identify the owner, I assume it is risky and replace it.

## Least privilege every time

Before I create or approve a token, I ask if write access is really required. Most of the time, it is not.

If broader access is unavoidable, I set an expiry and create a follow-up to tighten scope. Temporary access should actually be temporary.

## Store it properly and name it properly

I only store tokens in a managed secret vault. Not local notes, not chat, not random docs.

I also stick to a naming format like `{service-account} - {org/service} PAT`. Consistent names make rotations and audits way less painful.

## Track token metadata like it matters

For each token I want creation date, expiry date, scope, owner, and last rotation date. Missing metadata is usually a sign that the token is already out of control.

## Rotate on schedule, not just after a scare

If rotation only happens after incidents, you are already behind.

My baseline:

- high-risk tokens: monthly
- medium-risk tokens: every 60-90 days
- low-risk read-only tokens: quarterly or semi-annually

After rotation, I always validate the workload still works. Rotation without validation is fake safety.

## Be ready to revoke fast

When something goes wrong, I do not want a long process doc. I want quick answers:

- who revokes it
- where it is stored
- what breaks when it is revoked
- how we confirm recovery

Speed matters during incidents.

## Final thought

Good token security is mostly discipline. Clear ownership, least privilege, and regular rotation prevent most of the avoidable mess.

If I cannot trace a credential to an owner, scope, and expiry date, I treat it like it is compromised.

## Related Posts

- [GitHub Actions Security Hardening - What I Actually Use](/posts/github-actions-security-hardening-what-i-use/)
- [Bug Bounties as a Hobby](/posts/bug-bounties-as-a-hobby/)
- [How to Purge Cloudflare Cache When Your CDN Serves Stale Files](/posts/how-to-purge-cloudflare-cache-when-your-cdn-serves-stale-files/)
