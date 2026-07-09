import { ProductController } from "../controller/ProductController";
import { ProductInput } from "../schema/ProductSchema";
import { IRequest, middleWare, ServerPort } from "../server/ServerPort";
import { Validator } from "../validators/Validator";

type ProductInjection = { productInput: ProductInput };

export class ProductRouter {
    constructor(
        private server: ServerPort,
        private productController: ProductController,
        private validator: Validator<ProductInput>
    ) {
        this.boot();
    }

    private boot() {
        this.server.addRouter("post", "/", this.validatorProductInput, this.createProduct.bind(this));
    }

    private validatorProductInput: middleWare = (req, res, next) => {
    try {
        const data = this.validator.validate(req.body);
        (req as IRequest<any, any, any, ProductInjection>).productInput = data;
        next();
    } catch (error) {
        // O middleware apenas delega a formatação para quem conhece o erro
        const details = this.validator.formatError(error);
        res.status(400).json({ message: "Validation failed", details });
    }

    }

    private createProduct: middleWare = (req, res) => {
        const input = (req as IRequest<any, any, any, ProductInjection>).productInput;
        this.productController.create(input);
        res.send("foiii")
    }
}