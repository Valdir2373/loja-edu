import { beforeEach, describe, expect, it } from "vitest";
import { CheckoutOrder } from "../../../src/app/orders/useCase/CheckoutOrder";
import { Address } from "../../../src/domain/entites/Address";
import { Order, OrderStatus } from "../../../src/domain/entites/Order";
import { Product } from "../../../src/domain/entites/Product";
import { User } from "../../../src/domain/entites/User";
import { BusinessRuleError } from "../../../src/domain/errors/BusinessRuleError";
import { NotFoundError } from "../../../src/domain/errors/NotFoundError";
import { InMemoryRepository } from "../../doubles/InMemoryRepository";
import { FakePaymentGatewayPort } from "../../doubles/FakePaymentGatewayPort";

let sequence = 0;
const createId = () => `generated-id-${++sequence}`;

const buildUseCase = () => {
    const orderRepo = new InMemoryRepository<Order>();
    const productRepo = new InMemoryRepository<Product>();
    const addressRepo = new InMemoryRepository<Address>();
    const userRepo = new InMemoryRepository<User>();
    const paymentGateway = new FakePaymentGatewayPort();
    const useCase = new CheckoutOrder(orderRepo, productRepo, addressRepo, userRepo, paymentGateway, createId);
    return { useCase, orderRepo, productRepo, addressRepo, userRepo, paymentGateway };
};

const buildUser = async (context: ReturnType<typeof buildUseCase>) => {
    const user = User.build(createId, "joao@gmail.com", "joao");
    user.completeOnboarding("João da Silva", 1);
    await context.userRepo.save(user);
    const address = Address.build(createId, user.id, "João da Silva", "01310100", "Av Paulista", "1000", null, "Bela Vista", "São Paulo", "SP");
    await context.addressRepo.save(address);
    return user;
};

const buildProduct = async (
    context: ReturnType<typeof buildUseCase>,
    name: string,
    price: string,
    stock: number
) => {
    const product = Product.build(createId, name, price, null, stock);
    await context.productRepo.save(product);
    return product;
};

describe("CheckoutOrder", () => {
    let context: ReturnType<typeof buildUseCase>;

    beforeEach(() => {
        context = buildUseCase();
    });

    it("cria o pedido, chama o gateway com o total em centavos e devolve o QR do PIX", async () => {
        const user = await buildUser(context);
        const product = await buildProduct(context, "Dipirona", "19.90", 10);

        const output = await context.useCase.execute({ userId: user.id, items: [{ productId: product.id, quantity: 2 }] });

        expect(output.totalCents).toBe(3980);
        expect(output.status).toBe(OrderStatus.PENDING_PAYMENT);
        expect(output.qrCode).toBeTruthy();
        expect(output.qrCodeBase64).toBeTruthy();
        expect(context.paymentGateway.createdPayments[0].totalCents).toBe(3980);
    });

    it("soma o total de múltiplos produtos em centavos", async () => {
        const user = await buildUser(context);
        const first = await buildProduct(context, "Dipirona", "19.90", 10);
        const second = await buildProduct(context, "Paracetamol", "12.50", 10);

        const output = await context.useCase.execute({
            userId: user.id,
            items: [
                { productId: first.id, quantity: 2 },
                { productId: second.id, quantity: 3 },
            ],
        });

        expect(output.totalCents).toBe(1990 * 2 + 1250 * 3);
    });

    it("decrementa o estoque dos produtos comprados", async () => {
        const user = await buildUser(context);
        const product = await buildProduct(context, "Dipirona", "19.90", 10);

        await context.useCase.execute({ userId: user.id, items: [{ productId: product.id, quantity: 3 }] });

        const persistedProduct = await context.productRepo.findById(product.id);
        expect(persistedProduct?.stock).toBe(7);
    });

    it("salva o pedido com o id de pagamento vinculado", async () => {
        const user = await buildUser(context);
        const product = await buildProduct(context, "Dipirona", "19.90", 10);

        const output = await context.useCase.execute({ userId: user.id, items: [{ productId: product.id, quantity: 1 }] });

        const savedOrder = await context.orderRepo.findById(output.orderId);
        expect(savedOrder?.paymentId).toBeTruthy();
    });

    it("calcula o total corretamente para preço no formato exato devolvido pelo Postgres (string decimal com duas casas)", async () => {
        const user = await buildUser(context);
        const product = await buildProduct(context, "Dipirona", "30.00", 100);

        const output = await context.useCase.execute({ userId: user.id, items: [{ productId: product.id, quantity: 2 }] });

        expect(output.totalCents).toBe(6000);
        expect(output.totalDisplay).toBe("R$ 60,00");
        expect(context.paymentGateway.createdPayments[0].totalCents).toBe(6000);
    });

    it("recusa checkout para usuário inexistente", async () => {
        await expect(context.useCase.execute({ userId: "id-inexistente", items: [] })).rejects.toThrow(NotFoundError);
        await expect(context.useCase.execute({ userId: "id-inexistente", items: [] })).rejects.toThrow(
            "Usuário não encontrado."
        );
    });

    it("recusa checkout para usuário sem endereço cadastrado", async () => {
        const user = User.build(createId, "maria@gmail.com", "maria");
        await context.userRepo.save(user);

        await expect(context.useCase.execute({ userId: user.id, items: [] })).rejects.toThrow(BusinessRuleError);
        await expect(context.useCase.execute({ userId: user.id, items: [] })).rejects.toThrow(
            "Usuário não possui endereço cadastrado."
        );
    });

    it("recusa checkout com produto inexistente", async () => {
        const user = await buildUser(context);

        await expect(
            context.useCase.execute({ userId: user.id, items: [{ productId: "produto-inexistente", quantity: 1 }] })
        ).rejects.toThrow(NotFoundError);
    });

    it("recusa checkout com estoque insuficiente", async () => {
        const user = await buildUser(context);
        const product = await buildProduct(context, "Dipirona", "19.90", 1);

        await expect(
            context.useCase.execute({ userId: user.id, items: [{ productId: product.id, quantity: 5 }] })
        ).rejects.toThrow(BusinessRuleError);
        await expect(
            context.useCase.execute({ userId: user.id, items: [{ productId: product.id, quantity: 5 }] })
        ).rejects.toThrow("Estoque insuficiente para o produto: Dipirona");
    });
});
