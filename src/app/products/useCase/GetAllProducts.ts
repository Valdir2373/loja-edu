import { Product } from "../../../domain/entites/Product";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { ProductOutput } from "../dto/ProductOutput";

export class GetAllProducts {
    constructor(private repo: RepositoryPort<Product>) {}

    async execute(): Promise<ProductOutput[]> {
        const products = await this.repo.findAll();
        return products.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            discount: product.discount,
            stock: product.stock,
        }));
    }
}
