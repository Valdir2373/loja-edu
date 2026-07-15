import { Order } from "../../../domain/entites/Order";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { OrderOutput } from "../dto/OrderOutput";

export class GetOrderById {
    constructor(private orderRepo: RepositoryPort<Order>) {}

    async execute(id: string): Promise<OrderOutput> {
        const order = await this.orderRepo.findById(id);

        if (!order) {
            throw new Error("Pedido não encontrado.");
        }

        return {
            id: order.id,
            userId: order.userId,
            items: order.items,
            total: order.totalAmount,
            status: order.status,
            createdAt: order.created_at
        };
    }
}