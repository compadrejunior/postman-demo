import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { JwtTokenService } from "../../../../src/infrastructure/security/JwtTokenService.js";

describe("JwtTokenService", () => {
  const service = new JwtTokenService("test-secret", "1h");

  it("signs and verifies a round trip", () => {
    const token = service.sign({ userId: "user-1", role: "admin" });
    expect(service.verify(token)).toEqual({ userId: "user-1", role: "admin" });
  });

  it("returns null for a garbage token", () => {
    expect(service.verify("not-a-jwt")).toBeNull();
  });

  it("returns null for a token signed with a different secret", () => {
    const foreignToken = jwt.sign({ userId: "user-1", role: "user" }, "other-secret");
    expect(service.verify(foreignToken)).toBeNull();
  });

  it("returns null when the payload shape is invalid", () => {
    const malformed = jwt.sign("just-a-string-payload", "test-secret");
    expect(service.verify(malformed)).toBeNull();
  });

  it("returns null when the role is not a recognized UserRole", () => {
    const badRole = jwt.sign({ userId: "user-1", role: "superuser" }, "test-secret");
    expect(service.verify(badRole)).toBeNull();
  });
});
