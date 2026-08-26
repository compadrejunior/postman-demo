/**
 * Presentation-layer only: route-level access denial (e.g. non-admin hitting
 * an admin-only route), as distinct from the domain's resource-level
 * UnauthorizedTaskAccessError.
 */
export class ForbiddenError extends Error {
  constructor() {
    super("You do not have permission to access this resource");
    this.name = "ForbiddenError";
  }
}
