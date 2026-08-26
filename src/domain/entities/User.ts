import type { Email } from "../value-objects/Email.js";
import type { UserRole } from "../value-objects/UserRole.js";

export interface UserProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isAdmin(): boolean {
    return this.props.role === "admin";
  }
}
