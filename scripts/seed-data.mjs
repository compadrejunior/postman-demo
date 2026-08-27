/**
 * Shared seed dataset for scripts/seed.ts (dev/test, run via tsx) and
 * scripts/seed.prod.mjs (prod, run via plain node against compiled dist/).
 * Kept as plain JS with no TS-only syntax so both can import it unchanged.
 */
const now = new Date();
const daysFromNow = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

// ada@example.com / password123 matches the sample body already committed in
// postman/collections/task-management-api/login.request.yaml and register.request.yaml.
export const users = [
  {
    id: undefined,
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "password123",
    role: "user",
    createdAt: daysFromNow(-30),
  },
  {
    id: undefined,
    name: "Grace Hopper",
    email: "grace@example.com",
    password: "password123",
    role: "user",
    createdAt: daysFromNow(-20),
  },
  {
    id: undefined,
    name: "Root Admin",
    email: "admin@example.com",
    password: "adminpass123",
    role: "admin",
    createdAt: daysFromNow(-60),
  },
];

export const tasks = [
  {
    id: undefined,
    ownerEmail: "ada@example.com",
    title: "Write integration tests",
    description: "Add coverage for the task CRUD endpoints",
    status: "in-progress",
    priority: "high",
    dueDate: daysFromNow(3),
    createdAt: daysFromNow(-5),
    updatedAt: daysFromNow(-1),
  },
  {
    id: undefined,
    ownerEmail: "ada@example.com",
    title: "Review PR #10",
    description: "Postman environments and per-request docs",
    status: "todo",
    priority: "medium",
    dueDate: daysFromNow(1),
    createdAt: daysFromNow(-2),
    updatedAt: daysFromNow(-2),
  },
  {
    id: undefined,
    ownerEmail: "ada@example.com",
    title: "Fix login rate limiting bug",
    description: "Investigate repeated 401s under load",
    status: "done",
    priority: "high",
    dueDate: daysFromNow(-2),
    createdAt: daysFromNow(-10),
    updatedAt: daysFromNow(-3),
  },
  {
    id: undefined,
    ownerEmail: "ada@example.com",
    title: "Plan Q3 roadmap",
    description: "",
    status: "todo",
    priority: "low",
    dueDate: null,
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
  },
  {
    id: undefined,
    // Owned by another user — useful for exercising the 403 "not the owner"
    // path on Get/Update/Delete Task when tested with Ada's token.
    ownerEmail: "grace@example.com",
    title: "Draft compiler design notes",
    description: "Owned by Grace — use to test 403 ownership checks",
    status: "in-progress",
    priority: "medium",
    dueDate: daysFromNow(7),
    createdAt: daysFromNow(-4),
    updatedAt: daysFromNow(-4),
  },
  {
    id: undefined,
    ownerEmail: "grace@example.com",
    title: "Prepare COBOL migration report",
    description: "Owned by Grace",
    status: "todo",
    priority: "low",
    dueDate: daysFromNow(14),
    createdAt: daysFromNow(-1),
    updatedAt: daysFromNow(-1),
  },
];
