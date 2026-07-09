import { ServerPort } from "../server/ServerPort";

export class ProductController {
    constructor(private server:ServerPort) {
        this.server.addRouter("post", "/product/create", (req,res)=>{
            res.send("pront")
        })
    }
}