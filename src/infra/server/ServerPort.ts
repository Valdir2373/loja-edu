export type methodHttp = "get" | "post" | "put" | "delete";

export type IRequest<TBody = any, TParams = any, TQuery = any, TInjected = {}> = {
    body: TBody;
    params: TParams;
    query: TQuery;
    cookies: any; 
    headers: any; 
} & TInjected;

export type IResponse = {
    send(message?: string): any;
    json(body: any): any;
    status(status: number): IResponse;
    cookie(name: string, val: string, options?: any): IResponse; 
    clearCookie(name: string): IResponse; 
}

export type middleWare = (req: IRequest, res: IResponse, next: () => void) => any;

export abstract class ServerPort {
    abstract listen(port: number): void;
    abstract addRouter(methodHttp: methodHttp, path: string, ...callback: middleWare[]): void;
}