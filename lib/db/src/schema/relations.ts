import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { projectsTable } from "./projects";
import { projectMembersTable } from "./project_members";
import { tasksTable } from "./tasks";

export const usersRelations = relations(usersTable, ({ many }) => ({
  projectMembers: many(projectMembersTable),
  assignedTasks: many(tasksTable),
}));

export const projectsRelations = relations(projectsTable, ({ many }) => ({
  members: many(projectMembersTable),
  tasks: many(tasksTable),
}));

export const projectMembersRelations = relations(projectMembersTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectMembersTable.projectId],
    references: [projectsTable.id],
  }),
  user: one(usersTable, {
    fields: [projectMembersTable.userId],
    references: [usersTable.id],
  }),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [tasksTable.projectId],
    references: [projectsTable.id],
  }),
  assignee: one(usersTable, {
    fields: [tasksTable.assigneeId],
    references: [usersTable.id],
  }),
}));
