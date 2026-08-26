import jwt from "jsonwebtoken";
import type { TokenPayload, TokenService } from "../../application/ports/TokenService.js";
import { isUserRole } from "../../domain/value-objects/UserRole.js";

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  sign(payload: TokenPayload): string {
    const options: jwt.SignOptions = { expiresIn: this.expiresIn as NonNullable<jwt.SignOptions["expiresIn"]> };
    return jwt.sign(payload, this.secret, options);
  }

  verify(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret);
      if (typeof decoded !== "object" || decoded === null) {
        return null;
      }

      const { userId, role } = decoded as Record<string, unknown>;
      if (typeof userId !== "string" || typeof role !== "string" || !isUserRole(role)) {
        return null;
      }

      return { userId, role };
    } catch {
      return null;
    }
  }
}
