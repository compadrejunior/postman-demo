import type { Db } from "mongodb";
import type { UserRepository } from "../../../application/ports/UserRepository.js";
import { User } from "../../../domain/entities/User.js";
import { Email } from "../../../domain/value-objects/Email.js";
import type { UserRole } from "../../../domain/value-objects/UserRole.js";

interface UserDocument {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const COLLECTION = "users";

export class MongoUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.db.collection<UserDocument>(COLLECTION).findOne({ email });
    return doc ? toDomain(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.db.collection<UserDocument>(COLLECTION).findOne({ _id: id });
    return doc ? toDomain(doc) : null;
  }

  async save(user: User): Promise<void> {
    await this.db
      .collection<UserDocument>(COLLECTION)
      .updateOne({ _id: user.id }, { $set: toPersistence(user) }, { upsert: true });
  }
}

function toDomain(doc: UserDocument): User {
  return User.create({
    id: doc._id,
    name: doc.name,
    email: Email.create(doc.email),
    passwordHash: doc.passwordHash,
    role: doc.role,
    createdAt: doc.createdAt,
  });
}

function toPersistence(user: User): Omit<UserDocument, "_id"> {
  return {
    name: user.name,
    email: user.email.value,
    passwordHash: user.passwordHash,
    role: user.role,
    createdAt: user.createdAt,
  };
}
