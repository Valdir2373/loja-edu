import postgres from 'postgres';
import { DataAccessPort } from '../../domain/database/DataAcess';

export class PostgresDataAccess extends DataAccessPort {
  private readonly sql: postgres.Sql;

  constructor(connectionString: string) {
    super();
    this.sql = postgres(connectionString, {
      host: 'db.dzxvftldlrzgkfusvvoc.supabase.co',
      port: 5432,
      ssl: 'require',
      connect_timeout: 5
    });
  }

  async findMany<T extends object>(collectionName: string, query?: Partial<T>, selectFields?: (keyof T)[]): Promise<T[]> {
    const fields = selectFields && selectFields.length > 0 ? selectFields.join(', ') : '*';
    const queryResult = await (this.sql`SELECT ${this.sql.unsafe(fields)} FROM ${this.sql(collectionName)}` as unknown as Promise<T[]>);
    return queryResult;
  }

  async findOne<T extends object>(collectionName: string, query: Partial<T>): Promise<T | undefined> {
    const rows = await (this.sql<T[]>`
      SELECT * FROM ${this.sql(collectionName)} WHERE id = ${(query as any).id} LIMIT 1
    ` as unknown as Promise<T[]>);
    return rows[0];
  }

  async create<T extends object>(collectionName: string, data: Partial<T>): Promise<string | number | undefined> {
    const [result] = await (this.sql`
      INSERT INTO ${this.sql(collectionName)} ${this.sql(data as Record<string, any>)}
      RETURNING id
    ` as unknown as Promise<any[]>);
    return result?.id;
  }

  async update<T extends object>(collectionName: string, query: Partial<T>, data: Partial<T>): Promise<number> {
    const result = await (this.sql`
      UPDATE ${this.sql(collectionName)} 
      SET ${this.sql(data as Record<string, any>)} 
      WHERE id = ${(query as any).id}
    ` as unknown as Promise<any>);
    return result.count;
  }

  async remove(collectionName: string, query: Partial<any>): Promise<number> {
    const result = await (this.sql`
      DELETE FROM ${this.sql(collectionName)} WHERE id = ${query.id}
    ` as unknown as Promise<any>);
    return result.count;
  }
}