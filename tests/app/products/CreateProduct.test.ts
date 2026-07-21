import { beforeEach, describe, expect, it } from "vitest";
import { CreateProduct } from "../../../src/app/products/useCase/CreateProduct";
import { Product } from "../../../src/domain/entites/Product";
import { ConflictError } from "../../../src/domain/errors/ConflictError";
import { InMemoryRepository } from "../../doubles/InMemoryRepository";

let sequence = 0;
const createId = () => `product-id-${++sequence}`;

const buildUseCase = () => {
    const repository = new InMemoryRepository<Product>();
    const useCase = new CreateProduct(repository, createId);
    return { useCase, repository };
};

describe("CreateProduct", () => {
    let context: ReturnType<typeof buildUseCase>;

    beforeEach(() => {
        context = buildUseCase();
    });

    it("cria o produto e devolve o Output sem campos internos", async () => {
        const output = await context.useCase.execute({ name: "Dipirona", price: "19.90", discount: null, stock: 10 });

        expect(output).toEqual({ id: output.id, name: "Dipirona", price: "19.90", discount: null, stock: 10 });
        expect(output).not.toHaveProperty("deleted_at");
        const saved = await context.repository.findById(output.id);
        expect(saved?.name).toBe("Dipirona");
    });

    it("recusa criar produto com nome já cadastrado", async () => {
        await context.useCase.execute({ name: "Dipirona", price: "19.90", discount: null, stock: 10 });

        await expect(
            context.useCase.execute({ name: "Dipirona", price: "9.90", discount: null, stock: 3 })
        ).rejects.toThrow(ConflictError);
        await expect(
            context.useCase.execute({ name: "Dipirona", price: "9.90", discount: null, stock: 3 })
        ).rejects.toThrow("Produto já cadastrado.");
    });
});
