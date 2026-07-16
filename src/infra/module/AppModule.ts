import { DataAccessPort } from "../../domain/database/DataAcess";
import { PostgresDataAccess } from "../database/PostgresDataAccess";
import { DependencyInjection } from "../pattern/DI";
import { ServerExpressAdapter } from "../server/ServerExpressAdapter";
import { ServerPort } from "../server/ServerPort";
import { ProductModule } from "./ProductModule";
import { UserModule } from "./UserModule";
import { ZodDTOBuilderAndValidator } from "../shared/validators/ZodDTOBuilderAndValidator";
import { DTOBuilderAndValidator } from "../shared/validators/DTOBuilderAndValidator";
import { AuthTokenManager } from "../security/AuthTokenManager";
import { JsonwebtokenAuthTokenManager } from "../security/JsonwebtokenAuthTokenManager";
import { PasswordHasher } from "../../domain/security/PasswordHasher";
import { Argon2idHasher } from "../security/Argon2idHasher";
import { SmtpEmailServiceAdapter } from "../email/SmptEmailServiceAdapter";
import { EmailPort } from "../email/EmailPort";
import { RedisCacheAdapter } from "../database/RedisCacheAdapter";
import { CachePort } from "../../domain/database/CachePort";
import { ServiceAuthToken } from "../security/ServiceAuthToken";


export class AppModule {
    private di:DependencyInjection
    private server:ServerPort
    private cache:CachePort
    private serviceAuthToken:ServiceAuthToken
    constructor() {
        this.di = new DependencyInjection()
        this.di.addDependency(new RedisCacheAdapter(), CachePort)
        this.di.addDependency(new ServerExpressAdapter(), ServerPort)
        this.di.addDependency(new PostgresDataAccess(), DataAccessPort)
        this.di.addDependency(new ZodDTOBuilderAndValidator(), DTOBuilderAndValidator)
        this.di.addDependency(new JsonwebtokenAuthTokenManager(), AuthTokenManager)
        this.di.addDependency(new Argon2idHasher(), PasswordHasher)
        this.di.addDependency(new SmtpEmailServiceAdapter(), EmailPort)
        this.serviceAuthToken = new ServiceAuthToken(this.di)
        this.server = this.di.getDependency(ServerPort)
        this.cache = this.di.getDependency(CachePort)
        this.modules()
    }
    
    private modules(){
        new ProductModule(this.di)
        new UserModule(this.di,this.serviceAuthToken)
    }

    listen(port:number){
        this.server.listen(port)
    }
}