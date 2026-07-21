import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { Product } from "../../../domain/entites/Product";
import { ConflictError } from "../../../domain/errors/ConflictError";
import { ProductInput } from "../dto/ProductInput";
import { ProductOutput } from "../dto/ProductOutput";

export class CreateProduct {
    constructor(private repo: RepositoryPort<Product>, private createId: () => string) {}

    async execute(input: ProductInput): Promise<ProductOutput> {
        const alreadyExists = await this.repo.exists({ name: input.name });
        if (alreadyExists) {
            throw new ConflictError("Produto já cadastrado.");
        }

        const product = Product.build(this.createId, input.name, input.price, input.discount, input.stock);
        await this.repo.save(product);

        return {
            id: product.id,
            name: product.name,
            price: product.price,
            discount: product.discount,
            stock: product.stock,
        };
    }
}
