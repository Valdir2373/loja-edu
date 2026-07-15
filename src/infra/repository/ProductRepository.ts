import { FilterQuery, RepositoryPort } from "../../domain/repository/RepositoryPort";
import { DataAccessPort } from "../../domain/database/DataAcess";
import { Order } from "../../domain/entites/Order";

export class OrderRepository extends RepositoryPort<Order> {
  private readonly collectionName = "pedidos";

  constructor(protected dataAccess: DataAccessPort) {
    super(dataAccess);
  }
  async save(entity: Order): Promise<string | number | undefined> {
    const data = {
      ...entity,
      total: entity.totalAmount, 
    };
    return await this.dataAccess.create<Order>(this.collectionName, data);
  }

  async findById(id: string): Promise<Order | undefined> {
    const data = await this.dataAccess.findOne<Order>(this.collectionName, { id } as any);
    if (!data) return undefined;
    return new Order(
      data.id,
      data.userId,
      data.items,
      data.total,
      data.status,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.deleted_at ? new Date(data.deleted_at) : null
    );
  }

  async findAll(): Promise<Order[]> {
    const dataList = await this.dataAccess.findMany<Order>(this.collectionName);
    return dataList.map(data => new Order(
      data.id,
      data.userId,
      data.items,
      data.total,
      data.status,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.deleted_at ? new Date(data.deleted_at) : null
    ));
  }

  async findBy(query: FilterQuery<Order>): Promise<Order | null> {
    const data = await this.dataAccess.findOne<Order>(this.collectionName, query as any);
    if (!data) return null;
    return new Order(
      data.id,
      data.userId,
      data.items,
      data.total,
      data.status,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.deleted_at ? new Date(data.deleted_at) : null
    );
  }

  async exists(filter: Partial<Order>): Promise<boolean> {
    const count = await this.dataAccess.count(this.collectionName, filter);
    return count > 0;
  }

  async update(id: string, entity: Partial<Order>): Promise<void> {
    const updateData = {
      ...entity,
      updated_at: new Date()
    };
    await this.dataAccess.update(this.collectionName, { id } as any, updateData as any);
  }

  async delete(id: string): Promise<number> {
    return await this.dataAccess.update(this.collectionName, { id } as any, {
      deleted_at: new Date()
    } as any);
  }

  async findMany(query: FilterQuery<Order>): Promise<Order[]> {
  const dataList = await this.dataAccess.findMany<Order>(this.collectionName, query as any);
  
  return dataList.map(data => new Order(
    data.id,
    data.userId,
    data.items,
    data.total,
    data.status,
    new Date(data.created_at),
    new Date(data.updated_at),
    data.deleted_at ? new Date(data.deleted_at) : null
  ));
}

}