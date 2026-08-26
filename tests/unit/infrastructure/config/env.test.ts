import { describe, expect, it } from "vitest";
import { loadEnv } from "../../../../src/infrastructure/config/env.js";

const validEnv = {
  MONGODB_URI: "mongodb://localhost:27017/test",
  JWT_SECRET: "super-secret",
};

describe("loadEnv", () => {
  it("parses valid config and applies defaults", () => {
    const env = loadEnv(validEnv);
    expect(env).toMatchObject({
      NODE_ENV: "development",
      PORT: 3000,
      JWT_EXPIRES_IN: "1h",
      BCRYPT_SALT_ROUNDS: 10,
    });
  });

  it("respects overrides for optional fields", () => {
    const env = loadEnv({ ...validEnv, NODE_ENV: "production", PORT: "8080", BCRYPT_SALT_ROUNDS: "12" });
    expect(env.NODE_ENV).toBe("production");
    expect(env.PORT).toBe(8080);
    expect(env.BCRYPT_SALT_ROUNDS).toBe(12);
  });

  it("throws a descriptive error when required fields are missing", () => {
    expect(() => loadEnv({})).toThrow(/MONGODB_URI/);
  });
});
