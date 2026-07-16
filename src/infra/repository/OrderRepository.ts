import { DataAccessPort } from "../../domain/database/DataAcess";
import { Order } from "../../domain/entites/Order";
import { FilterQuery, RepositoryPort } from "../../domain/repository/RepositoryPort";

export class OrderRepository extends RepositoryPort<Order> {
    private readonly collectionName = "pedidos";

    constructor(protected readonly dataAccess: DataAccessPort) {
        super(dataAccess);
    }

    async save(entity: Order): Promise<string | number | undefined> {
        const data = {
            id: entity.id,
            userId: entity.userId,
            items: entity.items,
            total: entity.totalAmount,
            status: entity.status,
            created_at: entity.created_at,
            updated_at: entity.updated_at,
            deleted_at: entity.deleted_at
        };
        return await this.dataAccess.create(this.collectionName, data);
    }

    async findById(id: string): Promise<Order | undefined> {
        const data = await this.dataAccess.findOne<any>(this.collectionName, { id });
        if (!data) return undefined;
        return this.mapToEntity(data);
    }

    async findAll(): Promise<Order[]> {
        const dataList = await this.dataAccess.findMany<any>(this.collectionName);
        return dataList.map(data => this.mapToEntity(data));
    }

    async findMany(query: FilterQuery<Order>): Promise<Order[]> {
        const dataList = await this.dataAccess.findMany<any>(this.collectionName, query as any);
        return dataList.map(data => this.mapToEntity(data));
    }

    async findBy(query: FilterQuery<Order>): Promise<Order | null> {
        const data = await this.dataAccess.findOne<any>(this.collectionName, query as any);
        if (!data) return null;
        return this.mapToEntity(data);
    }

    async update(id: string, entity: Partial<Order>): Promise<void> {
        const updateData = { 
            ...entity, 
            updated_at: new Date() 
        };
        
        if ('totalAmount' in updateData) {
            (updateData as any).total = (updateData as any).totalAmount;
            delete (updateData as any).totalAmount;
        }

        await this.dataAccess.update(this.collectionName, { id } as any, updateData as any);
    }

    async exists(filter: Partial<Order>): Promise<boolean> {
        const count = await this.dataAccess.count(this.collectionName, filter as any);
        return count > 0;
    }

    async delete(id: string): Promise<number> {
        return await this.dataAccess.update(this.collectionName, { id } as any, {
            deleted_at: new Date(),
            updated_at: new Date()
        } as any);
    }

    private mapToEntity(data: any): Order {
        return new Order(
            data.id,
            data.userId,
            data.items,
            data.total ?? data.totalAmount,
            data.status,
            new Date(data.created_at),
            new Date(data.updated_at),
            data.deleted_at ? new Date(data.deleted_at) : null
        );
    }
}