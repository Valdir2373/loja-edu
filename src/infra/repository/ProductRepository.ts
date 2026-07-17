import { FilterQuery, RepositoryPort } from "../../domain/repository/RepositoryPort";
import { DataAccessPort } from "../../domain/database/DataAcess";
import { Product } from "../../domain/entites/Product";

export class ProductRepository extends RepositoryPort<Product> {
  private readonly collectionName = "produtos";
  
  constructor(protected dataAccess: DataAccessPort) {
    super(dataAccess);
  }

  async save(entity: Product): Promise<string | number | undefined> {
    return await this.dataAccess.create<Product>(this.collectionName, entity);
  }

  async findById(id: string): Promise<Product | undefined> {
    const data = await this.dataAccess.findOne<any>(this.collectionName, { id });
    console.log(data);
    
    if (!data) return undefined;
    return this.mapToEntity(data);
  }

  async findBy(query: FilterQuery<Product>): Promise<Product | null> {
    const data = await this.dataAccess.findOne<any>(this.collectionName, query as any);
    if (!data) return null;
    return this.mapToEntity(data);
  }

  async findMany(query: FilterQuery<Product>): Promise<Product[]> {
    const dataList = await this.dataAccess.findMany<any>(this.collectionName, query as any);
    return dataList.map(data => this.mapToEntity(data));
  }

  async findAll(): Promise<Product[]> {
    const dataList = await this.dataAccess.findMany<any>(this.collectionName);
    return dataList.map(data => this.mapToEntity(data));
  }

  async exists(filter: Partial<Product>): Promise<boolean> {
    const count = await this.dataAccess.count(this.collectionName, filter as any);
    return count > 0;
  }

  async update(id: string, entity: Partial<Product>): Promise<void> {
    
    const updateData = { ...entity, updated_at: new Date() };
    await this.dataAccess.update(this.collectionName, { id } as any, updateData as any);
  }

  async delete(id: string): Promise<number> {
    
    return await this.dataAccess.remove(this.collectionName, { id } as any);
  }

  
  private mapToEntity(data: any): Product {
    return new Product(
      data.id,
      data.name,
      data.price,
      data.discount,
      data.stock,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.deleted_at ? new Date(data.deleted_at) : null
    );
  }
}