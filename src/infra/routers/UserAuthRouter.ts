import { UserAuthController } from "../controller/UserAuthController";
import { ServerPort, IRequest, IResponse } from "../server/ServerPort";

export class UserAuthRouter {
    constructor(private server: ServerPort, private controller: UserAuthController) {
        this.setupRoutes();
    }

    private setupRoutes() {
        this.server.addRouter("post", "/auth/login", async (req: IRequest, res: IResponse) => {
            const result = await this.controller.login(req.body);
            return res.status(200).json(result);
        });
        this.server.addRouter("get", "/auth/verify-email", async (req: IRequest, res: IResponse) => {
            const { token } = req.query;
            if (!token) return res.status(400).send("Token é obrigatório.");

            const result = await this.controller.verifyEmail(token);
            return res.status(200).json(result);
        });
        this.server.addRouter("post", "/auth/refresh", async (req: IRequest, res: IResponse) => {
            const token = req.body.refreshToken;
            
            return res.status(200).json({ message: "Refresh não implementado ainda" });
        });
    }
}