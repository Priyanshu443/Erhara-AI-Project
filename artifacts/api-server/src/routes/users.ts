import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import type { Request, Response } from "express";

const router = Router();

// Get or create user record from Clerk session
async function getOrCreateUser(clerkId: string, fallbackEmail?: string, fallbackName?: string) {
  let user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (!user) {
    const [created] = await db
      .insert(usersTable)
      .values({
        clerkId,
        name: fallbackName ?? "User",
        email: fallbackEmail ?? `${clerkId}@placeholder.com`,
      })
      .returning();
    user = created;
  }
  return user!;
}

// GET /users/me
router.get("/users/me", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  try {
    const user = await getOrCreateUser(clerkUserId);
    res.json({
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error(err, "Error getting user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /users/me
router.put("/users/me", requireAuth, async (req: Request, res: Response) => {
  const { clerkUserId } = req as AuthRequest;
  const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string | null };
  try {
    const user = await getOrCreateUser(clerkUserId);
    const [updated] = await db
      .update(usersTable)
      .set({
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.json({
      id: updated!.id,
      clerkId: updated!.clerkId,
      name: updated!.name,
      email: updated!.email,
      avatarUrl: updated!.avatarUrl ?? null,
      createdAt: updated!.createdAt,
    });
  } catch (err) {
    req.log.error(err, "Error updating user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { getOrCreateUser };
export default router;
