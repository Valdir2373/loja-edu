import { Order } from "../../../domain/entites/Order";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { OrderSummaryOutput } from "../dto/OrderSummaryOutput";

export class ListOrdersByUser {
    constructor(private orderRepo: RepositoryPort<Order>) {}

    async execute(userId: string): Promise<OrderSummaryOutput[]> {
        const orders = await this.orderRepo.findMany({ userId } as any);
        return orders.map(order => ({
            id: order.id,
            total: order.totalAmount,
            status: order.status,
            createdAt: order.created_at
        }));
    }
}