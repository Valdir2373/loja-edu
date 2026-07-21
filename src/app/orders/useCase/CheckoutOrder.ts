import { Address } from "../../../domain/entites/Address";
import { Order, OrderItem } from "../../../domain/entites/Order";
import { Product } from "../../../domain/entites/Product";
import { User } from "../../../domain/entites/User";
import { BusinessRuleError } from "../../../domain/errors/BusinessRuleError";
import { NotFoundError } from "../../../domain/errors/NotFoundError";
import { CreateId } from "../../../domain/interface/CreateId";
import { Money } from "../../../domain/money/Money";
import { PaymentGatewayPort } from "../../../domain/payment/PaymentGatewayPort";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { CheckoutOrderInput } from "../dto/CheckoutOrderInput";
import { CheckoutOrderOutput } from "../dto/CheckoutOrderOutput";

export class CheckoutOrder {
    constructor(
        private orderRepo: RepositoryPort<Order>,
        private productRepo: RepositoryPort<Product>,
        private addressRepo: RepositoryPort<Address>,
        private userRepo: RepositoryPort<User>,
        private paymentGateway: PaymentGatewayPort,
        private createId: CreateId
    ) {}

    async execute(input: CheckoutOrderInput): Promise<CheckoutOrderOutput> {
        const user = await this.userRepo.findById(input.userId);
        if (!user) {
            throw new NotFoundError("Usuário não encontrado.");
        }
        const addresses = await this.addressRepo.findMany({ userId: input.userId });
        if (addresses.length === 0) {
            throw new BusinessRuleError("Usuário não possui endereço cadastrado.");
        }

        const items = await this.buildItems(input.items);
        const order = Order.build(this.createId, user.id, addresses[0].id, items);

        const payment = await this.paymentGateway.createPixPayment({
            orderId: order.id,
            totalCents: order.totalCents,
            payerEmail: user.email,
            ...this.splitPayerName(user.fullName ?? user.username),
        });
        order.attachPayment(payment.externalPaymentId);
        await this.orderRepo.save(order);
        await this.decrementStock(items);

        return {
            orderId: order.id,
            status: order.status,
            totalCents: order.totalCents,
            totalDisplay: Money.toDisplay(order.totalCents),
            qrCode: payment.qrCode,
            qrCodeBase64: payment.qrCodeBase64,
            expiresAt: payment.expiresAt,
        };
    }

    private async buildItems(requested: CheckoutOrderInput["items"]): Promise<OrderItem[]> {
        const items: OrderItem[] = [];
        for (const requestedItem of requested) {
            const product = await this.productRepo.findById(requestedItem.productId);
            if (!product) {
                throw new NotFoundError(`Produto ${requestedItem.productId} não encontrado.`);
            }
            if (product.stock < requestedItem.quantity) {
                throw new BusinessRuleError(`Estoque insuficiente para o produto: ${product.name}`);
            }
            items.push({
                productId: product.id,
                productName: product.name,
                priceCents: Money.fromDecimalString(product.price),
                quantity: requestedItem.quantity,
            });
        }
        return items;
    }

    private async decrementStock(items: OrderItem[]): Promise<void> {
        await Promise.all(
            items.map(async (item) => {
                const product = await this.productRepo.findById(item.productId);
                if (product) {
                    await this.productRepo.update(product.id, { stock: product.stock - item.quantity });
                }
            })
        );
    }

    private splitPayerName(fullName: string): { payerFirstName: string; payerLastName: string } {
        const [payerFirstName, ...rest] = fullName.trim().split(/\s+/);
        return { payerFirstName, payerLastName: rest.length > 0 ? rest.join(" ") : payerFirstName };
    }
}
