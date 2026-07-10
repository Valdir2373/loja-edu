import { RepositoryPort } from "../../domain/repository/RepositoryPort";
import { DataAccessPort } from "../../domain/database/DataAcess";
import { User } from "../../domain/entites/User";

export class UserRepository extends RepositoryPort<User> {
  constructor(protected readonly dataAccess: DataAccessPort) {
    super(dataAccess);
  }

  async save(entity: User): Promise<string | number | undefined> {
    return await this.dataAccess.create("users", {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      password: entity.password
    });
  }

  async findById(id: string): Promise<User | undefined> {
    const data = await this.dataAccess.findOne<User>("users", { id } as any);
    if (!data) return undefined;
    return new User(data.id, data.name, data.email, data.password);
  }

  async findAll(): Promise<User[]> {
    const users = await this.dataAccess.findMany<User>("users");
    return users.map(u => new User(u.id, u.name, u.email, u.password));
  }

  async update(id: string, entity: Partial<User>): Promise<void> {
    await this.dataAccess.update("users", { id } as any, entity);
  }

  async exists(filter: Partial<User>): Promise<boolean> {
    return (await this.dataAccess.count("users", filter as any)) > 0;
  }

  async delete(id: string): Promise<number> {
    return await this.dataAccess.remove("users", { id } as any);
  }
}