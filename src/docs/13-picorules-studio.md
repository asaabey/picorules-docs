# Picorules Studio

Picorules Studio is a web-based IDE for authoring, compiling, and testing clinical decision support ruleblocks. It provides a complete development environment with real-time SQL compilation, mock data generation, and database execution.

## Features

- **Monaco Code Editor** — Full-featured editor with Picorules syntax highlighting, autocomplete, and error detection
- **Live SQL Compilation** — See the compiled SQL (Oracle, MSSQL, PostgreSQL) update as you type
- **Workspace Management** — Organise ruleblocks into projects with persistent storage
- **Mock Data Generation** — Generate synthetic EADV patient data for testing without a clinical database
- **Database Execution** — Run compiled SQL against a Neon PostgreSQL database and see results in real-time
- **User Authentication** — Secure access via Clerk authentication

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Editor | Monaco Editor |
| Auth | Clerk |
| Database | Neon PostgreSQL + Drizzle ORM |
| State | Zustand |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Clerk](https://clerk.com) account (authentication)
- A [Neon](https://neon.tech) PostgreSQL database (execution)

### Setup

```bash
# Clone
git clone https://github.com/asaabey/picorules-studio.git
cd picorules-studio
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Clerk and Neon credentials

# Initialise database schema
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Neon PostgreSQL
PG_HOST=your-project.neon.tech
PG_PORT=5432
PG_DATABASE=neondb
PG_USER=your-user
PG_PASSWORD=your-password
```

## Workflow

### 1. Create a Workspace

Workspaces organise related ruleblocks. Create one for a clinical domain (e.g., "CKD Management", "Diabetes Screening").

### 2. Write Ruleblocks

Use the Monaco editor to write `.prb` ruleblocks. The editor provides:

- Syntax highlighting for Picorules keywords (`#define_ruleblock`, `eadv`, `.last()`, `.bind()`)
- Auto-indentation
- Bracket matching
- Error markers for invalid syntax

### 3. Compile to SQL

Click **Compile** to generate SQL for your target dialect. The compiled SQL updates in real-time as you edit.

```sql
-- Example compiled output (PostgreSQL)
CREATE TABLE IF NOT EXISTS SROUT_ckd_check AS
SELECT
  eid,
  (SELECT val FROM eadv WHERE att = 'lab_bld_egfr'
   AND eid = e.eid ORDER BY dt DESC LIMIT 1) AS egfr_last,
  ...
FROM (SELECT DISTINCT eid FROM eadv) e;
```

### 4. Generate Mock Data

Click **Generate Mock Data** to create synthetic EADV records for testing. The mocker analyses your ruleblock to determine which attributes are needed and generates clinically realistic values.

### 5. Execute and View Results

Click **Execute** to run the compiled SQL against your Neon database. Results are displayed in an interactive table showing computed variables for each patient.

## Deployment

### Docker

```bash
docker build -t picorules-studio .
docker run -p 3000:3000 --env-file .env picorules-studio
```

### PM2 (Production)

```bash
npm run build
pm2 start npm --name "picorules-studio" -- start
```

## Source Code

[github.com/asaabey/picorules-studio](https://github.com/asaabey/picorules-studio)
