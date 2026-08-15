---
layout: post
title: "Self-Hosting Privacy Analytics and a Homelab Command Center on Debian"
description: "How I set up self-hosted Umami analytics with PostgreSQL and built a unified Homepage dashboard to monitor my local homelab services."
date: 2026-08-15 12:00:00 -0400
categories: [DevOps, Homelab]
tags: [homelab, self-hosted, umami, postgresql, docker, debian, privacy, devops]
pin: false
mermaid: true
---

## Why I Replaced Third-Party Analytics with Self-Hosted Umami

When I put together my portfolio and technical writeups on GitHub Pages, I wanted to understand which articles were actually helpful to people. 

At the same time, I really dislike what modern web analytics has turned into: massive JavaScript bundles, intrusive tracking cookies, cross-site profiling, and annoying consent banners. Google Analytics collects far too much personal data, and I did not want my site sending reader information to advertising networks.

I wanted something lightweight, privacy-respecting, and completely under my own control.

Since I already run a low-power Debian micro-server on my home network, hosting **Umami** with a dedicated **PostgreSQL** database was an easy decision. Here is how I set up the tracking pipeline, connected it to my static site, and tied everything together inside a local Command Center dashboard.

## Architecture and Resource Budget

Running analytics on a low-power machine (dual-core Intel i3 with 4GB RAM) means every container has to earn its keep. I set strict memory limits in Docker to make sure database queries or background jobs never starve the rest of the system.

Here is how the setup flows from visitors to my home server:

```mermaid
flowchart TD
    subgraph Visitors["🌐 Static Site Readers"]
        Browser["Reader on shahzebmahmood.github.io"]
    end

    subgraph HomeServer["🐧 Debian Homelab (192.168.2.194)"]
        subgraph AnalyticsStack["🐳 Umami Container Stack"]
            UmamiApp["Umami Analytics App\n(Port 3002 | 180MB RAM limit)"]
            UmamiDB[("🐘 PostgreSQL 15 Database\n(Internal Port 5432 | 150MB RAM limit)")]
        end

        subgraph Dashboard["🎛️ Operations Hub"]
            CommandCenter["Homepage Command Center\n(Port 3005)"]
            Kuma["Uptime Kuma Health Check\n(Port 3001)"]
        end
    end

    Browser -->|Async Beacon /script.js| UmamiApp
    UmamiApp -->|Persist Metrics| UmamiDB
    CommandCenter -->|Service Links & Status| UmamiApp
    Kuma -->|Health Ping| UmamiApp
```

## Docker Compose Setup

Here is the exact service definition I added to my `/opt/personal-ai/docker-compose.yml`:

```yaml
services:
  umami-db:
    image: postgres:15-alpine
    container_name: personal_ai_umami_db
    restart: always
    mem_limit: 150m
    environment:
      - POSTGRES_DB=umami
      - POSTGRES_USER=umami
      - POSTGRES_PASSWORD=umami_secure_local_password
    volumes:
      - /opt/personal-ai/databases/umami:/var/lib/postgresql/data

  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    container_name: personal_ai_umami
    restart: always
    mem_limit: 180m
    ports:
      - "3002:3000"
    environment:
      - DATABASE_URL=postgresql://umami:umami_secure_local_password@umami-db:5432/umami
      - DATABASE_TYPE=postgresql
      - APP_SECRET=replace_with_a_random_32_char_string
    depends_on:
      - umami-db
```

### Why Alpine and Explicit Memory Limits?
1. **Alpine PostgreSQL image**: It starts up fast and stays under 40 MB of RAM when idle.
2. **Hard memory limits**: By capping PostgreSQL at 150 MB and the Node.js Umami container at 180 MB, the server prevents out-of-memory spikes from crashing host services like DNS or SSH.

## Injecting the Tracking Script into Jekyll

Once Umami was running on `http://192.168.2.194:3002`, I logged into the dashboard, registered my website, and generated my tracking ID.

To inject it cleanly across every page of my Jekyll portfolio without editing dozens of markdown posts individually, I added the snippet into `_includes/custom-head.html`:

```html
<!-- Umami Analytics (Home Server) -->
<script defer src="http://192.168.2.194:3002/script.js" data-website-id="0de93f25-d93c-43b2-8df1-b71cb55bb087"></script>
```

Because the script is only around 4.6 KB and loads with `defer`, it has zero impact on page load speed or Core Web Vitals. It does not set cookies, so there is no need for cookie consent banners.

## Building the Command Center Dashboard

Managing half a dozen distinct ports across different tabs quickly gets disorganized. I wanted a single launchpad where I could see all running services at a glance.

I set up **Homepage** (running on port `3005`) and configured `/opt/personal-ai/configs/homepage/services.yaml`:

```yaml
- AI & Intelligence:
    - Ollama AI Engine:
        icon: ollama.png
        href: "http://192.168.2.194:11434"
        description: "Qwen 2.5 3B & DeepSeek R1 1.5B (Local CPU)"
    - Qdrant Vector Memory:
        icon: qdrant.png
        href: "http://192.168.2.194:6333/dashboard"
        description: "Knowledge Base & Portfolio Vector Embeddings"

- Telemetry & Monitoring:
    - Uptime Kuma Status:
        icon: uptime-kuma.png
        href: "http://192.168.2.194:3001"
        description: "24/7 Endpoint Health & Telegram Phone Alerts"
    - Umami Web Analytics:
        icon: umami.png
        href: "http://192.168.2.194:3002"
        description: "Privacy-Preserving Traffic Analytics"

- Network & Security:
    - AdGuard DNS Firewall:
        icon: adguard-home.png
        href: "http://192.168.2.194:8080"
        description: "Whole-Home DNS Protection & Query Log"
    - n8n Automation Engine:
        icon: n8n.png
        href: "http://192.168.2.194:5678"
        description: "Event-Driven CI/CD & Notification Workflows"
```

Now, instead of memorizing port numbers or bookmarking 8 different URLs, opening `http://192.168.2.194:3005` (or my Tailscale IP when on the road) gives me instant access to my entire personal cloud.

## Lessons Learned and Troubleshooting

1. **Database initialization timing**: In Docker Compose, `depends_on: [umami-db]` only waits for the database container to start, not for Postgres to finish initializing its schema. Umami handles reconnection attempts cleanly, but giving Postgres a quick `healthcheck` in compose ensures zero startup race conditions.
2. **Automated database dumps**: I added a weekly `pg_dump` into my Sunday backup cron job so the analytics database is backed up into an encrypted archive alongside my other configurations.
3. **Keeping container states persistent**: Always mount database volumes to named host paths (like `/opt/personal-ai/databases/umami`) rather than relying on anonymous container storage.

## Final Thoughts

Self-hosting does not need to be complicated or expensive. With a little discipline around Docker resource constraints and a simple dashboard, you can build a private, fast, and completely self-sufficient infrastructure stack right in your living room.

## Related Posts

- [Transforming an Old Laptop into a Silent Linux Server & Private AI Homelab](/posts/transforming-an-old-laptop-into-a-silent-linux-ai-server/)
- [Security Checklist for Service Account Tokens and PATs](/posts/security-checklist-for-service-account-tokens-and-pats/)
- [GitHub Actions Security Hardening: What I Actually Use](/posts/github-actions-security-hardening-what-i-use/)
