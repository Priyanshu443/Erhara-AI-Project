import { Router } from "express";
import { db, tasksTable, projectsTable, projectMembersTable, usersTable } from "@workspace/db";
import { eq, and, lt, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getOrCreateUser } from "./users";
import type { Request, Response } from "express";

const router = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;

  try {
    const user = await getOrCreateUser(clerkUserId);

    // Get all projects the user is a member of
    const memberships = await db.query.projectMembersTable.findMany({
      where: eq(projectMembersTable.userId, user.id),
      with: { project: true },
    });

    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return res.json({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        myAssignedTasks: 0,
        projectBreakdown: [],
      });
    }

    const now = new Date();

    // Aggregate stats per project
    const projectBreakdown = await Promise.all(
      memberships.map(async (m) => {
        const projectTasks = await db.query.tasksTable.findMany({
          where: eq(tasksTable.projectId, m.projectId),
        });

        const total = projectTasks.length;
        const completed = projectTasks.filter((t) => t.status === "done").length;
        const inProgress = projectTasks.filter((t) => t.status === "in_progress").length;
        const todo = projectTasks.filter((t) => t.status === "todo").length;

        return {
          projectId: m.projectId,
          projectName: m.project.name,
          projectColor: m.project.color,
          total,
          completed,
          inProgress,
          todo,
        };
      }),
    );

    const totalTasks = projectBreakdown.reduce((a, p) => a + p.total, 0);
    const completedTasks = projectBreakdown.reduce((a, p) => a + p.completed, 0);
    const inProgressTasks = projectBreakdown.reduce((a, p) => a + p.inProgress, 0);

    // Count overdue tasks across all projects (not done, past due date)
    let overdueTasks = 0;
    for (const pid of projectIds) {
      const overdue = await db.query.tasksTable.findMany({
        where: and(
          eq(tasksTable.projectId, pid),
          lt(tasksTable.dueDate, now),
        ),
      });
      overdueTasks += overdue.filter((t) => t.status !== "done" && t.dueDate !== null).length;
    }

    // Count tasks assigned to me
    const myAssigned = await db.query.tasksTable.findMany({
      where: eq(tasksTable.assigneeId, user.id),
    });
    const myAssignedTasks = myAssigned.length;

    res.json({
      totalProjects: memberships.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      myAssignedTasks,
      projectBreakdown,
    });
  } catch (err) {
    req.log.error(err, "Error getting dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/overdue-tasks
router.get("/dashboard/overdue-tasks", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;

  try {
    const user = await getOrCreateUser(clerkUserId);
    const now = new Date();

    const memberships = await db.query.projectMembersTable.findMany({
      where: eq(projectMembersTable.userId, user.id),
    });

    if (memberships.length === 0) {
      return res.json([]);
    }

    const results = [];
    for (const m of memberships) {
      const project = await db.query.projectsTable.findFirst({
        where: eq(projectsTable.id, m.projectId),
      });
      if (!project) continue;

      const tasks = await db.query.tasksTable.findMany({
        where: and(eq(tasksTable.projectId, m.projectId), lt(tasksTable.dueDate, now)),
      });

      for (const task of tasks) {
        if (task.status === "done" || !task.dueDate) continue;

        let assigneeName = null;
        let assigneeAvatarUrl = null;
        let assigneeClerkId = null;
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

        results.push({
          id: task.id,
          projectId: task.projectId,
          projectName: project.name,
          projectColor: project.color,
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
        });
      }
    }

    res.json(results);
  } catch (err) {
    req.log.error(err, "Error getting overdue tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/recent-activity
router.get("/dashboard/recent-activity", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;

  try {
    const user = await getOrCreateUser(clerkUserId);

    const memberships = await db.query.projectMembersTable.findMany({
      where: eq(projectMembersTable.userId, user.id),
    });

    if (memberships.length === 0) {
      return res.json([]);
    }

    const results = [];
    for (const m of memberships) {
      const project = await db.query.projectsTable.findFirst({
        where: eq(projectsTable.id, m.projectId),
      });
      if (!project) continue;

      const tasks = await db.query.tasksTable.findMany({
        where: eq(tasksTable.projectId, m.projectId),
        orderBy: [desc(tasksTable.updatedAt)],
        limit: 5,
      });

      for (const task of tasks) {
        let assigneeName = null;
        let assigneeAvatarUrl = null;
        let assigneeClerkId = null;
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

        results.push({
          id: task.id,
          projectId: task.projectId,
          projectName: project.name,
          projectColor: project.color,
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
        });
      }
    }

    // Sort by updatedAt desc and take top 20
    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json(results.slice(0, 20));
  } catch (err) {
    req.log.error(err, "Error getting recent activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
