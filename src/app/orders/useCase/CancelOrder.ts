import { Order } from "../../../domain/entites/Order";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { Product } from "../../../domain/entites/Product";

export class CancelOrder {
    constructor(
        private orderRepo: RepositoryPort<Order>,
        private productRepo: RepositoryPort<Product>
    ) {}

    async execute(orderId: string): Promise<void> {
        const order = await this.orderRepo.findById(orderId);
        if (!order) {
            throw new Error("Pedido não encontrado.");
        }
        if (order.status !== 'PENDING') {
            throw new Error("Apenas pedidos pendentes podem ser cancelados.");
        }
        for (const item of order.items) {
            const product = await this.productRepo.findById(item.productId);
            if (product) {
                await this.productRepo.update(product.id, { 
                    stock: product.stock + item.quantity 
                } as any);
            }
        }
        order.status = 'CANCELLED';
        order.markAsUpdated();
        await this.orderRepo.update(orderId, order);
    }
}