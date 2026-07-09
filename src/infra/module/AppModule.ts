import { DependencyInjection } from "../pattern/DI";
import { ServerExpressAdapter } from "../server/ServerExpressAdapter";
import { ServerPort } from "../server/ServerPort";
import { ViewModule } from "./ViewModule";

export class AppModule {
    private di:DependencyInjection
    private server:ServerPort
    constructor() {
        this.di = new DependencyInjection()
        this.server = new ServerExpressAdapter()
        this.di.addDependency(this.server,ServerPort)
        this.modules()
    }
    
    private modules(){
        new ViewModule(this.di)
    }

    listen(port:number){
        this.server.listen(port)
    }
}