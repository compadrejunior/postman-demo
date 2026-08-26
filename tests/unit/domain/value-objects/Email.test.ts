import { describe, expect, it } from "vitest";
import { Email } from "../../../../src/domain/value-objects/Email.js";
import { InvalidEmailError } from "../../../../src/domain/errors/InvalidEmailError.js";

describe("Email", () => {
  it("normalizes valid emails to lowercase and trims whitespace", () => {
    const email = Email.create("  Test@Example.com  ");
    expect(email.value).toBe("test@example.com");
  });

  it("throws InvalidEmailError for malformed input", () => {
    expect(() => Email.create("not-an-email")).toThrow(InvalidEmailError);
  });

  it("compares equality by normalized value", () => {
    const a = Email.create("a@example.com");
    const b = Email.create("A@Example.com");
    expect(a.equals(b)).toBe(true);
  });

  it("stringifies to its value", () => {
    const email = Email.create("a@example.com");
    expect(email.toString()).toBe("a@example.com");
  });
});
