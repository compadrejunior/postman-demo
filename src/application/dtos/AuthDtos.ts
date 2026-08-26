import type { UserRole } from "../../domain/value-objects/UserRole.js";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserOutput {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  token: string;
  user: RegisterUserOutput;
}
