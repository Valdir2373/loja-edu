import { DependencyInjection } from "../pattern/DI";
import { ServerPort } from "../server/ServerPort";

export class ViewModule {
    private server:ServerPort
    constructor(private di:DependencyInjection){
        this.server = this.di.getDependency(ServerPort)
        this.bot()
    }

    private bot(){
        this.server.addRouter("get","/",(req,res)=>{
            res.send("<h1>oi</h1>")
        })
    }

}