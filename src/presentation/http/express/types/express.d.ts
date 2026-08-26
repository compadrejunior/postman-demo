import type { UserRole } from "../../../../domain/value-objects/UserRole.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}

export {};
