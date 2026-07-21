import { beforeEach, describe, expect, it } from "vitest";
import { DeleteProduct } from "../../../src/app/products/useCase/DeleteProduct";
import { Product } from "../../../src/domain/entites/Product";
import { NotFoundError } from "../../../src/domain/errors/NotFoundError";
import { InMemoryRepository } from "../../doubles/InMemoryRepository";

const createId = () => "product-id-1";

const buildUseCase = () => {
    const repository = new InMemoryRepository<Product>();
    const useCase = new DeleteProduct(repository);
    return { useCase, repository };
};

describe("DeleteProduct", () => {
    let context: ReturnType<typeof buildUseCase>;

    beforeEach(() => {
        context = buildUseCase();
    });

    it("marca o produto como deletado (soft delete)", async () => {
        const product = Product.build(createId, "Dipirona", "19.90", null, 10);
        await context.repository.save(product);

        await context.useCase.execute(product.id);

        const persisted = await context.repository.findById(product.id);
        expect(persisted?.deleted_at).not.toBeNull();
    });

    it("recusa deletar produto inexistente", async () => {
        await expect(context.useCase.execute("id-inexistente")).rejects.toThrow(NotFoundError);
        await expect(context.useCase.execute("id-inexistente")).rejects.toThrow("Produto não encontrado.");
    });
});
