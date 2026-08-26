/**
 * Presentation-layer only: request carries no token or an invalid/expired
 * one, as distinct from the domain's InvalidCredentialsError (wrong email or
 * password on login) and ForbiddenError (authenticated but not permitted).
 */
export class UnauthenticatedError extends Error {
  constructor() {
    super("A valid authentication token is required");
    this.name = "UnauthenticatedError";
  }
}
