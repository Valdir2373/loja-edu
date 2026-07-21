import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { Product } from "../../../domain/entites/Product";
import { NotFoundError } from "../../../domain/errors/NotFoundError";

export class DeleteProduct {
    constructor(private repo: RepositoryPort<Product>) {}

    async execute(id: string): Promise<void> {
        const product = await this.repo.findById(id);
        if (!product) {
            throw new NotFoundError("Produto não encontrado.");
        }
        product.softDelete();
        await this.repo.update(id, product);
    }
}
