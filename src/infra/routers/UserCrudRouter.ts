import { ServerPort, middleWare, methodHttp, IRequest } from "../server/ServerPort";
import { UserCrudController } from "../controller/UserCrudController";
import { UserInput } from "../../app/users/dto/UserInput";
import { UserValidator } from "../validators/UserValidator";
export interface UserInjection {
    userInput: UserInput;       
    userPartialInput: Partial<UserInput>; 
}

export class UserCrudRouter {
    constructor(
        private server: ServerPort,
        private userCrudController: UserCrudController,
        private validator: UserValidator
    ) {
        this.boot();
    }

    private boot() {
        this.registerRouterUserInput("post", "/users", this.createUser.bind(this));
        this.registerRouterUpdateUser("put", "/users/:id", this.updateUser.bind(this));
        this.server.addRouter("get", "/users/:id", this.getUser.bind(this));
        this.server.addRouter("delete", "/users/:id", this.deleteUser.bind(this));
    }

    private registerRouterUserInput(method: methodHttp, path: string, ...callback: middleWare[]) {
        this.server.addRouter(method, path, this.validatorUserInput.bind(this), ...callback);
    }

    private registerRouterUpdateUser(method: methodHttp, path: string, ...callback: middleWare[]) {
        this.server.addRouter(method, path, this.validatorInputUpdate.bind(this), ...callback);
    }



    

    private validatorUserInput: middleWare = (req, res, next) => {
        try {
            const data = this.validator.validate(req.body);
            (req as IRequest<any, any, any, UserInjection>).userInput = data;
            next();
        } catch (error) {
            const details = this.validator.formatError(error);
            res.status(400).json({ message: "Validation failed", details });
        }
    }

    private validatorInputUpdate: middleWare = (req, res, next) => {
        try {
            const data = this.validator.validateUpdate(req.body);
            (req as IRequest<any, any, any, UserInjection>).userPartialInput = data;
            next();
        } catch (error) {
            const details = this.validator.formatError(error);
            res.status(400).json({ message: "Validation failed", details });
        }
    }


    private createUser: middleWare = async (req, res) => {
        try {
            const input = (req as IRequest<any, any, any, UserInjection>).userInput;
            const result = await this.userCrudController.create(input);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    private getUser: middleWare = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.userCrudController.getById(id);
            res.json(result);
        } catch (error: any) {
            res.status(404).json({ message: error.message });
        }
    }

    private updateUser: middleWare = async (req, res) => {
        try {
            const { id } = req.params;
            const input = (req as IRequest<any, any, any, UserInjection>).userInput;
            await this.userCrudController.update(id, input);
            res.status(200).json({ message: "Usuário atualizado com sucesso" });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    private deleteUser: middleWare = async (req, res) => {
        try {
            const { id } = req.params;
            await this.userCrudController.delete(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}