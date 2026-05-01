ShipTask — Team Task Manager
A full-stack collaborative task management web application built for teams. Create projects, assign tasks, track progress, and manage team members — all with role-based access control.

Live Demo
[Your deployed URL here — e.g. https://shiptask.replit.app]

Features
Authentication
Secure sign-up and login powered by Clerk
Persistent sessions across page refreshes
Branded sign-in / sign-up pages
Projects
Create projects with a name, description, and color label
View all projects you belong to with live task stats (total, completed, overdue)
Archive or delete projects (Admin only)
Task Management
Create tasks with title, description, priority, status, assignee, and due date
Update task status: To Do → In Progress → Done
Set priority: Low / Medium / High
Assign tasks to any project member
Filter tasks by status, priority, or assignee
Role-Based Access Control
Admin — full control: manage project settings, add/remove members, change roles
Member — can view and work on tasks within the project
Dashboard
Overview stats: total projects, tasks by status, tasks by priority
Completion rate percentage
Overdue task count
Recent activity feed (who did what and when)
My Tasks
Single view of all tasks assigned to you across every project
Filterable by status
Tech Stack
Layer	Technology
Frontend	React 18 + Vite + TypeScript
Styling	Tailwind CSS + shadcn/ui
State / Data	TanStack React Query
Routing	Wouter
Authentication	Clerk
Backend	Node.js + Express 5 + TypeScript
Database	PostgreSQL + Drizzle ORM
Validation	Zod
API Contract	OpenAPI 3.1 + Orval (codegen)
Build	esbuild
Monorepo	pnpm workspaces
REST API Endpoints
Method	Endpoint	Description
GET	/api/healthz	Health check
GET	/api/users/me	Get current user profile
PUT	/api/users/me	Update current user profile
GET	/api/projects	List all projects for current user
POST	/api/projects	Create a new project
GET	/api/projects/:id	Get project details + members
PUT	/api/projects/:id	Update a project (Admin only)
DELETE	/api/projects/:id	Delete a project (Admin only)
GET	/api/projects/:id/members	List project members
POST	/api/projects/:id/members	Add a member by email (Admin only)
PUT	/api/projects/:id/members/:userId	Update member role (Admin only)
DELETE	/api/projects/:id/members/:userId	Remove a member (Admin only)
GET	/api/projects/:id/tasks	List tasks (filterable)
POST	/api/projects/:id/tasks	Create a task
GET	/api/projects/:id/tasks/:taskId	Get a task
PUT	/api/projects/:id/tasks/:taskId	Update a task
DELETE	/api/projects/:id/tasks/:taskId	Delete a task
GET	/api/dashboard/summary	Dashboard stats
GET	/api/dashboard/my-tasks	Tasks assigned to current user
GET	/api/dashboard/overdue	Overdue tasks
GET	/api/dashboard/activity	Recent activity feed
Database Schema
users
  id, clerk_id, email, name, avatar_url, created_at, updated_at
projects
  id, name, description, color, status (active|archived), created_by_id, created_at, updated_at
project_members
  user_id, project_id, role (admin|member), joined_at
tasks
  id, project_id, title, description, status (todo|in_progress|done),
  priority (low|medium|high), assignee_id, created_by_id, due_date, created_at, updated_at
activity_logs
  id, task_id, project_id, actor_id, action, metadata, created_at

Project Structure
/
├── artifacts/
│   ├── api-server/         # Express 5 REST API
│   │   └── src/
│   │       ├── routes/     # users, projects, members, tasks, dashboard
│   │       └── middlewares/# requireAuth, clerkProxy
│   └── task-manager/       # React + Vite frontend
│       └── src/
│           ├── pages/      # Dashboard, Projects, MyTasks, SignIn, SignUp, Landing
│           └── components/ # UI components
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod validation schemas
│   └── db/                 # Drizzle ORM schema + database connection
└── pnpm-workspace.yaml

Running Locally
Prerequisites
Node.js 20+
pnpm
PostgreSQL database
Setup
# Clone the repo
git clone <your-repo-url>
cd <repo-name>
# Install dependencies
pnpm install
# Set environment variables
cp .env.example .env
# Fill in: DATABASE_URL, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY
# Push database schema
pnpm --filter @workspace/db run push
# Start the API server
pnpm --filter @workspace/api-server run dev
# Start the frontend (in a separate terminal)
pnpm --filter @workspace/task-manager run dev

Environment Variables
Variable	Description
DATABASE_URL	PostgreSQL connection string
CLERK_SECRET_KEY	Clerk server-side secret key
CLERK_PUBLISHABLE_KEY	Clerk publishable key
VITE_CLERK_PUBLISHABLE_KEY	Clerk publishable key (frontend)
SESSION_SECRET	Express session secret
