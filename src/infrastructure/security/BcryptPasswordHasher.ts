import bcrypt from "bcrypt";
import type { PasswordHasher } from "../../application/ports/PasswordHasher.js";

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly saltRounds: number) {}

  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
