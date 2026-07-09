import { DataAccessPort } from "../../domain/database/DataAcess";
import { Product } from "../../domain/entites/Product";
import { RepositoryPort } from "../../domain/repository/RepositoryPort";
import { ProductController } from "../controller/ProductController";
import { DependencyInjection } from "../pattern/DI";
import { ProductRepository } from "../repository/ProductRepository";
import { ProductRouter } from "../routers/ProductRouter";
import { ProductInput } from "../schema/ProductSchema";
import { ServerPort } from "../server/ServerPort";
import { Validator } from "../validators/Validator";

export class ProductModule {
    private server:ServerPort
    private db:DataAccessPort
    private productValidator: Validator<ProductInput>
    constructor(private di:DependencyInjection) {
        this.productValidator = this.di.getDependency(Validator<ProductInput>)
        this.db = this.di.getDependency(DataAccessPort)
        this.server = this.di.getDependency(ServerPort)
        const controller = new ProductController()
        const productRepository = new ProductRepository(this.db)
        const routers = new ProductRouter(this.server,controller,this.productValidator)

    }
}