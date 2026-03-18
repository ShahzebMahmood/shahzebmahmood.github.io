---
layout: post
title: "How to Purge Cloudflare Cache When Your CDN Serves Stale Files"
description: "A practical runbook for diagnosing stale Cloudflare edge cache and purging specific URLs with API or dashboard."
date: 2026-03-18 09:30:00 -0400
categories: [DevOps, CDN]
tags: [cloudflare, cache, cdn, troubleshooting, s3, api]
pin: false
---

I hit this issue in production: a file was updated in S3 (origin), but Cloudflare kept serving an older cached version.

The symptom was a JSON file still pointing to an old versioned asset path even though the new JSON was already in S3. The response headers showed:

- `cf-cache-status: HIT`
- `cache-control: max-age=14400`

That means Cloudflare can keep serving that cached object for up to 4 hours unless I invalidate it.

## How I Diagnose It

I start by checking headers and body with `curl -sv`.

```bash
curl -sv "https://cdn.example.com/config/manifest.json" -o /tmp/manifest.json
```

I look for:

- `cf-cache-status` (if `HIT`, edge cache served the response)
- `age` (seconds the cached object has lived at edge)
- `cache-control: max-age=14400` (TTL window)

Then I verify the actual content:

```bash
cat /tmp/manifest.json
```

If the body still references old asset paths, the edge object is stale.

I also compare with similar URLs that may have refreshed naturally:

```bash
curl -sv "https://cdn.example.com/config/other-manifest.json" -o /tmp/other-manifest.json
```

This helps confirm whether the issue is isolated to one cached object.

## What Purge Actually Does

Cloudflare edge caching stores origin responses at edge nodes to reduce latency and origin load. Stale content can appear when the cached object is still inside its TTL window.

A purge removes cached copies for selected URLs at the edge. The next request fetches fresh content from S3 and repopulates cache.

This is non-destructive and typically has no downtime impact. You are invalidating cache, not deleting origin files.

## Purge with Cloudflare API

### 1) Get Zone ID

In Cloudflare dashboard, open your site and copy the **Zone ID** from the zone overview page.

### 2) Create API token

Create a token with:

- Permission: `Cache Purge` (Zone)
- Scope: only the target zone

### 3) Purge specific URLs

```bash
ZONE_ID="<YOUR_ZONE_ID>"
CF_API_TOKEN="<YOUR_API_TOKEN>"

curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "files": [
      "https://cdn.example.com/config/manifest.json",
      "https://cdn.example.com/assets/app.20260318.js"
    ]
  }'
```

A successful call returns `"success": true`.

### 4) Verify purge

```bash
curl -sv "https://cdn.example.com/config/manifest.json" -o /tmp/manifest-after-purge.json
cat /tmp/manifest-after-purge.json
```

On the first request after purge, you should usually see `cf-cache-status: MISS` (or a revalidation flow) and the updated JSON body.

## Purge with Cloudflare Dashboard

If you prefer UI:

1. Go to `Caching`
2. Open `Purge Cache`
3. Select `Custom Purge`
4. Enter the exact URLs and purge

For this incident pattern, targeted purge is usually the fastest fix without waiting for TTL expiry.

## What I Learned (and What I Still Fear in Prod)

What I learned is simple: always verify with headers and body first, then do the smallest possible purge (specific URLs, not full cache). That keeps impact low and recovery fast.

What I still fear is making a rushed production change without validation. In prod, one careless action can create a bigger incident than the original cache problem. So I stick to a checklist: confirm stale response, purge narrowly, re-test immediately, and document exactly what changed.
