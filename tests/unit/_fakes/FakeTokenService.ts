import type { TokenPayload, TokenService } from "../../../src/application/ports/TokenService.js";

export class FakeTokenService implements TokenService {
  sign(payload: TokenPayload): string {
    return `token:${payload.userId}:${payload.role}`;
  }

  verify(token: string): TokenPayload | null {
    const [prefix, userId, role] = token.split(":");
    if (prefix !== "token" || !userId || (role !== "user" && role !== "admin")) {
      return null;
    }
    return { userId, role };
  }
}
