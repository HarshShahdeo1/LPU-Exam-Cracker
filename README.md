# 🎓 LPU Exam Cracker — AI-Powered Syllabus Study Platform

> Upload your LPU syllabus PDF and instantly get AI-generated unit summaries, key terms, exam tips, 5 MCQs per unit, deep study cards, and an interactive chatbot — all powered by Groq + NVIDIA AI.

**Live Demo:** [http://lpu-exam-cracker.duckdns.org](http://lpu-exam-cracker.duckdns.org)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📄 **PDF Analysis** | Upload any LPU syllabus PDF — AI extracts and analyzes all units |
| 📚 **Unit Summaries** | Auto-generated summaries, key terms, and exam tips per unit |
| 🧠 **MCQ Practice** | 5 AI-generated MCQs per unit with instant scoring |
| 🔬 **Deep Study Cards** | On-demand subtopics, formulae, and exam strategies |
| 💬 **AI Chatbot** | Ask anything about your syllabus — powered by NVIDIA Llama |
| 📊 **Multi-Syllabus Library** | Save and revisit all past reports from the dashboard |
| 🔒 **Secure Auth** | Firebase email/password login + self-registration |
| 📈 **System Health** | Hidden admin dashboard with latency & reliability metrics |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) + TypeScript |
| **Styling** | Tailwind CSS + Framer Motion |
| **AI — Analysis** | Groq API (`llama-3.3-70b-versatile`) |
| **AI — Chatbot** | NVIDIA API (`meta/llama-3.1-8b-instruct`) |
| **Auth** | Firebase Authentication (Email/Password) |
| **Database** | Firebase Firestore |
| **PDF Parsing** | `pdf-parse` (server-side) |
| **Deployment** | AWS EC2 (`t2.micro`) + PM2 + Nginx |
| **CI/CD** | GitHub Actions (auto-deploy on push to `main`) |
| **Domain** | DuckDNS (free dynamic DNS) + AWS Elastic IP |

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── analyze/          # PDF → AI analysis pipeline
│   │   ├── auth/session/     # Firebase session cookie management
│   │   ├── syllabus-chat/    # AI chatbot endpoint
│   │   └── unit-detail/      # Deep study card generator
│   ├── results/              # Study results page
│   ├── system-health/        # Admin metrics dashboard
│   ├── upload/               # Syllabus upload dashboard
│   └── page.tsx              # Login / landing page
├── components/
│   ├── auth/                 # Login, signup, hero panel
│   ├── dashboard/            # Upload UI, report library
│   ├── results/              # Study cards, quiz, chatbot
│   ├── system-health/        # Admin charts
│   └── ui/                   # Shared UI components
├── lib/
│   ├── auth.ts               # Session helpers
│   ├── env.ts                # Firebase service account parser
│   ├── firebase-admin.ts     # Firebase Admin SDK
│   ├── firebase-client.ts    # Firebase client SDK
│   ├── openai.ts             # Groq + NVIDIA client factories
│   └── reports.ts            # Firestore report helpers
├── types/
│   ├── report.ts             # Shared TypeScript types
│   └── system-health.ts      # Telemetry types
├── docker/
│   ├── Dockerfile            # Multi-stage production image
│   ├── docker-compose.yml    # App + Caddy reverse proxy
│   ├── Caddyfile             # Caddy HTTPS config
│   └── .dockerignore         # Docker build exclusions
├── scripts/
│   └── gen_pdf.py            # Sample syllabus PDF generator
├── docs/
│   └── SYNOPSIS.md           # Project synopsis document
├── .github/workflows/
│   ├── ci-cd.yml             # Auto-deploy pipeline
│   └── setup-ec2.yml         # One-click server initialization
└── public/                   # Static assets
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Groq API key (used for syllabus analysis) |
| `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` |
| `OPENAI_MODEL` | `llama-3.3-70b-versatile` |
| `NVIDIA_API_KEY` | NVIDIA API key (used for chatbot) |
| `NVIDIA_MODEL` | `meta/llama-3.1-8b-instruct` |
| `ADMIN_EMAILS` | Comma-separated emails for `/system-health` access |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON (minified, single line) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app config |

---

## 🚀 Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Production Deployment (AWS EC2)

This project uses **GitHub Actions** for fully automated CI/CD.

### First-Time Server Setup
1. Launch an AWS EC2 `t2.micro` instance (Ubuntu 24.04 LTS)
2. Add your secrets to GitHub → **Settings → Secrets → Actions**:
   - `EC2_HOST` — your server's Elastic IP
   - `EC2_USERNAME` — `ubuntu`
   - `EC2_SSH_KEY` — contents of your `.pem` key file
3. Go to **GitHub Actions** → run **"First Time Server Setup"** workflow
4. SSH into the server and create `.env.local` manually:
   ```bash
   nano ~/lpu-exam-cracker/.env.local
   # Paste your environment variables, save with Ctrl+X → Y → Enter
   pm2 restart lpu-exam-cracker
   ```

### Ongoing Deployments
Push to `main` → GitHub Actions automatically:

```
git push → [🔐 Security Scan] ──┐
           (Gitleaks + npm audit) │
                                  ├──→ [🚀 Deploy to EC2]
           [🔨 Build & Lint]  ───┘
           (ESLint + Next.js build)
```

Both jobs must pass before deployment proceeds.

### Disaster Recovery (if EC2 is terminated)
1. Launch a new EC2 instance
2. Update `EC2_HOST` secret in GitHub with the new Elastic IP
3. Re-run **"First Time Server Setup"** workflow
4. Re-create `.env.local` on the new server

---

## 🔥 Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** authentication
3. Add your domain to **Authorized Domains** (Authentication → Settings)
4. Generate a **Service Account Key** (Project Settings → Service Accounts)
5. Minify the JSON key to a single line and set as `FIREBASE_SERVICE_ACCOUNT_KEY`
6. Create a **Firestore database** in production mode

---

## 🛡️ Security

| Layer | Tool | Purpose |
|-------|------|---------|
| **Secret Scanning** | Gitleaks (CI) | Blocks commits containing API keys, tokens, or passwords |
| **Dependency Scanning** | npm audit (CI) | Detects known CVE vulnerabilities in npm packages |
| **Security Headers** | Next.js config | Protects against XSS, clickjacking, MIME sniffing |
| **Session Security** | Firebase Admin SDK | `httpOnly` cookies verified server-side on every request |
| **Route Protection** | Next.js middleware | Redirects unauthenticated users from protected pages |
| **Admin Access Control** | `ADMIN_EMAILS` env | `/system-health` restricted to whitelisted emails |
| **Deploy Gate** | GitHub Actions | Deployment blocked unless security-scan AND build both pass |

---

## 📝 Notes

- The `FIREBASE_SERVICE_ACCOUNT_KEY` must be **minified JSON on a single line** in `.env.local`
- PDF text is truncated to 12,000 characters to keep AI token usage predictable
- The chatbot uses NVIDIA (separate token budget from Groq analysis)
- Session cookies use `httpOnly` and are tied to Firebase Admin verified tokens
- `/system-health` is only accessible to emails listed in `ADMIN_EMAILS`
