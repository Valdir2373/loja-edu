import { DataAccessPort } from "../../domain/database/DataAcess";
import { Product } from "../../domain/entites/Product";
import { RepositoryPort } from "../../domain/repository/RepositoryPort";
import { DependencyInjection } from "../pattern/DI";
import { ProductRepository } from "../repository/ProductRepository";
import { ServerPort } from "../server/ServerPort";

export class ProductModule {
    private server:ServerPort
    private db:DataAccessPort
    private productRepository:RepositoryPort<Product>
    constructor(private di:DependencyInjection) {
        this.db = this.di.getDependency(DataAccessPort)
        this.productRepository = new ProductRepository(this.db)
        this.server = this.di.getDependency(ServerPort)
        
    }
}