# TaskFlow — Team Task Manager

## Overview

A full-stack team task management web application with role-based access control, built on a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Authentication**: Clerk (managed via Replit)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui

## Features

- **Authentication**: Sign up / sign in via Clerk (email + Google)
- **Projects**: Create, update, archive, and delete projects
- **Team Management**: Add/remove members, assign roles (Admin/Member)
- **Tasks**: Create, assign, set priority (low/medium/high), track status (todo/in_progress/done), set due dates
- **Role-Based Access**: Admins can manage members and delete projects; members can manage tasks
- **Dashboard**: Summary stats, overdue tasks, recent activity, per-project breakdowns
- **My Tasks**: View all tasks assigned to the current user

## Artifacts

- `artifacts/task-manager` — React + Vite frontend (preview path: `/`)
- `artifacts/api-server` — Express API server (preview path: `/api`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Database Schema

- `users` — user profiles (clerkId, name, email, avatarUrl)
- `projects` — projects (name, description, color, status, ownerClerkId)
- `project_members` — join table (projectId, userId, role: admin|member)
- `tasks` — tasks (projectId, title, description, status, priority, assigneeId, dueDate)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY` — Clerk server secret (auto-provisioned)
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key (auto-provisioned)
- `VITE_CLERK_PUBLISHABLE_KEY` — same, exposed to frontend

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
