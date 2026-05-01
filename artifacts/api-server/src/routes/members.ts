import { Router } from "express";
import { db, projectMembersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import { getOrCreateUser } from "./users";
import { getProjectMembership } from "./projects";
import type { Request, Response } from "express";

const router = Router();

// GET /projects/:projectId/members
router.get("/projects/:projectId/members", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

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

    res.json(members.map((m) => ({ ...m, avatarUrl: m.avatarUrl ?? null })));
  } catch (err) {
    req.log.error(err, "Error listing members");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /projects/:projectId/members
router.post("/projects/:projectId/members", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const { email, role } = req.body as { email: string; role: "admin" | "member" };

  if (!email || !role) {
    res.status(400).json({ error: "email and role are required" });
    return;
  }

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership || membership.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Find target user by email
    const targetUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!targetUser) {
      res.status(404).json({ error: "User not found. They must sign up first." });
      return;
    }

    // Check if already a member
    const existing = await getProjectMembership(projectId, targetUser.id);
    if (existing) {
      res.status(409).json({ error: "User is already a member" });
      return;
    }

    const [newMember] = await db
      .insert(projectMembersTable)
      .values({ projectId, userId: targetUser.id, role })
      .returning();

    res.status(201).json({
      id: newMember!.id,
      projectId: newMember!.projectId,
      userId: newMember!.userId,
      clerkId: targetUser.clerkId,
      name: targetUser.name,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl ?? null,
      role: newMember!.role,
      joinedAt: newMember!.joinedAt,
    });
  } catch (err) {
    req.log.error(err, "Error adding member");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /projects/:projectId/members/:memberId
router.put("/projects/:projectId/members/:memberId", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const memberId = parseInt(req.params["memberId"]!);
  const { role } = req.body as { role: "admin" | "member" };

  if (!role) {
    res.status(400).json({ error: "role is required" });
    return;
  }

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership || membership.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [updated] = await db
      .update(projectMembersTable)
      .set({ role })
      .where(and(eq(projectMembersTable.id, memberId), eq(projectMembersTable.projectId, projectId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const memberUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, updated.userId),
    });

    res.json({
      id: updated.id,
      projectId: updated.projectId,
      userId: updated.userId,
      clerkId: memberUser!.clerkId,
      name: memberUser!.name,
      email: memberUser!.email,
      avatarUrl: memberUser!.avatarUrl ?? null,
      role: updated.role,
      joinedAt: updated.joinedAt,
    });
  } catch (err) {
    req.log.error(err, "Error updating member");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /projects/:projectId/members/:memberId
router.delete("/projects/:projectId/members/:memberId", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const projectId = parseInt(req.params["projectId"]!);
  const memberId = parseInt(req.params["memberId"]!);

  try {
    const user = await getOrCreateUser(clerkUserId);
    const membership = await getProjectMembership(projectId, user.id);
    if (!membership || membership.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(projectMembersTable).where(
      and(eq(projectMembersTable.id, memberId), eq(projectMembersTable.projectId, projectId)),
    );
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "Error removing member");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
