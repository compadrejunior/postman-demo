import { describe, expect, it } from "vitest";
import { User } from "../../../../src/domain/entities/User.js";
import { Email } from "../../../../src/domain/value-objects/Email.js";

describe("User", () => {
  it("exposes its fields via getters", () => {
    const user = User.create({
      id: "user-1",
      name: "Ada Lovelace",
      email: Email.create("ada@example.com"),
      passwordHash: "hashed",
      role: "user",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });

    expect(user.id).toBe("user-1");
    expect(user.name).toBe("Ada Lovelace");
    expect(user.email.value).toBe("ada@example.com");
    expect(user.passwordHash).toBe("hashed");
    expect(user.role).toBe("user");
  });

  it("isAdmin reflects the role", () => {
    const admin = User.create({
      id: "user-2",
      name: "Admin",
      email: Email.create("admin@example.com"),
      passwordHash: "hashed",
      role: "admin",
      createdAt: new Date(),
    });

    expect(admin.isAdmin()).toBe(true);
  });
});
