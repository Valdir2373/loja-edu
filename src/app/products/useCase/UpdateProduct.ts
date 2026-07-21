import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { Product } from "../../../domain/entites/Product";
import { NotFoundError } from "../../../domain/errors/NotFoundError";
import { ProductInput } from "../dto/ProductInput";
import { ProductOutput } from "../dto/ProductOutput";

export class UpdateProduct {
    constructor(private repo: RepositoryPort<Product>) {}

    async execute(id: string, input: Partial<ProductInput>): Promise<ProductOutput> {
        const product = await this.repo.findById(id);
        if (!product) {
            throw new NotFoundError("Produto não encontrado.");
        }

        product.updateFields(input);
        await this.repo.update(id, product);

        return {
            id: product.id,
            name: product.name,
            price: product.price,
            discount: product.discount,
            stock: product.stock,
        };
    }
}
