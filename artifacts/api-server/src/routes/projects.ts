import { Router } from "express";
import { db, projectsTable, projectMembersTable, tasksTable, usersTable } from "@workspace/db";
import { eq, and, sql, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getOrCreateUser } from "./users";
import type { Request, Response } from "express";

const router = Router();

// Helper: check if user is a project member (returns member record or null)
async function getProjectMembership(projectId: number, userId: number) {
  return db.query.projectMembersTable.findFirst({
    where: and(
      eq(projectMembersTable.projectId, projectId),
      eq(projectMembersTable.userId, userId),
    ),
  });
}

// Helper: get project with counts and user's role
async function buildProjectResponse(project: typeof projectsTable.$inferSelect, userId: number) {
  const [taskCountResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(eq(tasksTable.projectId, project.id));

  const [memberCountResult] = await db
    .select({ count: count() })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.projectId, project.id));

  const [completedCountResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.projectId, project.id), eq(tasksTable.status, "done")));

  const membership = await getProjectMembership(project.id, userId);

  return {
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    color: project.color,
    status: project.status,
    ownerClerkId: project.ownerClerkId,
    taskCount: Number(taskCountResult?.count ?? 0),
    memberCount: Number(memberCountResult?.count ?? 0),
    completedCount: Number(completedCountResult?.count ?? 0),
    myRole: membership?.role ?? "member",
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

// GET /projects
router.get("/projects", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  try {
    const user = await getOrCreateUser(clerkUserId);
    // Get projects where user is a member
    const memberships = await db.query.projectMembersTable.findMany({
      where: eq(projectMembersTable.userId, user.id),
      with: { project: true },
    });

    const projects = await Promise.all(
      memberships.map((m) => buildProjectResponse(m.project, user.id)),
    );
    res.json(projects);
  } catch (err) {
    req.log.error(err, "Error listing projects");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /projects
router.post("/projects", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const { name, description, color } = req.body as { name: string; description?: string; color: string };

  if (!name || !color) {
    res.status(400).json({ error: "name and color are required" });
    return;
  }

  try {
    const user = await getOrCreateUser(clerkUserId);
    const [project] = await db
      .insert(projectsTable)
      .values({ name, description, color, ownerClerkId: clerkUserId })
      .returning();

    // Add the creator as admin
    await db.insert(projectMembersTable).values({
      projectId: project!.id,
      userId: user.id,
      role: "admin",
    });

    const response = await buildProjectResponse(project!, user.id);
    res.status(201).json(response);
  } catch (err) {
    req.log.error(err, "Error creating project");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /projects/:projectId
router.get("/projects/:projectId", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const project = await db.query.projectsTable.findFirst({
      where: eq(projectsTable.id, projectId),
    });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const base = await buildProjectResponse(project, user.id);

    // Get members with user info
    const members = await db
      .select({
        id: projectMembersTable.id,
        projectId: projectMembersTable.projectId,
        userId: projectMembersTable.userId,
        clerkId: usersTable.clerkId,
        name: usersTable.name,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        role: projectMembersTable.role,
        joinedAt: projectMembersTable.joinedAt,
      })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(eq(projectMembersTable.projectId, projectId));

    // Get tasks with assignee info
    const tasks = await db
      .select({
        id: tasksTable.id,
        projectId: tasksTable.projectId,
        title: tasksTable.title,
        description: tasksTable.description,
        status: tasksTable.status,
        priority: tasksTable.priority,
        assigneeId: tasksTable.assigneeId,
        assigneeName: usersTable.name,
        assigneeAvatarUrl: usersTable.avatarUrl,
        assigneeClerkId: usersTable.clerkId,
        dueDate: tasksTable.dueDate,
        createdAt: tasksTable.createdAt,
        updatedAt: tasksTable.updatedAt,
      })
      .from(tasksTable)
      .leftJoin(usersTable, eq(usersTable.id, tasksTable.assigneeId))
      .where(eq(tasksTable.projectId, projectId));

    res.json({
      ...base,
      members: members.map((m) => ({
        ...m,
        avatarUrl: m.avatarUrl ?? null,
      })),
      tasks: tasks.map((t) => ({
        ...t,
        projectName: project.name,
        projectColor: project.color,
        description: t.description ?? null,
        assigneeId: t.assigneeId ?? null,
        assigneeName: t.assigneeName ?? null,
        assigneeAvatarUrl: t.assigneeAvatarUrl ?? null,
        assigneeClerkId: t.assigneeClerkId ?? null,
        dueDate: t.dueDate ?? null,
      })),
    });
  } catch (err) {
    req.log.error(err, "Error getting project");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /projects/:projectId
router.put("/projects/:projectId", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const { name, description, color, status } = req.body as {
    name?: string;
    description?: string;
    color?: string;
    status?: "active" | "archived";
  };

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership || membership.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [updated] = await db
      .update(projectsTable)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      })
      .where(eq(projectsTable.id, projectId))
      .returning();

    const response = await buildProjectResponse(updated!, user.id);
    res.json(response);
  } catch (err) {
    req.log.error(err, "Error updating project");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /projects/:projectId
router.delete("/projects/:projectId", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership || membership.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Error deleting project");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { getProjectMembership };
export default router;
