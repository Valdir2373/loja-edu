import { beforeEach, describe, expect, it } from "vitest";
import { GetAllProducts } from "../../../src/app/products/useCase/GetAllProducts";
import { Product } from "../../../src/domain/entites/Product";
import { InMemoryRepository } from "../../doubles/InMemoryRepository";

let sequence = 0;
const createId = () => `product-id-${++sequence}`;

const buildUseCase = () => {
    const repository = new InMemoryRepository<Product>();
    const useCase = new GetAllProducts(repository);
    return { useCase, repository };
};

describe("GetAllProducts", () => {
    let context: ReturnType<typeof buildUseCase>;

    beforeEach(() => {
        context = buildUseCase();
    });

    it("retorna lista vazia quando não há produtos", async () => {
        const output = await context.useCase.execute();

        expect(output).toEqual([]);
    });

    it("retorna todos os produtos no formato de Output", async () => {
        const first = Product.build(createId, "Dipirona", "19.90", null, 10);
        const second = Product.build(createId, "Paracetamol", "12.50", "1.00", 5);
        await context.repository.save(first);
        await context.repository.save(second);

        const output = await context.useCase.execute();

        expect(output).toHaveLength(2);
        expect(output).toContainEqual({ id: first.id, name: "Dipirona", price: "19.90", discount: null, stock: 10 });
        expect(output).toContainEqual({
            id: second.id,
            name: "Paracetamol",
            price: "12.50",
            discount: "1.00",
            stock: 5,
        });
    });

    it("não expõe campos internos da entidade no Output", async () => {
        const product = Product.build(createId, "Dipirona", "19.90", null, 10);
        await context.repository.save(product);

        const [output] = await context.useCase.execute();

        expect(output).not.toHaveProperty("deleted_at");
        expect(output).not.toHaveProperty("created_at");
        expect(output).not.toHaveProperty("updated_at");
    });
});
