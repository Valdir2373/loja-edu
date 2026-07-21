import express, { Express, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { methodHttp, middleWare, ServerPort } from "./ServerPort";

export class ServerExpressAdapter extends ServerPort {
    private app: Express;

    constructor() {
        super();
        this.app = express();
        this.app.disable("x-powered-by");
        this.app.set("trust proxy", true);
        this.app.use(express.json({ limit: "100mb" }));
        this.app.use(cookieParser());
    }

    async addRouter(methodHttp: methodHttp, path: string, ...callback: middleWare[]): Promise<void> {
        console.log(`Rota registrada: ${methodHttp.toUpperCase()}: ${path}`);

        this.app[methodHttp](path, ...callback);
    }

    serveStatic(routePrefix: string, folderPath: string): void {
        this.app.use(routePrefix, express.static(folderPath, { index: "index.html" }));
    }

    listen(port: number): void {
        this.registerErrorHandler();
        this.app.listen(port);
    }

    private registerErrorHandler(): void {
        this.app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
            if (error instanceof SyntaxError && "body" in error) {
                res.status(400).json({ error: "Corpo da requisição inválido." });
                return;
            }
            console.error("Erro não tratado capturado pelo handler global do servidor:", error);
            res.status(500).json({ error: "Erro interno do servidor." });
        });
    }
}
