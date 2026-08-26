import type { UserRole } from "../../domain/value-objects/UserRole.js";

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload | null;
}
