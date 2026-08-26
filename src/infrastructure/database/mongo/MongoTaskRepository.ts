import type { Db } from "mongodb";
import type { TaskRepository } from "../../../application/ports/TaskRepository.js";
import { Task } from "../../../domain/entities/Task.js";
import type { TaskPriority } from "../../../domain/value-objects/TaskPriority.js";
import type { TaskStatus } from "../../../domain/value-objects/TaskStatus.js";

interface TaskDocument {
  _id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION = "tasks";

export class MongoTaskRepository implements TaskRepository {
  constructor(private readonly db: Db) {}

  async create(task: Task): Promise<void> {
    await this.db.collection<TaskDocument>(COLLECTION).insertOne({ _id: task.id, ...toPersistence(task) });
  }

  async findById(id: string): Promise<Task | null> {
    const doc = await this.db.collection<TaskDocument>(COLLECTION).findOne({ _id: id });
    return doc ? toDomain(doc) : null;
  }

  async findAllByUserId(userId: string): Promise<Task[]> {
    const docs = await this.db.collection<TaskDocument>(COLLECTION).find({ userId }).toArray();
    return docs.map(toDomain);
  }

  async findAll(): Promise<Task[]> {
    const docs = await this.db.collection<TaskDocument>(COLLECTION).find({}).toArray();
    return docs.map(toDomain);
  }

  async update(task: Task): Promise<void> {
    await this.db.collection<TaskDocument>(COLLECTION).updateOne({ _id: task.id }, { $set: toPersistence(task) });
  }

  async delete(id: string): Promise<void> {
    await this.db.collection<TaskDocument>(COLLECTION).deleteOne({ _id: id });
  }
}

function toDomain(doc: TaskDocument): Task {
  return Task.create({
    id: doc._id,
    userId: doc.userId,
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    dueDate: doc.dueDate,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

function toPersistence(task: Task): Omit<TaskDocument, "_id"> {
  const props = task.toProps();
  return {
    userId: props.userId,
    title: props.title,
    description: props.description,
    status: props.status,
    priority: props.priority,
    dueDate: props.dueDate,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  };
}
