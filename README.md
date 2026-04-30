# TaskFlow — Team Task Manager

A full-stack team productivity app with role-based access control, Kanban task tracking, and real-time dashboards.

![TaskFlow Screenshot](https://via.placeholder.com/800x400/0f0f12/f59e0b?text=TaskFlow+Dashboard)

## ✨ Features

- **Authentication** — JWT-based signup/login with role selection (Admin / Member)
- **Projects** — Create, edit, delete projects with team management
- **Kanban Board** — Drag-free visual task board with status columns (To Do → In Progress → In Review → Done)
- **Task Management** — Create tasks with priority, due dates, assignees, descriptions
- **Role-Based Access Control**
  - **Admin**: Full access to all projects, tasks, and members
  - **Project Admin**: Manage members and tasks within their project
  - **Member**: View and update tasks in projects they belong to
- **Dashboard** — Stats, overdue alerts, my tasks, recent activity, completion progress

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Deployment | Railway |

## 📁 Project Structure

```
team-task-manager/
├── server/
│   ├── index.js              # Express app entry
│   ├── middleware/auth.js    # JWT + RBAC middleware
│   ├── routes/
│   │   ├── auth.js           # Signup, login, me, users
│   │   ├── projects.js       # CRUD + member management
│   │   ├── tasks.js          # Task CRUD with filtering
│   │   └── dashboard.js      # Aggregated stats
│   └── prisma/schema.prisma  # Database schema
├── client/
│   └── src/
│       ├── pages/            # Dashboard, Projects, ProjectDetail, Login, Signup
│       ├── components/       # Layout, Modals
│       ├── contexts/         # AuthContext
│       └── api/client.js     # API helpers
├── railway.toml              # Deployment config
└── README.md
```

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or use Railway's free PostgreSQL)

### Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd team-task-manager

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# 4. Push database schema
cd server
npx prisma db push

# 5. Start servers (two terminals)
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

## 🌐 Deploy to Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

### Step 2 — Create Railway Project
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository

### Step 3 — Add PostgreSQL
1. In your Railway project, click **+ New** → **Database** → **Add PostgreSQL**
2. Railway auto-injects `DATABASE_URL` into your service

### Step 4 — Set Environment Variables
In your Railway service → **Variables**, add:
```
JWT_SECRET=<generate with: openssl rand -hex 32>
NODE_ENV=production
```

### Step 5 — Run Database Migration
In Railway service → **Shell** (or connect via CLI):
```bash
cd server && npx prisma db push
```

### Step 6 — Deploy
Railway auto-deploys on every push. Your app will be live at the generated `.railway.app` URL.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Auth | Get current user |
| GET | `/api/auth/users` | Auth | List all users |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Auth | List accessible projects |
| POST | `/api/projects` | Auth | Create project |
| GET | `/api/projects/:id` | Member+ | Get project details |
| PUT | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Project Admin | Delete project |
| POST | `/api/projects/:id/members` | Project Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin | Remove member |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks/mine` | Auth | My assigned tasks |
| GET | `/api/tasks/project/:id` | Member+ | Tasks in a project |
| POST | `/api/tasks` | Member+ | Create task |
| PUT | `/api/tasks/:id` | Creator/Admin | Update task |
| DELETE | `/api/tasks/:id` | Creator/Admin | Delete task |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard` | Auth | Stats, overdue, recent |

---

## 🔒 RBAC Summary

| Action | Admin | Project Admin | Member |
|--------|-------|---------------|--------|
| See all projects | ✅ | ❌ | ❌ |
| Create project | ✅ | ✅ | ✅ |
| Edit/delete project | ✅ | ✅ (own) | ❌ |
| Add/remove members | ✅ | ✅ (own) | ❌ |
| Create task | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ✅ (own project) | ❌ |
| Edit own task | ✅ | ✅ | ✅ |
| Delete own task | ✅ | ✅ | ✅ |

## 📸 Demo Walkthrough
1. Sign up as **Admin** (or Member)
2. Create a project
3. Add team members via Projects → Open → Members tab
4. Create tasks, assign them, set due dates and priorities
5. Drag tasks between Kanban columns (click status dropdown on each card)
6. Check Dashboard for overview, overdue alerts, and completion progress
