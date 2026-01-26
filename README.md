# AI-Driven Recruitment Platform (AI Recruiter)

This project is a comprehensive AI-powered recruitment platform designed to automate and enhance the hiring process. It manages everything from job creation and candidate invitation to automated AI interviews with real-time proctoring and detailed analytics.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescript.org/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI Integration**: OpenAI / Custom AI modules for interview generation and scoring
- **Styling**: Tailwind CSS
- **Infrastructure**: Modular architecture with separate logic layers (`modules`), infra services, and background workers.

---

## 🏗️ Project Structure

The project follows a clean, modular architecture:

- `app/`: Next.js App Router containing all pages and API routes.
  - `(dashboard)/`: Recruiter/Admin dashboard interface.
  - `candidate/`: Candidate-facing interface for interviews.
  - `api/`: Backend API endpoints.
- `modules/`: Core business logic separated into domain-specific services (Jobs, Interviews, Assessment, etc.).
- `prisma/`: Database schema definitions using Prisma.
- `infra/`: Infrastructure-level services (Storage, AI clients, etc.).
- `workers/`: Background processes for handling intensive tasks like AI processing.

---

## 🔄 System Flow & Connectivity

### 1. Recruiter Flow (The "Source")
1.  **Job Creation**: Recruiter creates a `Job` posting with specific skills and requirements.
2.  **Round Configuration**: Recruiter defines `InterviewRound` sequence (e.g., Online Assessment -> Technical -> HR).
3.  **Candidate Invitation**: Recruiter sends invites to candidates via email. A unique token is generated for each `Invite`.
4.  **Analytics**: Recruiter monitors the `pipeline` and views detailed `report` and `scoring` for each candidate.

### 2. Candidate Flow (The "Experience")
1.  **Invite Consumption**: Candidate clicks the invite link, validating the token via `/api/invites/validate/[token]`.
2.  **Session Initiation**: Upon validation, an `InterviewSession` is created (`/api/invites/consume`).
3.  **Interview Progression**:
    -   Candidate is routed to the current round (`OA`, `TECHNICAL`, or `HR`) via `app/candidate/interviews/[sessionId]/page.tsx`.
    -   The frontend calls `/api/candidate/interviews/[session_id]/state` to determine the current progress.
4.  **Proctoring**: During the interview, real-time proctoring (TAB_SWITCH, FACE_DETECT, etc.) events are sent to `/api/proctoring/events`.
5.  **Completion**: Once all rounds are finished, the session status is updated to `ENDED`.

---

## 📡 API Endpoints (The "Engine")

The project exposes a rich set of APIs to facilitate the flow:

### 💼 Jobs & Recruitment
- `POST /api/jobs`: Create a new job.
- `GET /api/jobs/[jobId]/pipeline`: Fetch all candidates and their statuses for a specific job.
- `GET /api/jobs/[jobId]/analytics`: Get performance metrics for a job.

### 📧 Invitations
- `POST /api/invites`: Send interview invitations.
- `GET /api/invites/validate/[token]`: Check if an invite token is valid.
- `POST /api/invites/consume`: Process the invite and start a candidate session.

### 🎙️ Interview Operations
- `GET /api/interviews/[id]/state`: Get current session progress and metadata.
- `POST /api/interviews/[id]/end`: Forcefully end an interview session.
- `GET /api/interviews/[id]/report`: Generate/Fetch the final interview report.

### 🤖 AI & Content
- `POST /api/ai/generate-questions`: Use AI to generate relevant questions based on job description.
- `GET /api/rounds/[roundSessionId]/questions`: Fetch active questions for a specific round.
- `POST /api/rounds/[roundSessionId]/submit`: Submit candidate answers for AI evaluation.

### 🛡️ Security & Monitoring
- `POST /api/proctoring/events`: Log proctoring violations during an interview.
- `GET /api/getToken`: Generate temporary security tokens for AI/Media interactions.

---

## 💾 Database Overview (Prisma Concepts)

Key models that drive the system:
- **`User` / `Company`**: The core entities for multi-tenant access.
- **`Job` / `InterviewRound`**: Defines the recruitment requirements.
- **`InterviewSession`**: Linkage between a `Candidate`, a `Job`, and their `Resume`.
- **`RoundSession`**: Tracks specific performance within a single round.
- **`ProctoringEvent`**: Records any suspicious activity during interviews.

---

## 🛠️ Connectivity: Frontend to Backend

The frontend connects to the backend using a combination of **Server Actions** (for direct server-side mutations) and the **Service Layer** pattern:

1.  **Service Layer (`modules/`)**: Shared logic used by both API routes and Server Components.
2.  **State Management**: Real-time status updates are handled by polling or state API calls (`/state`) to ensure the UI reflects the current interview phase.
3.  **Context-Driven Routing**: The `InterviewController` manages candidate redirection based on the dynamic state of their `InterviewSession`.
