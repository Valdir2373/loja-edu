import { DataAccessPort } from "../database/DataAcess";

export abstract class RepositoryPort<T> {
  constructor(protected readonly dataAccess: DataAccessPort) {}

  abstract save(entity: T): Promise<string | number | undefined>;
  abstract findById(id: string): Promise<T | undefined>;
  abstract findAll(): Promise<T[]>;
  abstract delete(id: string): Promise<number>;
}