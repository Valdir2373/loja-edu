import express, { Express } from "express";
import cookieParser from "cookie-parser"; 
import { methodHttp, middleWare, ServerPort } from "./ServerPort";

export class ServerExpressAdapter extends ServerPort {
    private app: Express;

    constructor() {
        super();
        this.app = express();
        this.app.use(express.json({ limit: "100mb" }));
        this.app.use(cookieParser());
    }

    addRouter(methodHttp: methodHttp, path: string, ...callback: middleWare[]): void {
        console.log(`Rota registrada: ${methodHttp.toUpperCase()}: ${path}`);
        this.app[methodHttp](path, ...callback);
    }

    listen(port: number): void {
        this.app.listen(port, () => console.log("Servidor rodando em " + port));
    }
}