# AI Recruiter Platform 🚀

> [!NOTE]
> **Recent Updates (Jan 3-4, 2026)**
> - **AI Proctoring System:** Added real-time monitoring for tab switches, fullscreen exits, and face detection using MediaPipe.
> - **Background Infrastructure:** Integrated **BullMQ** and **Redis** for scalable background job processing (scoring, reporting).
> - **Modular Architecture:** Refactored core logic into dedicated modules (`assessment`, `interview`, `invites`, `jobs`, etc.).
> - **Online Assessment (OA):** Implemented the initial flow for candidate assessments with media permission handling.
> - **Recruiter Dashboard:** Scaffolded the initial recruiter-facing interface.


## Overview

**AI Recruiter** is a cutting-edge recruitment automation platform designed to streamline the hiring process. It solves the critical "real-life" problem of time-consuming manual screening by leveraging Generative AI to parse resumes, conduct interactive voice-based interviews, and generate comprehensive candidate reports.

This application acts as a virtual interviewer, allowing companies to scale their screening process while providing candidates with immediate, unbiased interactions.

## 🌟 Key Features

- **Smart Resume Parsing**: Extracts skills, experience, and candidate details from PDF resumes using advanced parsing and vector embedding (`pdf-parse`, `Pinecone`).
- **AI-Powered Interviews**: Conducts real-time, context-aware interviews tailored to the candidate's resume and job role using **Google Gemini**.
- **Voice Interaction**: Features seamless Speech-to-Text (AssemblyAI) and Text-to-Speech (AWS Polly) for a natural conversational experience.
- **Automated Grading & Reporting**: Generates detailed feedback reports and scores candidates immediately after the interview.
- **Role-Based Access**: Specialized dashboards for **Candidates** (to manage profiles/interviews) and **Company Admins** (to manage jobs/credits).
- **Credit System**: Integrated credit/token usage for managing interview quotas.

## 🛠️ Tech Stack

### Core Framework
- **Frontend/Backend:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **State/Animations:** Framer Motion, React Query

### Data & Storage
- **Database:** PostgreSQL (via [Prisma ORM](https://www.prisma.io/))
- **Vector Database:** [Pinecone](https://www.pinecone.io/) (for RAG context)
- **Authentication:** [Clerk](https://clerk.com/)

### Artificial Intelligence
- **LLM Engine:** Google Generative AI (Gemini)
- **Speech-to-Text:** AssemblyAI
- **Text-to-Speech:** AWS SDK (Polly)

## 📡 API Endpoints

The application exposes several key API endpoints for integration and frontend usage:

### Interviews
- \`GET /api/interviews\`: Retrieve a list of user interviews.
- \`POST /api/interviews\`: Create/Initialize a new interview session.
- \`GET /api/interviews/[id]\`: Get the status and details of a specific interview.
- \`POST /api/interviews/[id]/end\`: Finalize an interview session.
- \`GET /api/interviews/[id]/report\`: Fetch the generated feedback report.

### Uploads & Resources
- \`POST /api/upload\`: Handle PDF resume uploads and parsing.
- \`GET /api/getToken\`: Generate ephemeral tokens for real-time services.
- \`POST /api/query\`: Contextual query against uploaded documents (RAG).

### User Management
- \`GET /api/user\`: Manage user profiles and credit transactions.
- \`GET /api/aiCoach\`: Access AI coaching features.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL Database
- Clerk Account
- API Keys (Gemini, AssemblyAI, AWS, Pinecone)

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/your-username/ai-recruiter.git
   cd ai-recruiter
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables:**
   Create a \`.env\` file in the root directory and add:
   \`\`\`env
   DATABASE_URL="postgresql://..."
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
   CLERK_SECRET_KEY="..."
   GEMINI_API_KEY="..."
   PINECONE_API_KEY="..."
   ASSEMBLYAI_API_KEY="..."
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   \`\`\`

4. **Run Database Migrations:**
   \`\`\`bash
   npx prisma migrate dev
   \`\`\`

5. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📄 License
[MIT](LICENSE)
