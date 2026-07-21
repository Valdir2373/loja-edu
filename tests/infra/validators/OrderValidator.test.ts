import { describe, expect, it } from "vitest";
import { OrderValidator } from "../../../src/infra/validators/OrderValidator";
import { ValidationError } from "../../../src/infra/shared/errors/ValidationError";

const validItem = { productId: "8f14e45f-ceea-467e-a4c7-8f5b3a6b1a3c", quantity: 2 };

describe("OrderValidator", () => {
    describe("validateCheckout", () => {
        it("aceita uma lista de itens válida", () => {
            const validator = new OrderValidator();

            const result = validator.validateCheckout({ items: [validItem] });

            expect(result.items).toEqual([validItem]);
        });

        it("recusa quando a lista de itens está ausente", () => {
            const validator = new OrderValidator();

            expect(() => validator.validateCheckout({})).toThrow(ValidationError);
        });

        it("recusa lista de itens vazia", () => {
            const validator = new OrderValidator();

            expect(() => validator.validateCheckout({ items: [] })).toThrow(ValidationError);
        });

        it("recusa item com productId que não é um UUID", () => {
            const validator = new OrderValidator();

            expect(() =>
                validator.validateCheckout({ items: [{ productId: "not-a-uuid", quantity: 1 }] })
            ).toThrow(ValidationError);
        });

        it("recusa item com quantidade zero ou negativa", () => {
            const validator = new OrderValidator();

            expect(() =>
                validator.validateCheckout({ items: [{ ...validItem, quantity: 0 }] })
            ).toThrow(ValidationError);
        });

        it("recusa item com quantidade não inteira", () => {
            const validator = new OrderValidator();

            expect(() =>
                validator.validateCheckout({ items: [{ ...validItem, quantity: 1.5 }] })
            ).toThrow(ValidationError);
        });
    });

    describe("formatError", () => {
        it("formata um ValidationError em um mapa de campo para lista de mensagens", () => {
            const validator = new OrderValidator();
            let caughtError: unknown;

            try {
                validator.validateCheckout({ items: [] });
            } catch (error) {
                caughtError = error;
            }

            const formatted = validator.formatError(caughtError);

            expect(formatted.items).toBeDefined();
            expect(Array.isArray(formatted.items)).toBe(true);
        });

        it("retorna mensagem genérica quando o erro não é um ValidationError", () => {
            const validator = new OrderValidator();

            const formatted = validator.formatError(new Error("erro qualquer"));

            expect(formatted).toEqual({ general: ["Ocorreu um erro inesperado na validação dos dados."] });
        });
    });
});
