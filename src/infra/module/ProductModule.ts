import { DataAccessPort } from "../../domain/database/DataAcess";
import { DependencyInjection } from "../pattern/DI";
import { ServerPort } from "../server/ServerPort";

export class ProductModule {
    private server:ServerPort
    private db:DataAccessPort
    constructor(private di:DependencyInjection) {
        this.db = this.di.getDependency(DataAccessPort)
        this.server = this.di.getDependency(ServerPort)
    }
}