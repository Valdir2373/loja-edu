import { DataAccessPort } from "../../domain/database/DataAcess";
import { ConfigDb } from "../config/ConfigDb";
import { ConfigEnv } from "../config/ConfigEnv";
import { PostgresDataAccess } from "../database/PostgresDataAccess";
import { DependencyInjection } from "../pattern/DI";
import { ProductInput } from "../schema/ProductSchema";
import { ServerExpressAdapter } from "../server/ServerExpressAdapter";
import { ServerPort } from "../server/ServerPort";
import { Validator } from "../validators/Validator";
import { ProductValidator } from "../validators/ProductValidator";
import { ProductModule } from "./ProductModule";


export class AppModule {
    private di:DependencyInjection
    private server:ServerPort
    private db: DataAccessPort
    private config:ConfigEnv
    private configDb:ConfigDb
    constructor() {
        const productValidator = new ProductValidator()
        this.config = new ConfigEnv()
        this.configDb = new ConfigDb(this.config)
        this.di = new DependencyInjection()
        this.server = new ServerExpressAdapter()
        this.db = new PostgresDataAccess(this.configDb)
        this.di.addDependency(this.server,ServerPort)
        this.di.addDependency(this.db,DataAccessPort)
        this.di.addDependency(productValidator, Validator<ProductInput>)
        this.modules()
    }
    
    private modules(){
        new ProductModule(this.di)
    }

    listen(port:number){
        this.server.listen(port)
    }
}