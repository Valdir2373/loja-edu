import { ConfigDomain } from "../config/ConfigDomain";
import { UserAuthController } from "../controller/UserAuthController";
import { ServerPort, IRequest, IResponse, middleWare } from "../server/ServerPort";
import { UserValidator } from "../validators/UserValidator";

export class UserAuthRouter {
    constructor(private server: ServerPort, private controller: UserAuthController, private validate:UserValidator) {
        this.setupRoutes();
    }

    private setupRoutes() {

        this.server.addRouter("post", "/auth/login", this.loginValidateInput.bind(this) ,async (req: IRequest, res: IResponse) => {
            console.log("aqui");
            
            const result = await this.controller.login(req.body);
            res.cookie("tokenUser",result.accessToken,{
                secure:ConfigDomain.secure,
                httpOnly:true,
                sameSite: "strict",
                maxAge: 3600000
            })

            res.cookie("tokenRefresh",result.refreshToken,{
                secure:ConfigDomain.secure,
                httpOnly:true,
                sameSite: "strict",
                maxAge: 5 * 24 * 60 * 60 * 1000
            })

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
    private loginValidateInput:middleWare = (req, res, next)=>{
        try{
            this.validate.validateLogin.bind(this.validate)(req.body)
            next()
        }
        catch(e: any) {
    
            if (!this.validate || typeof this.validate.formatError !== 'function') {
                console.error("Erro: formatError não encontrado em this.validate");
                return res.status(500).json({ error: "Erro interno do servidor: Validador mal configurado" });
            }

        return res.status(400).json(this.validate.formatError(e));
    }
    }       
}