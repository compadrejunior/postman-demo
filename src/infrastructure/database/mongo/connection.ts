import { MongoClient, type Db } from "mongodb";

export class MongoDatabase {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(uri: string): Promise<Db> {
    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db();
    await this.ensureIndexes(this.db);
    return this.db;
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error("MongoDatabase is not connected. Call connect() first.");
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    await this.client?.close();
    this.client = null;
    this.db = null;
  }

  private async ensureIndexes(db: Db): Promise<void> {
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("tasks").createIndex({ userId: 1 });
  }
}
