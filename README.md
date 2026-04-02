# LPU Exam Cracker v2

Production-ready Next.js 15 application that accepts LPU syllabus PDFs, extracts text server-side with `pdf-parse`, analyzes the syllabus with an OpenAI-compatible model, and stores structured study reports in Firebase Firestore. The app ships with Docker and local `docker-compose` support so it can be promoted to AWS App Runner through ECR.

## Stack

- Next.js 15 App Router with TypeScript
- Tailwind CSS with Framer Motion for glassmorphism UI
- Firebase Authentication for sign-in and password reset
- Firebase Admin SDK for secure session verification and Firestore writes
- OpenAI-compatible LLM in JSON mode
- Docker multi-stage build on `node:20-alpine`

## Features

- Figma-inspired dark landing page with LPU Crimson accents
- Protected `/upload` and `/results` routes via `middleware.ts`
- Firebase email/password login with `sendPasswordResetEmail`
- PDF upload dashboard with animated progress feedback
- `/api/analyze` pipeline that parses the PDF, calls OpenAI, normalizes the JSON response, and stores it in Firestore `userReports`
- Results screen with study cards and per-unit practice quiz sections

## Environment Variables

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

Required values:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` optional, defaults to OpenAI and can point to Groq's OpenAI-compatible endpoint
- `OPENAI_MODEL` optional, defaults to `gpt-4o-mini`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Firebase Setup

1. Create a Firebase project.
2. Enable Email/Password authentication in Firebase Authentication.
3. Generate a service account key and place its JSON contents into `FIREBASE_SERVICE_ACCOUNT_KEY`.
4. Create a Firestore database.
5. Create users in Firebase Auth or add a signup flow later.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Local Docker Run

```bash
docker compose up --build
```

The Docker build uses Next.js standalone output so the final image contains only the compiled runtime and static assets.

## AWS ECR + App Runner

1. Create an ECR repository:

```bash
aws ecr create-repository --repository-name lpu-exam-cracker-v2
```

2. Authenticate Docker with ECR:

```bash
aws ecr get-login-password --region <aws-region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<aws-region>.amazonaws.com
```

3. Build and tag the image:

```bash
docker build -t lpu-exam-cracker-v2 .
docker tag lpu-exam-cracker-v2:latest <account-id>.dkr.ecr.<aws-region>.amazonaws.com/lpu-exam-cracker-v2:latest
```

4. Push the image:

```bash
docker push <account-id>.dkr.ecr.<aws-region>.amazonaws.com/lpu-exam-cracker-v2:latest
```

5. In AWS App Runner:
   - create a service from the ECR image
   - expose port `3000`
   - set the same environment variables from `.env.local`
   - enable automatic deployments if desired

## Important Notes

- The middleware checks for a Firebase-backed session cookie. Server pages and API routes verify the cookie before reading or writing user data.
- The OpenAI prompt truncates very large PDFs to keep token usage predictable.
- `userReports` documents are stored with `uid`, `fileName`, `createdAt`, `sourceExcerpt`, `sourceLength`, and `report`.
