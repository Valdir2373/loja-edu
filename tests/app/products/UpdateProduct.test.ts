import { beforeEach, describe, expect, it } from "vitest";
import { UpdateProduct } from "../../../src/app/products/useCase/UpdateProduct";
import { Product } from "../../../src/domain/entites/Product";
import { NotFoundError } from "../../../src/domain/errors/NotFoundError";
import { InMemoryRepository } from "../../doubles/InMemoryRepository";

const createId = () => "product-id-1";

const buildUseCase = () => {
    const repository = new InMemoryRepository<Product>();
    const useCase = new UpdateProduct(repository);
    return { useCase, repository };
};

describe("UpdateProduct", () => {
    let context: ReturnType<typeof buildUseCase>;

    beforeEach(() => {
        context = buildUseCase();
    });

    it("atualiza os campos informados e devolve o Output sem campos internos", async () => {
        const product = Product.build(createId, "Dipirona", "19.90", null, 10);
        await context.repository.save(product);

        const output = await context.useCase.execute(product.id, { stock: 3 });

        expect(output).toEqual({ id: product.id, name: "Dipirona", price: "19.90", discount: null, stock: 3 });
        expect(output).not.toHaveProperty("updated_at");
    });

    it("recusa atualizar produto inexistente", async () => {
        await expect(context.useCase.execute("id-inexistente", { stock: 1 })).rejects.toThrow(NotFoundError);
        await expect(context.useCase.execute("id-inexistente", { stock: 1 })).rejects.toThrow(
            "Produto não encontrado."
        );
    });
});
