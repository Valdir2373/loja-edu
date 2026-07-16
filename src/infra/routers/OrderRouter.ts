import { ServiceAuthToken } from "../security/ServiceAuthToken";
import { ServerPort } from "../server/ServerPort";

export class OrderRouter {
    constructor(private server:ServerPort, private serviceToken:ServiceAuthToken) {
        this.setupRouters()
    }
    setupRouters(){
        this.server.addRouter("post", "/createOrder", async (req,res)=>{
        try{
            await this.verifyToken(req.cookies.tokenUser)
            res.send("oi")
        }catch(e:any){
            res.status(401).send("acesso não autorizado")
        }
        })
    }
    private async verifyToken(token:string){
            const id = await this.serviceToken.verifySessionToken(token)
            console.log(id);
        
    }
}