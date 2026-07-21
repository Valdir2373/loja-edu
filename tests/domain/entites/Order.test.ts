import { describe, expect, it } from "vitest";
import { Order, OrderItem, OrderStatus } from "../../../src/domain/entites/Order";
import { BusinessRuleError } from "../../../src/domain/errors/BusinessRuleError";
import { ConflictError } from "../../../src/domain/errors/ConflictError";

const createId = () => "order-id-1";

const oneItem: OrderItem[] = [{ productId: "product-1", productName: "Dipirona", priceCents: 1990, quantity: 2 }];

const twoItems: OrderItem[] = [
    { productId: "product-1", productName: "Dipirona", priceCents: 1990, quantity: 2 },
    { productId: "product-2", productName: "Paracetamol", priceCents: 1250, quantity: 3 },
];

describe("Order", () => {
    describe("build", () => {
        it("cria o pedido aguardando pagamento com o total calculado em centavos", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);

            expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
            expect(order.totalCents).toBe(3980);
            expect(order.paymentId).toBeNull();
        });

        it("soma o total de múltiplos itens em centavos", () => {
            const order = Order.build(createId, "user-1", "address-1", twoItems);

            expect(order.totalCents).toBe(1990 * 2 + 1250 * 3);
        });

        it("recusa criar pedido sem nenhum item", () => {
            expect(() => Order.build(createId, "user-1", "address-1", [])).toThrow(BusinessRuleError);
            expect(() => Order.build(createId, "user-1", "address-1", [])).toThrow(
                "O pedido precisa ter ao menos um item."
            );
        });
    });

    describe("attachPayment", () => {
        it("vincula o id do pagamento ao pedido pendente", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);

            order.attachPayment("mp-payment-1");

            expect(order.paymentId).toBe("mp-payment-1");
        });

        it("recusa vincular pagamento a um pedido que não está pendente", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.attachPayment("mp-payment-1");
            order.markAsPaid(order.totalCents);

            expect(() => order.attachPayment("mp-payment-2")).toThrow(ConflictError);
            expect(() => order.attachPayment("mp-payment-2")).toThrow(
                "Só é possível vincular pagamento a um pedido aguardando pagamento."
            );
        });

        it("recusa vincular um segundo pagamento ao mesmo pedido", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.attachPayment("mp-payment-1");

            expect(() => order.attachPayment("mp-payment-2")).toThrow(ConflictError);
            expect(() => order.attachPayment("mp-payment-2")).toThrow(
                "Pedido já possui um pagamento vinculado."
            );
        });
    });

    describe("markAsPaid", () => {
        it("marca o pedido como pago quando o valor pago confere com o total", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);

            order.markAsPaid(order.totalCents);

            expect(order.status).toBe(OrderStatus.PAID);
        });

        it("recusa marcar como pago quando o valor pago diverge do total", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);

            expect(() => order.markAsPaid(order.totalCents - 1)).toThrow(BusinessRuleError);
            expect(() => order.markAsPaid(order.totalCents - 1)).toThrow(
                "Valor pago não corresponde ao total do pedido."
            );
        });

        it("recusa marcar como pago um pedido que já não está mais pendente", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsCancelled();

            expect(() => order.markAsPaid(order.totalCents)).toThrow(ConflictError);
            expect(() => order.markAsPaid(order.totalCents)).toThrow(
                "Só é possível confirmar pagamento de um pedido aguardando pagamento."
            );
        });
    });

    describe("markAsRejected / markAsExpired / markAsCancelled", () => {
        it("marca o pedido pendente como recusado", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsRejected();
            expect(order.status).toBe(OrderStatus.REJECTED);
        });

        it("marca o pedido pendente como expirado", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsExpired();
            expect(order.status).toBe(OrderStatus.EXPIRED);
        });

        it("marca o pedido pendente como cancelado", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsCancelled();
            expect(order.status).toBe(OrderStatus.CANCELLED);
        });

        it("recusa marcar como recusado um pedido já pago", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsPaid(order.totalCents);

            expect(() => order.markAsRejected()).toThrow(ConflictError);
            expect(() => order.markAsRejected()).toThrow(
                "Só é possível marcar como recusado um pedido aguardando pagamento."
            );
        });

        it("recusa marcar como expirado um pedido já cancelado", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsCancelled();

            expect(() => order.markAsExpired()).toThrow(ConflictError);
        });

        it("recusa marcar como cancelado um pedido já expirado", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsExpired();

            expect(() => order.markAsCancelled()).toThrow(ConflictError);
        });
    });

    describe("markAsRefunded / markAsChargedBack", () => {
        it("marca um pedido pago como estornado", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsPaid(order.totalCents);

            order.markAsRefunded();

            expect(order.status).toBe(OrderStatus.REFUNDED);
        });

        it("marca um pedido pago como contestado (chargeback)", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsPaid(order.totalCents);

            order.markAsChargedBack();

            expect(order.status).toBe(OrderStatus.CHARGEBACK);
        });

        it("recusa estornar um pedido que ainda não foi pago", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);

            expect(() => order.markAsRefunded()).toThrow(ConflictError);
            expect(() => order.markAsRefunded()).toThrow("Só é possível marcar como estornado um pedido já pago.");
        });

        it("recusa lançar chargeback de um pedido que já foi estornado", () => {
            const order = Order.build(createId, "user-1", "address-1", oneItem);
            order.markAsPaid(order.totalCents);
            order.markAsRefunded();

            expect(() => order.markAsChargedBack()).toThrow(ConflictError);
        });
    });
});
