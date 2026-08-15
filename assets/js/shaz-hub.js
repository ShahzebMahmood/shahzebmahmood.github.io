/**
 * Shaz Labs Terminal CLI & AI Assistant Engine
 * Pure client-side event delegation & offline-first knowledge engine.
 */
(function () {
  const knowledgeBase = [
    {
      triggers: ["current job", "current role", "job", "role", "workplace", "company", "companies", "how many companies", "career history", "employers", "work history", "where has he worked", "where does he work", "past roles", "roles", "jobs", "worked in", "worked at", "experience", "seqera", "cloudbeds", "traction", "impellam"],
      response: `<strong>🏢 Career History & Roles (4 Companies Total):</strong><br><br>
1. <strong>Seqera Labs</strong> (2024 - Present): DevOps Engineer & Cloud Support Engineer (AWS, Kubernetes, Terraform, Trivy scanning, External Secrets)<br>
2. <strong>Cloudbeds</strong> (2023 - 2024): IT Administrator (Enterprise infrastructure automation, 99.9% uptime, 40% ticket reduction)<br>
3. <strong>Traction on Demand</strong> (2022 - 2023): Infrastructure Technology Helpdesk Administrator (Network troubleshooting & infrastructure support)<br>
4. <strong>Impellam Group</strong> (2021 - 2022): Application Support Analyst & Service Desk Analyst`
    },
    {
      triggers: ["project", "projects", "portfolio", "built", "apps", "creations", "tools", "flagship", "what has he built", "what has he worked on"],
      response: `<strong>🛠️ Shahzeb's Flagship Engineering Projects:</strong><br><br>
1. <strong>Amanah AI Security Gateway:</strong> High-performance Go proxy intercepting LLM tool calls to stop prompt injections and cloud destruction.<br>
2. <strong>Pythia CLI:</strong> Automated red-teaming and prompt-injection security assessment engine for LLMs.<br>
3. <strong>Production EKS GitOps:</strong> Multi-tenant Kubernetes stack on AWS with Terraform, ArgoCD ApplicationSets, External Secrets (ESO), and Trivy vulnerability gating.<br>
4. <strong>Digital Amannah:</strong> Values-based, zero-tracking digital wellness platform built with Next.js App Router, TypeScript, and Supabase.`
    },
    {
      triggers: ["amanah", "firewall", "gateway", "ai security", "injection", "tool call", "llm proxy", "ai firewall", "prompt injection"],
      response: `<strong>🛡️ Amanah AI Security Gateway & Firewall:</strong><br>
A Go-based runtime security proxy that sits between Large Language Models and external tools. It parses tool-calling payloads in real time, scoring risk against categories like <em>cloud_destruction</em> and <em>data_exfiltration</em>. Destructive commands (like <code>aws ec2 terminate-instances</code> or unauthorized database drops) are automatically intercepted and require explicit approval.`
    },
    {
      triggers: ["pythia", "red team", "red-team", "fuzzer", "jailbreak", "adversarial", "llm fuzzer"],
      response: `<strong>⚡ Pythia LLM Red-Teaming CLI:</strong><br>
An open-source Python research CLI that automates adversarial testing against LLMs (local and cloud). It tests models against the OWASP LLM Top 10 vulnerabilities, automated prompt jailbreaks, system prompt extractions, and SSRF tool exploits.`
    },
    {
      triggers: ["shazlabs", "shaz labs", "labs", "homelab", "server", "debian", "laptop", "hardware", "specs", "cpu", "zram", "ram", "memory", "uptime", "status", "containers", "docker", "adguard", "kuma", "n8n", "umami", "qdrant"],
      response: `<strong>🐧 Debian 13 Shaz Labs Architecture:</strong><br>
• <strong>Host:</strong> Headless low-power Intel Core i3 micro-server (5-7W idle draw)<br>
• <strong>Memory:</strong> ZRAM LZ4 In-Memory Swap (1.9GB active buffer) preventing disk wear<br>
• <strong>Active Stack (7/7):</strong> Umami Analytics & Postgres, Ollama (Qwen 2.5 3B), Qdrant Vector DB, Uptime Kuma, AdGuard Home, n8n Automation, and Homepage Hub<br>
• <strong>Defense:</strong> UFW active, 0 open router WAN ports, accessible via Tailscale WireGuard mesh.`
    },
    {
      triggers: ["eks", "kubernetes", "k8s", "argocd", "gitops", "trivy", "eso", "terraform", "iac", "aws", "cloud"],
      response: `<strong>☁️ Cloud Native & Kubernetes Architecture:</strong><br>
Shahzeb architects multi-environment EKS clusters with Terraform and OpenTofu. His stack utilizes ArgoCD ApplicationSets for automated GitOps, External Secrets Operator (ESO) syncing from AWS Secrets Manager, IAM Pod Identity, and automated Trivy vulnerability gating in GitHub Actions CI/CD.`
    },
    {
      triggers: ["skill", "skills", "tech stack", "languages", "language", "code in", "coding", "programming", "technologies", "devops", "golang", "go", "python", "bash", "typescript"],
      response: `<strong>⚡ Core Technical Skillset & Languages:</strong><br>
• <strong>Languages:</strong> Go (Golang), Python, Bash, TypeScript/Node.js, SQL<br>
• <strong>Cloud & Infra:</strong> AWS (EKS, IAM, S3, NLB, VPC), Azure, GCP, Kubernetes, Docker<br>
• <strong>IaC & Automation:</strong> Terraform, OpenTofu, Bash, GitHub Actions, n8n<br>
• <strong>Security:</strong> Trivy, External Secrets (ESO), Fail2ban, UFW, Network Pentesting (PJPT)`
    },
    {
      triggers: ["cert", "certs", "certification", "certifications", "pjpt", "tcm", "pentest", "credly", "badge", "badges", "hackthebox", "htb"],
      response: `<strong>🎖️ Security Certifications & Credentials:</strong><br>
• <strong>TCM Security PJPT (Practical Junior Penetration Tester):</strong> Hands-on credential covering real-world Active Directory exploitation, network pivoting, and web penetration testing.<br>
• <strong>Verified Credly Profile:</strong> <a href='https://www.credly.com/users/shahzebmahmood' target='_blank' style='color:#58a6ff;'>credly.com/users/shahzebmahmood</a><br>
• <strong>Active HackTheBox:</strong> Hands-on security challenges & CTF writeups.`
    },
    {
      triggers: ["education", "degree", "msc", "masters", "university", "york", "school", "college", "academics", "graduating"],
      response: `<strong>🎓 Academic Background:</strong><br>
• <strong>MSc Computer Science with Cybersecurity</strong> — University of York (Expected Aug 2026)<br>
• Advanced research in threat detection, security architecture, cryptography, and defensive engineering.`
    },
    {
      triggers: ["digital amannah", "amannah", "wellness", "nextjs", "wiqayah", "privacy platform"],
      response: `<strong>🌿 Digital Amannah Platform:</strong><br>
A privacy-first digital safety platform built with Next.js App Router and React Server Components for zero client-side tracking. Built with Tailwind CSS, Supabase, and custom client-side moderation.`
    },
    {
      triggers: ["resume", "cv", "pdf", "download"],
      response: `<strong>📄 Resume Preview:</strong><br>
DevOps Engineer & Security Researcher specializing in Kubernetes, Terraform, and AI Runtime Security.<br><br>
<a href='/assets/docs/Shahzeb_Mahmood_Resume.pdf' target='_blank' download style='display:inline-block;background:#238636;color:#fff;padding:0.35rem 0.85rem;border-radius:6px;text-decoration:none;font-weight:600;font-size:0.85rem;'><i class='fas fa-download'></i> Download Shahzeb_Mahmood_Resume.pdf</a>`
    },
    {
      triggers: ["contact", "email", "linkedin", "github", "touch", "reach", "hire", "social", "phone", "message"],
      response: `<strong>📫 Connect with Shahzeb:</strong><br>
• <strong>LinkedIn:</strong> <a href='https://www.linkedin.com/in/shaz-mahmood1/' target='_blank' style='color:#58a6ff;'>linkedin.com/in/shaz-mahmood1/</a><br>
• <strong>GitHub:</strong> <a href='https://github.com/ShahzebMahmood' target='_blank' style='color:#58a6ff;'>github.com/ShahzebMahmood</a><br>
• <strong>Credly:</strong> <a href='https://www.credly.com/users/shahzebmahmood' target='_blank' style='color:#58a6ff;'>credly.com/users/shahzebmahmood</a><br>
• <strong>Email:</strong> <a href='mailto:shahzebmahmood3@gmail.com' style='color:#58a6ff;'>shahzebmahmood3@gmail.com</a>`
    },
    {
      triggers: ["who", "about", "shahzeb", "shaz", "bio", "intro", "summary", "introduce"],
      response: `<strong>👤 About Shahzeb Mahmood:</strong><br>
Shahzeb is a DevOps Engineer at Seqera Labs and an MSc Cybersecurity researcher at the University of York. He is TCM PJPT certified and specializes in cloud infrastructure hardening, Kubernetes GitOps, and Go AI security proxies.`
    }
  ];

  async function queryAI(prompt) {
    const raw = (prompt || "").trim();
    if (!raw) return "";

    // 1. Math Evaluation (e.g. 1+1, what is 25*4)
    const mathCandidate = raw.replace(/^(what is|calculate|solve|evaluate|compute)\s+/i, "").replace(/[^0-9+\-*/().\s]/g, "").trim();
    if (mathCandidate && /[0-9]/.test(mathCandidate) && /^[0-9+\-*/().\s]+$/.test(mathCandidate)) {
      try {
        const mathResult = Function("return " + mathCandidate)();
        if (typeof mathResult === "number" && !isNaN(mathResult)) {
          return `<strong>🧮 Calculation:</strong><br><code>${mathCandidate}</code> = <strong style="color: #7ee787; font-size: 1.05rem;">${mathResult}</strong>`;
        }
      } catch (e) {}
    }

    // 2. Greetings
    const lower = raw.toLowerCase().trim();
    if (/^(hi|hello|hey|greetings|salaam|assalamu alaikum|sup|yo)\b/i.test(lower)) {
      return `<strong>👋 Hello!</strong><br>I am Shahzeb's AI Assistant running on his Debian Shaz Labs server. Ask me anything about his cloud architecture, Kubernetes GitOps, Amanah AI Gateway, Pythia CLI, or his career history!`;
    }

    // 3. Knowledge Base Search
    for (const entry of knowledgeBase) {
      const isMatch = entry.triggers.some(t => {
        if (t.includes(" ")) {
          return lower.includes(t);
        }
        const regex = new RegExp(`(^|[^a-z0-9])${t}([^a-z0-9]|$)`, "i");
        return regex.test(lower);
      });
      if (isMatch) {
        return entry.response;
      }
    }

    // 4. Default Fallback
    return `<strong>💡 Shaz AI Assistant:</strong><br>
Shahzeb is a DevOps Engineer (Seqera Labs) & Security Researcher (MSc Cybersecurity | TCM PJPT). He specializes in AWS, Kubernetes (EKS), Terraform, Go AI Firewalls (Amanah), and local Shaz Labs micro-services. Try asking about his <strong>career history</strong>, <strong>projects</strong>, <strong>Shaz Labs architecture</strong>, or <strong>certifications</strong>!`;
  }

  // GLOBAL METHODS
  window.openShazChat = function () {
    const drawer = document.getElementById("shaz-ai-drawer");
    const aiInput = document.getElementById("shaz-ai-input");
    if (drawer) {
      if (drawer.parentNode !== document.body) {
        document.body.appendChild(drawer);
      }
      drawer.classList.add("shaz-ai-drawer-open");
    }
    if (aiInput) setTimeout(() => aiInput.focus(), 150);
  };

  window.closeShazChat = function () {
    const drawer = document.getElementById("shaz-ai-drawer");
    if (drawer) {
      drawer.classList.remove("shaz-ai-drawer-open");
    }
  };

  window.toggleShazChat = function () {
    const drawer = document.getElementById("shaz-ai-drawer");
    if (!drawer) return;
    if (drawer.classList.contains("shaz-ai-drawer-open")) {
      window.closeShazChat();
    } else {
      window.openShazChat();
    }
  };

  window.sendShazAIChat = async function (text) {
    const q = (text || "").trim();
    if (!q) return;

    window.openShazChat();

    const chatBody = document.getElementById("shaz-ai-chat-body");
    const aiInput = document.getElementById("shaz-ai-input");
    const chipsContainer = document.getElementById("shaz-ai-suggestions");

    if (chatBody) {
      const userDiv = document.createElement("div");
      userDiv.className = "shaz-msg shaz-msg-user";
      userDiv.innerHTML = `<div class="shaz-msg-bubble">${q}</div>`;
      chatBody.appendChild(userDiv);

      if (aiInput) aiInput.value = "";
      if (chipsContainer) chipsContainer.style.display = "none";
      chatBody.scrollTop = chatBody.scrollHeight;

      const botDiv = document.createElement("div");
      botDiv.className = "shaz-msg shaz-msg-bot";
      botDiv.innerHTML = `<div class="shaz-msg-bubble"><i class="fas fa-spinner fa-spin"></i> Processing...</div>`;
      chatBody.appendChild(botDiv);
      chatBody.scrollTop = chatBody.scrollHeight;

      const aiAnswer = await queryAI(q);
      botDiv.querySelector(".shaz-msg-bubble").innerHTML = aiAnswer;
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  };

  const commands = {
    whoami: `
      <div style="color: #79c0ff; font-weight: 600; margin: 0.3rem 0;">👤 Shahzeb Mahmood (Shaz)</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        &bull; <strong>Role:</strong> DevOps Engineer at Seqera Labs<br>
        &bull; <strong>Education:</strong> MSc Computer Science with Cybersecurity (University of York)<br>
        &bull; <strong>Certifications:</strong> TCM Security PJPT (Practical Junior Penetration Tester)<br>
        &bull; <strong>Focus:</strong> Kubernetes, Terraform, Hardened CI/CD Pipelines, and AI Runtime Security
      </div>
    `,
    shazlabs: `
      <div style="color: #7ee787; font-weight: 600; margin: 0.3rem 0;">🐧 DEBIAN 13 MINIMAL SHAZ LABS &bull; 24/7 ONLINE</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        &bull; <strong>Hardware:</strong> Low-Power Headless Intel Core i3 (5-7W idle draw)<br>
        &bull; <strong>Memory Strategy:</strong> ZRAM LZ4 In-Memory Swap (1.9GB active pool)<br>
        &bull; <strong>Docker Stack (7/7 Running):</strong><br>
        &nbsp;&nbsp;├─ <strong>Umami Analytics & PostgreSQL</strong> [Privacy Web Telemetry]<br>
        &nbsp;&nbsp;├─ <strong>Ollama AI Engine</strong> [Qwen 2.5 3B & DeepSeek R1]<br>
        &nbsp;&nbsp;├─ <strong>Qdrant Vector Database</strong> [Knowledge Base Embeddings]<br>
        &nbsp;&nbsp;├─ <strong>Uptime Kuma</strong> [24/7 Health Monitoring & Telegram Alerts]<br>
        &nbsp;&nbsp;├─ <strong>AdGuard Home</strong> [Network-Wide DNS Sinkhole]<br>
        &nbsp;&nbsp;├─ <strong>n8n Automation</strong> [Event-Driven CI/CD Workflows]<br>
        &nbsp;&nbsp;└─ <strong>Command Center Hub</strong> [Unified Operations Dashboard]<br>
        &bull; <strong>Security Posture:</strong> UFW Active &bull; 0 Open WAN Ports &bull; Tailscale WireGuard Mesh
      </div>
    `,
    homelab: `
      <div style="color: #7ee787; font-weight: 600; margin: 0.3rem 0;">🐧 DEBIAN 13 MINIMAL SHAZ LABS &bull; 24/7 ONLINE</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        &bull; <strong>Hardware:</strong> Low-Power Headless Intel Core i3 (5-7W idle draw)<br>
        &bull; <strong>Memory Strategy:</strong> ZRAM LZ4 In-Memory Swap (1.9GB active pool)<br>
        &bull; <strong>Docker Stack (7/7 Running):</strong><br>
        &nbsp;&nbsp;├─ <strong>Umami Analytics & PostgreSQL</strong> [Privacy Web Telemetry]<br>
        &nbsp;&nbsp;├─ <strong>Ollama AI Engine</strong> [Qwen 2.5 3B & DeepSeek R1]<br>
        &nbsp;&nbsp;├─ <strong>Qdrant Vector Database</strong> [Knowledge Base Embeddings]<br>
        &nbsp;&nbsp;├─ <strong>Uptime Kuma</strong> [24/7 Health Monitoring & Telegram Alerts]<br>
        &nbsp;&nbsp;├─ <strong>AdGuard Home</strong> [Network-Wide DNS Sinkhole]<br>
        &nbsp;&nbsp;├─ <strong>n8n Automation</strong> [Event-Driven CI/CD Workflows]<br>
        &nbsp;&nbsp;└─ <strong>Command Center Hub</strong> [Unified Operations Dashboard]<br>
        &bull; <strong>Security Posture:</strong> UFW Active &bull; 0 Open WAN Ports &bull; Tailscale WireGuard Mesh
      </div>
    `,
    labs: `
      <div style="color: #7ee787; font-weight: 600; margin: 0.3rem 0;">🐧 DEBIAN 13 MINIMAL SHAZ LABS &bull; 24/7 ONLINE</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        &bull; <strong>Hardware:</strong> Low-Power Headless Intel Core i3 (5-7W idle draw)<br>
        &bull; <strong>Memory Strategy:</strong> ZRAM LZ4 In-Memory Swap (1.9GB active pool)<br>
        &bull; <strong>Docker Stack (7/7 Running):</strong><br>
        &nbsp;&nbsp;├─ <strong>Umami Analytics & PostgreSQL</strong> [Privacy Web Telemetry]<br>
        &nbsp;&nbsp;├─ <strong>Ollama AI Engine</strong> [Qwen 2.5 3B & DeepSeek R1]<br>
        &nbsp;&nbsp;├─ <strong>Qdrant Vector Database</strong> [Knowledge Base Embeddings]<br>
        &nbsp;&nbsp;├─ <strong>Uptime Kuma</strong> [24/7 Health Monitoring & Telegram Alerts]<br>
        &nbsp;&nbsp;├─ <strong>AdGuard Home</strong> [Network-Wide DNS Sinkhole]<br>
        &nbsp;&nbsp;├─ <strong>n8n Automation</strong> [Event-Driven CI/CD Workflows]<br>
        &nbsp;&nbsp;└─ <strong>Command Center Hub</strong> [Unified Operations Dashboard]<br>
        &bull; <strong>Security Posture:</strong> UFW Active &bull; 0 Open WAN Ports &bull; Tailscale WireGuard Mesh
      </div>
    `,
    projects: `
      <div style="color: #d2a8ff; font-weight: 600; margin: 0.3rem 0;">🛠️ FLAGSHIP ENGINEERING & SECURITY LAB</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        1. <strong style="color: #79c0ff;">Amanah AI Security Gateway</strong>: Go AI proxy mitigating prompt injections & tool-call destruction.<br>
        2. <strong style="color: #79c0ff;">Pythia CLI</strong>: Adversarial prompt injection & safety auditing engine for LLMs.<br>
        3. <strong style="color: #79c0ff;">Production EKS GitOps</strong>: AWS EKS + Terraform + ArgoCD + External Secrets + Trivy.<br>
        4. <strong style="color: #79c0ff;">Digital Amannah</strong>: Values-based zero-tracking platform built with Next.js, TypeScript & Supabase.
      </div>
    `,
    certs: `
      <div style="color: #ffa657; font-weight: 600; margin: 0.3rem 0;">🎖️ CERTIFICATIONS & CREDENTIALS</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        &bull; <strong>TCM Security PJPT:</strong> Practical Junior Penetration Tester (Hands-on Active Directory & Web Pentest)<br>
        &bull; <strong>MSc Computer Science with Cybersecurity:</strong> University of York (Expected Aug 2026)<br>
        &bull; <strong>Verified Badges:</strong> <a href="https://www.credly.com/users/shahzebmahmood" target="_blank" style="color: #58a6ff;">credly.com/users/shahzebmahmood</a><br>
        &bull; <strong>Hack The Box:</strong> Security Enthusiast (CTF Writeups & Pro Labs)
      </div>
    `,
    skills: `
      <div style="color: #58a6ff; font-weight: 600; margin: 0.3rem 0;">⚡ CORE TECHNICAL SKILLS</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        &bull; <strong>Cloud & Container:</strong> AWS (EKS, IAM, S3, NLB), Azure, GCP, Docker, Kubernetes, ArgoCD<br>
        &bull; <strong>IaC & Automation:</strong> Terraform, OpenTofu, Bash, GitHub Actions, n8n<br>
        &bull; <strong>Security & Compliance:</strong> Trivy, External Secrets (ESO), Fail2ban, UFW, Network Pentesting<br>
        &bull; <strong>Languages:</strong> Go (Golang), Python, Bash, JavaScript/Node.js, SQL
      </div>
    `,
    "cat resume.pdf": `
      <div style="color: #7ee787; font-weight: 600; margin: 0.3rem 0;">📄 SHAHZEB MAHMOOD &bull; RESUME</div>
      <div style="color: #c9d1d9; line-height: 1.6; margin-bottom: 0.5rem;">
        DevOps Engineer with deep expertise in cloud security hardening, Kubernetes orchestration, and multi-tenant automation.
      </div>
      <a href="/assets/docs/Shahzeb_Mahmood_Resume.pdf" target="_blank" download style="display: inline-block; background: #238636; color: #fff; padding: 0.3rem 0.8rem; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 600;">
        <i class="fas fa-download"></i> Download Full Resume (PDF)
      </a>
    `,
    resume: `
      <div style="color: #7ee787; font-weight: 600; margin: 0.3rem 0;">📄 SHAHZEB MAHMOOD &bull; RESUME</div>
      <div style="color: #c9d1d9; line-height: 1.6; margin-bottom: 0.5rem;">
        DevOps Engineer with deep expertise in cloud security hardening, Kubernetes orchestration, and multi-tenant automation.
      </div>
      <a href="/assets/docs/Shahzeb_Mahmood_Resume.pdf" target="_blank" download style="display: inline-block; background: #238636; color: #fff; padding: 0.3rem 0.8rem; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 600;">
        <i class="fas fa-download"></i> Download Full Resume (PDF)
      </a>
    `,
    contact: `
      <div style="color: #79c0ff; font-weight: 600; margin: 0.3rem 0;">📫 GET IN TOUCH</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        &bull; <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/shaz-mahmood1/" target="_blank" style="color: #58a6ff;">linkedin.com/in/shaz-mahmood1/</a><br>
        &bull; <strong>GitHub:</strong> <a href="https://github.com/ShahzebMahmood" target="_blank" style="color: #58a6ff;">github.com/ShahzebMahmood</a><br>
        &bull; <strong>Credly:</strong> <a href="https://www.credly.com/users/shahzebmahmood" target="_blank" style="color: #58a6ff;">credly.com/users/shahzebmahmood</a><br>
        &bull; <strong>Email:</strong> <a href="mailto:shahzebmahmood3@gmail.com" style="color: #58a6ff;">shahzebmahmood3@gmail.com</a>
      </div>
    `,
    help: `
      <div style="color: #ffa657; font-weight: 600; margin: 0.3rem 0;">💡 AVAILABLE COMMANDS</div>
      <div style="color: #c9d1d9; line-height: 1.6;">
        &bull; <code style="color: #79c0ff;">whoami</code> &mdash; Background, role, and current credentials<br>
        &bull; <code style="color: #79c0ff;">shazlabs</code> &mdash; Hardened Debian server status, stack, and ZRAM stats<br>
        &bull; <code style="color: #79c0ff;">projects</code> &mdash; Flagship security and cloud engineering tools<br>
        &bull; <code style="color: #79c0ff;">certs</code> &mdash; Certifications (TCM PJPT, MSc, HTB, Credly)<br>
        &bull; <code style="color: #79c0ff;">skills</code> &mdash; Technical proficiencies across DevOps & Security<br>
        &bull; <code style="color: #79c0ff;">ai &lt;question&gt;</code> &mdash; Ask Shaz Labs AI model directly in terminal<br>
        &bull; <code style="color: #79c0ff;">cat resume.pdf</code> &mdash; Resume preview and download link<br>
        &bull; <code style="color: #79c0ff;">contact</code> &mdash; Direct email and social profiles<br>
        &bull; <code style="color: #79c0ff;">clear</code> &mdash; Clear terminal screen
      </div>
    `,
    clear: "CLEAR"
  };

  window.runTerminalCommand = async function (cmdText) {
    const clean = (cmdText || "").trim();
    if (!clean) return;

    const outputArea = document.getElementById("term-output-area");
    const cliInput = document.getElementById("term-cli-input");
    if (cliInput) cliInput.value = "";
    if (!outputArea) return;

    if (clean.toLowerCase() === "clear") {
      outputArea.innerHTML = "";
      return;
    }

    if (clean.toLowerCase().startsWith("ai ") || clean.toLowerCase().startsWith("ask ")) {
      const query = clean.substring(clean.indexOf(" ") + 1);
      const cmdBlock = document.createElement("div");
      cmdBlock.style.marginBottom = "0.8rem";
      cmdBlock.innerHTML = `
        <div style="display: flex; gap: 0.5rem; color: #7ee787; font-weight: 600;">
          <span>shaz@shazlabs:~$</span>
          <span style="color: #58a6ff;">${clean}</span>
        </div>
        <div style="margin-left: 0.5rem; color: #d2a8ff; margin-top: 0.2rem;">
          🤖 <span style="font-weight:600;">Shaz Labs AI:</span> <span class="term-ai-response"><i class="fas fa-spinner fa-spin"></i> Processing...</span>
        </div>
      `;
      outputArea.appendChild(cmdBlock);
      const termBody = document.querySelector(".terminal-body");
      if (termBody) termBody.scrollTop = termBody.scrollHeight;

      const aiResponse = await queryAI(query);
      cmdBlock.querySelector(".term-ai-response").innerHTML = aiResponse;
      if (termBody) termBody.scrollTop = termBody.scrollHeight;
      return;
    }

    const response = commands[clean.toLowerCase()] || `
      <div style="color: #f85149; margin: 0.2rem 0;">
        command not found: <strong>${clean}</strong>. Type <code style="color: #58a6ff;">help</code> for commands or <code style="color: #7ee787;">ai &lt;question&gt;</code> to prompt AI.
      </div>
    `;

    const cmdBlock = document.createElement("div");
    cmdBlock.style.marginBottom = "0.8rem";
    cmdBlock.innerHTML = `
      <div style="display: flex; gap: 0.5rem; color: #7ee787; font-weight: 600;">
        <span>shaz@shazlabs:~$</span>
        <span style="color: #58a6ff;">${clean}</span>
      </div>
      <div style="margin-left: 0.5rem;">${response}</div>
    `;

    outputArea.appendChild(cmdBlock);
    const termBody = document.querySelector(".terminal-body");
    if (termBody) termBody.scrollTop = termBody.scrollHeight;
  };

  // GLOBAL DOCUMENT EVENT DELEGATION
  document.addEventListener("click", function (e) {
    // 1. Terminal Chips
    const cliChip = e.target.closest(".cli-chip");
    if (cliChip) {
      e.preventDefault();
      e.stopPropagation();
      const cmd = cliChip.getAttribute("data-cmd");
      if (cmd) window.runTerminalCommand(cmd);
      return;
    }

    // 2. Chatbot Suggestions
    const shazChip = e.target.closest(".shaz-chip");
    if (shazChip) {
      e.preventDefault();
      e.stopPropagation();
      const prompt = shazChip.getAttribute("data-prompt") || shazChip.innerText;
      if (prompt) window.sendShazAIChat(prompt);
      return;
    }

    // 3. Open AI Chat triggers
    if (
      e.target.closest("#shaz-ai-launcher") ||
      e.target.closest("#hero-open-ai-btn") ||
      e.target.closest("#term-ai-toggle-btn")
    ) {
      e.preventDefault();
      e.stopPropagation();
      window.toggleShazChat();
      return;
    }

    // 4. Close AI Chat
    if (e.target.closest("#shaz-ai-close-btn")) {
      e.preventDefault();
      e.stopPropagation();
      window.closeShazChat();
      return;
    }

    // 5. Terminal Clear
    if (e.target.closest("#term-clear-btn")) {
      e.preventDefault();
      e.stopPropagation();
      window.runTerminalCommand("clear");
      return;
    }

    // 6. Send AI Message Button
    if (e.target.closest("#shaz-ai-send-btn")) {
      e.preventDefault();
      e.stopPropagation();
      const aiInput = document.getElementById("shaz-ai-input");
      if (aiInput) window.sendShazAIChat(aiInput.value);
      return;
    }

    // 7. Timeline Items
    const timelineItem = e.target.closest(".timeline-item");
    if (timelineItem) {
      document.querySelectorAll(".timeline-item").forEach(item => item.classList.remove("active"));
      timelineItem.classList.add("active");
    }
  });

  // GLOBAL KEYDOWN EVENT DELEGATION
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      if (e.target && e.target.id === "term-cli-input") {
        e.preventDefault();
        e.stopPropagation();
        window.runTerminalCommand(e.target.value);
      }
      if (e.target && e.target.id === "shaz-ai-input") {
        e.preventDefault();
        e.stopPropagation();
        window.sendShazAIChat(e.target.value);
      }
    }
  });

  // AUTO-INITIALIZE ONCE DOM IS READY
  function initHub() {
    const drawer = document.getElementById("shaz-ai-drawer");
    if (drawer && drawer.parentNode !== document.body) {
      document.body.appendChild(drawer);
    }
    const launcher = document.getElementById("shaz-ai-launcher");
    if (launcher && launcher.parentNode !== document.body) {
      document.body.appendChild(launcher);
    }

    setTimeout(() => {
      const outputArea = document.getElementById("term-output-area");
      if (outputArea && !outputArea.hasChildNodes()) {
        window.runTerminalCommand("whoami");
      }
    }, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHub);
  } else {
    initHub();
  }
})();
