import { Router } from "express";
import { db, tasksTable, projectsTable, usersTable, projectMembersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getOrCreateUser } from "./users";
import { getProjectMembership } from "./projects";
import type { Request, Response } from "express";

const router = Router();

async function buildTaskResponse(
  task: typeof tasksTable.$inferSelect,
  projectName: string,
  projectColor: string,
) {
  let assigneeName: string | null = null;
  let assigneeAvatarUrl: string | null = null;
  let assigneeClerkId: string | null = null;

  if (task.assigneeId) {
    const assignee = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, task.assigneeId),
    });
    if (assignee) {
      assigneeName = assignee.name;
      assigneeAvatarUrl = assignee.avatarUrl ?? null;
      assigneeClerkId = assignee.clerkId;
    }
  }

  return {
    id: task.id,
    projectId: task.projectId,
    projectName,
    projectColor,
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId ?? null,
    assigneeName,
    assigneeAvatarUrl,
    assigneeClerkId,
    dueDate: task.dueDate ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

// GET /projects/:projectId/tasks
router.get("/projects/:projectId/tasks", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const { status, assigneeId } = req.query as { status?: string; assigneeId?: string };

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

    const conditions = [eq(tasksTable.projectId, projectId)];
    if (status) {
      conditions.push(eq(tasksTable.status, status as "todo" | "in_progress" | "done"));
    }
    if (assigneeId) {
      conditions.push(eq(tasksTable.assigneeId, parseInt(assigneeId)));
    }

    const tasks = await db.query.tasksTable.findMany({
      where: and(...conditions),
    });

    const result = await Promise.all(
      tasks.map((t) => buildTaskResponse(t, project.name, project.color)),
    );
    res.json(result);
  } catch (err) {
    req.log.error(err, "Error listing tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /projects/:projectId/tasks
router.post("/projects/:projectId/tasks", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const { title, description, status, priority, assigneeId, dueDate } = req.body as {
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done";
    priority: "low" | "medium" | "high";
    assigneeId?: number | null;
    dueDate?: string | null;
  };

  if (!title || !status || !priority) {
    res.status(400).json({ error: "title, status, and priority are required" });
    return;
  }

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

    const [task] = await db
      .insert(tasksTable)
      .values({
        projectId,
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId ?? undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      })
      .returning();

    const response = await buildTaskResponse(task!, project.name, project.color);
    res.status(201).json(response);
  } catch (err) {
    req.log.error(err, "Error creating task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /projects/:projectId/tasks/:taskId
router.get("/projects/:projectId/tasks/:taskId", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const taskId = parseInt(req.params["taskId"]!);

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const task = await db.query.tasksTable.findFirst({
      where: and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)),
    });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const project = await db.query.projectsTable.findFirst({
      where: eq(projectsTable.id, projectId),
    });

    const response = await buildTaskResponse(task, project!.name, project!.color);
    res.json(response);
  } catch (err) {
    req.log.error(err, "Error getting task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /projects/:projectId/tasks/:taskId
router.put("/projects/:projectId/tasks/:taskId", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const taskId = parseInt(req.params["taskId"]!);
  const { title, description, status, priority, assigneeId, dueDate } = req.body as {
    title?: string;
    description?: string | null;
    status?: "todo" | "in_progress" | "done";
    priority?: "low" | "medium" | "high";
    assigneeId?: number | null;
    dueDate?: string | null;
  };

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

    const [updated] = await db
      .update(tasksTable)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId ?? undefined }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : undefined }),
        updatedAt: new Date(),
      })
      .where(and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const response = await buildTaskResponse(updated, project.name, project.color);
    res.json(response);
  } catch (err) {
    req.log.error(err, "Error updating task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /projects/:projectId/tasks/:taskId
router.delete("/projects/:projectId/tasks/:taskId", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const taskId = parseInt(req.params["taskId"]!);

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await db.delete(tasksTable).where(
      and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)),
    );
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Error deleting task");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tasks/my
router.get("/tasks/my", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;

  try {
    const user = await getOrCreateUser(clerkUserId);

    const tasks = await db
      .select({
        task: tasksTable,
        projectName: projectsTable.name,
        projectColor: projectsTable.color,
      })
      .from(tasksTable)
      .innerJoin(projectsTable, eq(projectsTable.id, tasksTable.projectId))
      .innerJoin(projectMembersTable, and(
        eq(projectMembersTable.projectId, tasksTable.projectId),
        eq(projectMembersTable.userId, user.id),
      ))
      .where(eq(tasksTable.assigneeId, user.id));

    const result = tasks.map(({ task, projectName, projectColor }) => ({
      id: task.id,
      projectId: task.projectId,
      projectName,
      projectColor,
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? null,
      assigneeName: user.name,
      assigneeAvatarUrl: user.avatarUrl ?? null,
      assigneeClerkId: user.clerkId,
      dueDate: task.dueDate ?? null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err, "Error getting my tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
