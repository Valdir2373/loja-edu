import { RepositoryPort } from "../../domain/repository/RepositoryPort";
import { DataAccessPort } from "../../domain/database/DataAcess";
import { Product } from "../../domain/entites/Product";

export class ProductRepository extends RepositoryPort<Product> {
  private readonly collectionName = "produtos";

  constructor(dataAccess: DataAccessPort) {
    super(dataAccess);
  }

  async save(entity: Product): Promise<string | number | undefined> {
    return await this.dataAccess.create<Product>(this.collectionName, entity);
  }

  async findById(id: string): Promise<Product | undefined> {
    return await this.dataAccess.findOne<Product>(this.collectionName, { id } as Partial<Product>);
  }

  async findAll(): Promise<Product[]> {
    return await this.dataAccess.findMany<Product>(this.collectionName);
  }

  async delete(id: string): Promise<number> {
    return await this.dataAccess.remove(this.collectionName, { id });
  }
}