import type { TaskPriority } from "../value-objects/TaskPriority.js";
import type { TaskStatus } from "../value-objects/TaskStatus.js";
import type { UserRole } from "../value-objects/UserRole.js";

export interface TaskProps {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export class Task {
  private constructor(private props: TaskProps) {}

  static create(props: TaskProps): Task {
    return new Task(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): TaskPriority {
    return this.props.priority;
  }

  get dueDate(): Date | null {
    return this.props.dueDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * A regular user may only access their own tasks; an admin may access any task.
   * This is the single source of truth for task-ownership authorization.
   */
  isAccessibleBy(requestingUserId: string, requestingUserRole: UserRole): boolean {
    return requestingUserRole === "admin" || this.props.userId === requestingUserId;
  }

  applyUpdate(update: TaskUpdate, updatedAt: Date): Task {
    return new Task({
      ...this.props,
      ...update,
      updatedAt,
    });
  }

  toProps(): TaskProps {
    return { ...this.props };
  }
}
