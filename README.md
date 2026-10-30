# UPPCL Task & Requirement Management Portal

Enterprise-grade **Task & Requirement Management System** built with Next.js 14 App Router, Tailwind CSS, Lucide Icons, Prisma ORM, and Google Gemini AI integration.

The portal provides complete two-way traceability between original requirement documents (Google Docs, DOCX, PDF, XLSX, TXT), AI-extracted requirements, generated actionable tasks, assigned team members, and final deliverables.

---

## 🌟 Key Features

### 1. User Management & Role-Based Access (RBAC)
- **Administrator**: Full administrative control across projects, tasks, user roles, system settings, and database maintenance.
- **Manager**: Manage projects, create and assign tasks, upload requirement documents, and oversee team workloads.
- **User / Employee**: View assigned tasks, transition workflow statuses, upload deliverables, and add remarks.
- **Instant Role Switcher**: Interactive persona switcher in the top navigation header to seamlessly test all roles in real-time.

### 2. Main Executive Dashboard
- **10 Dynamic KPI Cards**: Total Tasks, Pending Tasks, In Progress Tasks, Completed Tasks, Overdue Tasks, Tasks Due Today, Upcoming Tasks (7d), Active Projects, Requirement Documents, and Requirements Awaiting Task Creation.
- **7 Visualizations (Recharts)**:
  - Task Status Distribution (Donut Chart)
  - Priority-wise Task Distribution (Bar Chart)
  - Weekly Task Completion Velocity (Line Chart)
  - User-wise Task Allocation (Bar Chart)
  - Project-wise Completion Progress (Progress Bars)
  - Monthly Delivery Velocity (Trend Line)
  - Overdue Tasks Severity Summary
- **Live Widgets**: Upcoming Deadlines, Overdue Task Alerts, and Real-Time System Activity Audit Log.

### 3. Core Task Management & Workflow Progression
- **Comprehensive Fields**: Auto-generated Task ID (`TSK-xxx`), title, description, project, category, assignee, priority (Critical/High/Medium/Low), status, start date, due date, completion date, deliverables, remarks, source references, and recurring rules.
- **Workflow Enforcement**: `Not Started → In Progress → On Hold → In Progress → Completed` (with `Cancelled` available).
- **Task Dependencies**: Enforces prerequisite task completion before dependent tasks can transition to `In Progress` or `Completed`.
- **Recurring Schedule**: Daily, Weekly, Monthly, and Yearly recurrence schedules with automatic generation of next occurrences upon completion.
- **Audit Logging**: Every status transition, priority elevation, deadline adjustment, or reassignment is tracked with timestamp and user remarks.

### 4. Multiple Task Views
- **List View**: Professional tabular listing with multi-axis search (Task ID, title, description, project, assignee), filters, pagination, and CSV export.
- **Kanban Board**: Drag-and-drop workflow columns (`Not Started`, `In Progress`, `On Hold`, `Completed`, `Cancelled`) with instant status updates and dependency checks.
- **Calendar View**: Deadline calendar with Month and Week views, color-coded priority indicators, and overdue warnings.
- **Timeline / Gantt View**: Visual task duration bars, commencement schedules, and prerequisite links.

### 5. Requirement Document Management
- **Supported Formats**: Microsoft Word (`.docx`), PDF (`.pdf`), Excel (`.xlsx`, `.xls`), Text/Markdown (`.txt`, `.md`), and direct Google Docs import.
- **Google Drive Integration**: Import documents via Google Docs URL or Document ID with authorized Drive API OAuth 2.0 integration.
- **Document Repository**: Document ID (`DOC-xxxx`), versions, upload history, raw text viewer, and fulfillment metrics.

### 6. AI Requirement Analysis & Task Generation
- **Intelligent Engine**: Powered by Google Gemini AI with built-in resilient heuristic structural NLP fallback (works out of the box even without an API key).
- **Capabilities**: Extracts overall objectives, decomposes complex requirements into actionable implementation tasks, detects missing deadlines and ambiguities.
- **Interactive Review Screen**: AI never creates tasks without human approval. Review, edit, add manual tasks, and approve individual or all tasks into the Task Tracker.

### 7. Two-Way Requirement-to-Task Traceability
- **Task Detail View**: Displays parent requirement, source document, relevant section/page reference, and sibling tasks under the same requirement.
- **Requirement View**: Displays all generated tasks, task statuses, assignees, and real-time fulfillment percentage.

### 8. Document Revision & Change Detection
- **Revision Comparison Engine**: Compare v1 against revised v2 documents.
- **Change Breakdown**: Identifies `Added`, `Modified`, `Removed`, and `Unchanged` requirements.
- **Task Impact Analysis**: Discovers existing tasks in the database affected by revised specifications and generates recommendations.

### 9. Notifications & Automated Reminders
- Internal notification center with unread counter badge.
- Automated alerts for task assignments, reassignments, approaching deadlines, overdue tasks, and completed AI document analyses.

### 10. Reports & Analytics
- 12 comprehensive analytical reports (Overall Task Summary, User Performance, Project Progress, Requirement Fulfillment, Document Generation, etc.).
- One-click Excel/CSV export and printer-ready layout.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) / React 18 |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Next.js API Routes / Node.js |
| Database | SQLite (PostgreSQL compatible) |
| ORM | Prisma ORM |
| AI Integration | Google Gemini API (`@google/generative-ai`) |
| Document Processing | `mammoth` (DOCX), `pdf-parse` (PDF), `xlsx` (Excel) |
| Charts | Recharts |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+ or v20+
- npm v10+

### 2. Setup & Installation
```bash
git clone https://github.com/ritikd108/UPPCLTaskManager.git
cd UPPCLTaskManager
npm install
```

### 3. Database Initialization & Seed
Initialize the database and populate it with realistic demonstration data (Projects, Users, Requirement Documents, Tasks, Dependencies, Comments, and Notifications):
```bash
npx prisma db push
node prisma/seed.js
```
*(Or click the "Reset & Reseed Demo Database" button inside the Administrative Settings page)*

### 4. Running the Application
To run in development mode:
```bash
npm run dev
```
To run in production mode:
```bash
npm run build
npm start
```

Open your browser at:
```
http://localhost:3000
```

---

## 🔑 Configuration & API Keys

### Google Gemini API Setup
1. Navigate to the **Settings** menu (`/settings`).
2. Paste your Google Gemini API Key in the field and click **Save Configuration**.
3. *Note*: The portal features an intelligent structural heuristic parser that works immediately without any API key, and seamlessly upgrades to live Gemini models when a key is provided.

### Google Drive API & OAuth 2.0 Setup
1. In Google Cloud Console, enable **Google Drive API** and **Google Docs API**.
2. Create an **OAuth 2.0 Client ID** (Web Application).
3. Add `http://localhost:3000` to Authorized JavaScript Origins and Redirect URIs.
4. Paste the Client ID into the Settings page.

---

## 👥 Seed Accounts for Testing

Use the **Persona / Role Switcher** in the top navigation bar to switch between user roles instantly:

| Name | Role | Email | Designation |
|---|---|---|---|
| **Sarah Jenkins** | Administrator | `admin@portal.com` | Principal Project Director |
| **Alex Rivera** | Manager | `manager@portal.com` | Senior Technical Project Manager |
| **David Chen** | User / Employee | `dev@portal.com` | Senior Full-Stack Engineer |
| **Elena Rostova** | User / Employee | `qa@portal.com` | Lead Test Automation Specialist |
