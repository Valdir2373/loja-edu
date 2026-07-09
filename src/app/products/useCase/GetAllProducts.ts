import { Product } from "../../../domain/entites/Product";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";

export class GetAllProducts {
    constructor(private repo: RepositoryPort<Product>) {}

    async execute(): Promise<Product[]> {
        console.log(this.repo);
        
        return await this.repo.findAll();
    }
}