import { DependencyInjection } from "../pattern/DI";
import { OrderRouter } from "../routers/OrderRouter";
import { ServiceAuthToken } from "../security/ServiceAuthToken";
import { ServerPort } from "../server/ServerPort";

export class OrderModule {
    constructor(private di:DependencyInjection, private service:ServiceAuthToken) {
        new OrderRouter(this.di.getDependency<ServerPort>(ServerPort),this.service)
    }
    
}