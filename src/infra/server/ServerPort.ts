export type methodHttp = "get" | "post" | "put" | "delete"

export type IRequest<TBody = any, TParams = any, TQuery = any, TInjected = {}> = {
    body: TBody;
    params: TParams;
    query: TQuery;
} & TInjected;

export type IResponse = {
    send(message?:string):any,
    json(body:any):any,
    status(status:number):IResponse
}

export type middleWare = (req:IRequest,res:IResponse, next:()=>void)=>any

export abstract class ServerPort {
    listen(port:number){}
    addRouter(methodHttp:methodHttp, path:string, ...callback:middleWare[]){
    }
} 

