import { ProductController } from "../controller/ProductController";
import { middleWare, ServerPort } from "../server/ServerPort";

export class ProductRouter {
    constructor(private server:ServerPort, private productController:ProductController){
        this.boot()
    }
    boot(){
        this.server.addRouter("get","/",this.createProduct.bind(this))
    }
    private createProduct:middleWare = (req,res)=>{
        res.send("olá")
        this.productController.log()
    }
}