import type { UserRepository } from "../../../src/application/ports/UserRepository.js";
import type { User } from "../../../src/domain/entities/User.js";

export class FakeUserRepository implements UserRepository {
  private readonly usersById = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.usersById.values()) {
      if (user.email.value === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.usersById.set(user.id, user);
  }
}
