import type { PasswordHasher } from "../../../src/application/ports/PasswordHasher.js";

export class FakePasswordHasher implements PasswordHasher {
  async hash(plainText: string): Promise<string> {
    return `hashed:${plainText}`;
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plainText}`;
  }
}
