import { InvalidEmailError } from "../errors/InvalidEmailError.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(readonly value: string) {}

  static create(rawValue: string): Email {
    const normalized = rawValue.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError(rawValue);
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
