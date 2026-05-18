# Project Synopsis: LPU Exam Cracker

**Project Category:** AI-Powered Educational Tool / Cloud-Native Web Application
**Developer:** Harsh Shahdeo
**Institution:** Lovely Professional University (LPU)
**Target Audience:** Students of Lovely Professional University
**Live Deployment:** [https://lpu-exam-cracker.duckdns.org](https://lpu-exam-cracker.duckdns.org)

---

## 1. Introduction

The **LPU Exam Cracker** is a full-stack, production-deployed AI web application designed to eliminate the manual effort of exam preparation for LPU students. By simply uploading a syllabus PDF, students receive a comprehensive, AI-generated study kit within seconds — including unit summaries, key terms, exam tips, practice MCQs, deep-dive study cards, and an interactive AI chatbot that answers questions grounded in their own syllabus.

The platform is built on modern cloud-native architecture, deployed on AWS EC2, and features a fully automated CI/CD pipeline using GitHub Actions — ensuring zero-downtime deployments on every code push.

---

## 2. Problem Statement

LPU students routinely face exam preparation challenges:

- **Information Overload:** Syllabi span multiple units with dense academic content, making it hard to prioritize topics.
- **Time Constraints:** Manually summarizing units before MTE or ETE exams is extremely time-consuming.
- **Assessment Gap:** Students lack instant, syllabus-specific practice questions to self-test their understanding.
- **No Personalized Guidance:** Generic study resources do not align with LPU's specific syllabus content.

---

## 3. Proposed Solution

LPU Exam Cracker solves these problems through an end-to-end AI pipeline:

1. Student uploads their LPU syllabus PDF.
2. The server extracts and processes the text using `pdf-parse`.
3. The text is sent to **Groq's Llama 3.3-70B** model for structured analysis.
4. AI returns a JSON report containing per-unit summaries, key terms, exam tips, and 5 MCQs per unit.
5. The report is stored in **Firebase Firestore** and associated with the student's account.
6. Students can access deep-dive study cards and a live **AI chatbot** for follow-up questions.

---

## 4. Key Features

| Feature | Description |
|---------|-------------|
| 📄 **PDF Analysis** | Upload any LPU syllabus PDF — AI auto-extracts all units and content |
| 📚 **Unit Summaries** | Concise AI-generated summaries, key terms, and exam tips for each unit |
| 🧠 **MCQ Practice Quiz** | 5 AI-generated multiple-choice questions per unit with instant scoring |
| 🔬 **Deep Study Cards** | On-demand subtopics, formulae, definitions, and exam strategies |
| 💬 **AI Chatbot** | Ask any question about your syllabus — powered by NVIDIA Llama 3.1 |
| 📚 **Multi-Syllabus Library** | Dashboard to save and revisit all past reports across subjects |
| 🔐 **Secure Authentication** | Firebase email/password login with self-registration and password reset |
| 📊 **Admin Dashboard** | Hidden `/system-health` page with AI latency & reliability metrics |
| 🚀 **Auto-Deployment** | GitHub Actions CI/CD pipeline — deploy on every `git push` |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│              http://lpu-exam-cracker.duckdns.org             │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP (Port 80)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   NGINX (Reverse Proxy)                      │
│              AWS EC2 t2.micro — Elastic IP                   │
└───────────────────────┬─────────────────────────────────────┘
                        │ Proxies to Port 3000
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            NEXT.JS 15 APP (Managed by PM2)                   │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ /api/analyze │  │/api/syllabus-  │  │ /api/unit-     │  │
│  │ (PDF → AI)   │  │chat (Chatbot)  │  │ detail (Cards) │  │
│  └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  │
└─────────┼───────────────────┼────────────────────┼──────────┘
          │                   │                    │
          ▼                   ▼                    ▼
   ┌────────────┐     ┌──────────────┐     ┌────────────────┐
   │ Groq API   │     │  NVIDIA API  │     │    Firebase     │
   │ Llama 3.3  │     │  Llama 3.1   │     │ Firestore + Auth│
   │ 70B Model  │     │  8B Model    │     └────────────────┘
   └────────────┘     └──────────────┘
```

---

## 6. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + TypeScript | React framework with App Router |
| **Styling** | Tailwind CSS + Framer Motion | Responsive UI with animations |
| **AI — Analysis** | Groq API (`llama-3.3-70b-versatile`) | Fast syllabus analysis & MCQ generation |
| **AI — Chatbot** | NVIDIA API (`meta/llama-3.1-8b-instruct`) | Real-time student Q&A chatbot |
| **Authentication** | Firebase Authentication | Secure email/password login |
| **Database** | Firebase Firestore | NoSQL cloud storage for reports |
| **PDF Processing** | `pdf-parse` (Node.js) | Server-side text extraction from PDFs |
| **Server** | AWS EC2 `t2.micro` (Ubuntu 24.04) | Cloud hosting |
| **Process Manager** | PM2 | Zero-downtime app management |
| **Reverse Proxy** | Nginx | Port 80 → 3000, domain routing |
| **CI/CD** | GitHub Actions | Auto-deploy on every git push |
| **Domain** | DuckDNS + AWS Elastic IP | Permanent custom domain |
| **SSL/TLS** | Let's Encrypt (via Caddy) | Automated HTTPS with auto-renewing certificates |

---

## 7. Database Design (Firestore Collections)

### `userReports` Collection
| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Firebase user ID |
| `fileName` | string | Original PDF filename |
| `createdAt` | timestamp | Upload timestamp |
| `hasSourceText` | boolean | Whether PDF text is stored |
| `sourceText` | string | Extracted PDF text (for chatbot) |
| `report` | object | Full AI-generated study report |
| `report.courseTitle` | string | AI-detected course name |
| `report.units[]` | array | Array of unit study objects |
| `report.units[].summary` | string | Unit summary |
| `report.units[].keyTerms` | array | Key terms list |
| `report.units[].examTips` | array | Exam tips list |
| `report.units[].quiz` | array | 5 MCQs with answers |

### `analysisEvents` Collection
| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Firebase user ID |
| `status` | string | `success` or `failure` |
| `latencyMs` | number | Total processing time |
| `failureStage` | string | Where it failed (if any) |
| `createdAt` | timestamp | Event timestamp |

---

## 8. CI/CD Pipeline

```
Developer pushes code to GitHub (main branch)
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│  GitHub Actions: security-scan   │  │  GitHub Actions: build-and-lint  │
│  • Gitleaks (secret scanning)    │  │  • Install dependencies          │
│  • npm audit (CVE scanning)      │  │  • Run ESLint                    │
│                                  │  │  • Build Next.js production      │
└──────────────┬───────────────────┘  └──────────────┬───────────────────┘
               │ (both must pass)                    │
               └──────────────┬──────────────────────┘
                              ▼
┌──────────────────────────────────────┐
│   GitHub Actions: deploy-to-ec2      │
│   • SSH into AWS EC2 server          │
│   • git pull latest code             │
│   • npm install                      │
│   • npm run build                    │
│   • pm2 restart lpu-exam-cracker     │
└──────────────────────────────────────┘
```

---

## 9. Security Implementation

### CI/CD Security (Automated)
| Layer | Tool | Purpose |
|-------|------|---------|
| **Secret Scanning** | Gitleaks | Scans every commit for leaked API keys, passwords, tokens — blocks pipeline if found |
| **Dependency Scanning** | npm audit | Detects known CVE vulnerabilities in npm packages |
| **Deploy Gate** | GitHub Actions | Deployment blocked unless both security-scan AND build-and-lint pass |

### Application Security
| Layer | Tool | Purpose |
|-------|------|---------|
| **Security Headers** | Next.js config (`next.config.js`) | Protects against XSS (`X-XSS-Protection`), clickjacking (`X-Frame-Options: DENY`), MIME sniffing (`X-Content-Type-Options: nosniff`), and browser tracking (`Permissions-Policy`) |
| **Session Cookies** | Firebase Admin SDK | Server-side `httpOnly` cookies verified on every request |
| **Route Protection** | Next.js middleware | Checks session cookie on every protected route, redirects unauthenticated users |
| **API Security** | Session verification | All API routes verify the session cookie before processing |
| **Environment Secrets** | GitHub Secrets | API keys stored securely in GitHub, never committed to the codebase |
| **Admin Access Control** | `ADMIN_EMAILS` env variable | `/system-health` dashboard restricted to whitelisted emails |

---

## 10. Outcomes & Impact

- **100% Automated Deployment:** Zero manual steps from code push to production
- **Sub-5 Second Analysis:** Groq's inference API provides near-instant syllabus processing
- **Real AI Responses:** Chatbot answers are grounded in the student's actual PDF content
- **Production-Ready:** Live at a permanent HTTPS domain, secured with Let's Encrypt SSL, accessible to all LPU students
- **Scalable Architecture:** Firebase handles unlimited concurrent users; EC2 can be upgraded as needed
- **Fully Secured:** End-to-end HTTPS enforced via Caddy reverse proxy with automated certificate renewal

---

## 11. Future Enhancements

- Multi-language support for regional students
- Mobile app wrapper using React Native
- Collaborative study groups with shared reports
- Integration with LPU's official academic calendar
- Email notifications before exam dates

---

*This project demonstrates end-to-end ownership of a production AI application — from ideation and development to cloud deployment, CI/CD automation, and real-world usage.*
