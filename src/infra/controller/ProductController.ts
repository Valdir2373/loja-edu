import { ProductInput } from "../../app/products/dto/ProductInput";

export class ProductController {
    constructor() {
    }

    create(productInput:ProductInput){
        console.log(productInput);
        
    }
}