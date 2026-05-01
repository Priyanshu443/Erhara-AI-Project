import {
  pgTable,
  serial,
  integer,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { usersTable } from "./users";

export const memberRoleEnum = pgEnum("member_role", ["admin", "member"]);

export const projectMembersTable = pgTable(
  "project_members",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.projectId, t.userId)],
);

export const insertProjectMemberSchema = createInsertSchema(
  projectMembersTable,
).omit({
  id: true,
  joinedAt: true,
});

export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type ProjectMember = typeof projectMembersTable.$inferSelect;
