# Talent Flow — Real-Time Multi-Candidate Technical Assessment Platform

**Talent Flow** is a production-grade full-stack platform that enables technical interviewers to create assessments, invite multiple candidates to participate simultaneously in isolated live coding rooms, execute candidate code securely, run AI evaluations on submissions, monitor browser proctoring incidents in real time, and generate individual candidate PDF reports.

---

## Technical Stack

- **Frontend**: React.js, Vite, Monaco Editor (`@monaco-editor/react`), Socket.io Client, WebRTC, Vanilla CSS design system (Glassmorphism & dark mode tokens).
- **Backend**: Node.js, Express, Socket.io Server, Child Process execution sandbox, `pdfkit` (PDF generation), `archiver` (ZIP exports).
- **Database & ORM**: MySQL (`talent` database), Prisma ORM v5.
- **AI Engine**: Groq API (`llama-3.3-70b-versatile`) with backend-only API key security and heuristic fallback logic.
- **Security**: JWT authentication, bcryptjs password hashing, helmet, express-rate-limit, CORS, multi-candidate room isolation guard, role-based authorization.

---

## System Architecture

```text
                               TALENT FLOW
                                    │
               ┌────────────────────┴────────────────────┐
               │                                         │
         INTERVIEWER                                 CANDIDATES
               │                                         │
         Dashboard                                   Candidate UI
               │                                         │
         Assessments                                 Live Room
               │                                         │
         Question Bank                             Monaco Editor
               │                                         │
         Candidate Mgmt                             WebRTC Feed
               │                                         │
               └────────────────────┬────────────────────┘
                                    │
                              Node / Express
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
            Prisma               Socket.io             WebRTC
               │                    │
               ▼                    │
             MySQL                  │
               │                    │
       ┌───────┼────────┐           │
       │       │        │           │
  Submissions AI Eval Proctoring   Live Broadcasts
       │       │        │
       └───────┼────────┘
               │
         Report Service
               │
          PDF Generation
```

---

## Database Architecture (`schema.prisma`)

```text
User (INTERVIEWER / CANDIDATE)
 └── Assessment (title, duration, startTime, status)
      ├── AssessmentCandidate (link to User)
      ├── AssessmentQuestion (link to Question)
      └── AssessmentSession (currentCode, language, timer, status)
           ├── Submission (code, language, status, executionTime)
           │    ├── CodeExecution (stdout, stderr, exitCode, timedOut)
           │    └── AIEvaluation (correctness, codeQuality, efficiency, problemSolving, overallScore)
           ├── ProctoringIncident (eventType, severity, warningNumber)
           ├── Feedback (technicalKnowledge, problemSolving, communication, comments)
           └── Report (overallScore, summary, status, filePath, fileName)
```

---

## Environment Variables (`backend/.env`)

```env
PORT=5001
CLIENT_URL=http://localhost:5173
DATABASE_URL="mysql://root:root@localhost:3306/talent"
JWT_SECRET="talent_flow_super_secret_jwt_key_2026"
GROQ_API_KEY=""
GROQ_MODEL="llama-3.3-70b-versatile"

MAX_CODE_SIZE=50000
MAX_EXECUTION_TIME=5000
MAX_OUTPUT_SIZE=10240
```

---

## API Documentation Overview

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | User authentication & JWT issuance |
| `POST` | `/api/auth/register` | Public | Candidate account registration |
| `GET` | `/api/candidates` | Interviewer | List candidates (paginated) |
| `POST` | `/api/candidates` | Interviewer | Create new candidate profile |
| `GET` | `/api/questions` | Interviewer | List question bank problems |
| `POST` | `/api/questions` | Interviewer | Add question to bank |
| `POST` | `/api/assessments` | Interviewer | Create assessment & assign candidates/questions |
| `POST` | `/api/assessments/:id/start` | Interviewer | Start assessment & notify candidates |
| `POST` | `/api/assessments/:id/session` | Candidate | Join candidate assessment session |
| `POST` | `/api/code/execute` | Authenticated | Execute code in isolated child process sandbox |
| `POST` | `/api/submissions` | Candidate | Submit code & trigger async AI evaluation |
| `POST` | `/api/proctoring/incidents` | Candidate | Log browser proctoring incident & emit alert |
| `POST` | `/api/feedback` | Interviewer | Add qualitative ratings & comments for candidate |
| `GET` | `/api/reports` | Authenticated | List candidate reports (role-restricted) |
| `GET` | `/api/reports/:id` | Authenticated | View single report (ownership guarded) |
| `GET` | `/api/reports/:id/pdf` | Authenticated | Stream candidate report PDF file |
| `GET` | `/api/reports/assessment/:id/download-all` | Interviewer | Download ZIP archive of all candidate PDFs |

---

## Socket.io Event Registry

| Event Name | Direction | Room Target | Purpose |
|---|---|---|---|
| `assessment:join` | Client -> Server | N/A | Join interviewer assessment room |
| `session:join` | Client -> Server | N/A | Join candidate session room |
| `session:code-changed` | Client -> Server / Server -> Client | `session_<sessionId>` | Stream Monaco editor code updates |
| `proctoring:alert` | Server -> Client | `assessment_<id>` | Live proctoring incident alert ticker |
| `submission:created` | Server -> Client | `assessment_<id>` | Candidate submission notification |
| `evaluation:completed` | Server -> Client | `assessment_<id>` | AI evaluation completed alert |
| `webrtc:offer` / `answer` / `ice-candidate` | Bidirectional | `session_<sessionId>` | Isolated P2P WebRTC video signaling |

---

## Security & Verification Safeguards

1. **Child Process Code Execution**: Candidate code NEVER executes via `eval()` or inside the main Express process. Isolated `child_process.spawn` with 5s timeout and 10KB truncation.
2. **Backend-Only AI Key**: `GROQ_API_KEY` resides strictly on the backend.
3. **Multi-Candidate Data Isolation**: Candidate A receives HTTP 403 Forbidden if attempting to access Candidate B's session or report.
4. **Non-Disruptive AI Evaluation**: AI failures do not destroy submissions; support manual/retry endpoints.
5. **No Automatic Disqualification**: Proctoring flags present empirical evidence for interviewer review without auto-rejection.

---

## How to Setup & Run

### Prerequisites
- Node.js (v18+)
- MySQL Server running on `localhost:3306` with database named `talent`

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
node src/server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173/` in your browser.

- **Interviewer Demo Credentials**: `admin@gmail.com` / `Admin@123`
- **Candidate Demo Credentials**: `alex@candidate.com` / `Candidate@123`
