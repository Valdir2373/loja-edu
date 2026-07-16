import { ServerPort } from "../server/ServerPort";
import { DataAccessPort } from "../../domain/database/DataAcess";
import { UserRepository } from "../repository/UserRepository";
import { UserValidator } from "../validators/UserValidator";
import { createIdAdapter } from "../utils/createId";
import { UserCrudController } from "../controller/UserCrudController";
import { DependencyInjection } from "../pattern/DI";
import { CreateUser } from "../../app/users/useCase/CreateUser";
import { UpdateUser } from "../../app/users/useCase/UpdateUser";
import { UserCrudRouter } from "../routers/UserCrudRouter";
import { GetUser } from "../../app/users/useCase/GetUser";
import { DeleteUser } from "../../app/users/useCase/DeleteUser";
import { DTOBuilderAndValidator } from "../shared/validators/DTOBuilderAndValidator";
import { PasswordHasher } from "../../domain/security/PasswordHasher";
import { EmailPort } from "../email/EmailPort";
import { UserAuthController } from "../controller/UserAuthController";
import { LoginUser } from "../../app/users/useCase/LoginUser";
import { VerifyEmail } from "../../app/users/useCase/VerifyEmail";
import { ServiceAuthToken } from "../security/ServiceAuthToken";
import { UserAuthRouter } from "../routers/UserAuthRouter";

export class UserModule {
    constructor(private di: DependencyInjection,serviceAuthToken:ServiceAuthToken) {
        const passwordHasher:PasswordHasher = this.di.getDependency<PasswordHasher>(PasswordHasher)
        const db = this.di.getDependency<DataAccessPort>(DataAccessPort);
        const server = this.di.getDependency<ServerPort>(ServerPort);
        const validator = this.di.getDependency<DTOBuilderAndValidator>(DTOBuilderAndValidator)
        const email = this.di.getDependency<EmailPort>(EmailPort)
        const repository = new UserRepository(db);
        const userValidator = new UserValidator();


        const crudController = new UserCrudController(
            new CreateUser(repository, createIdAdapter,passwordHasher),
            new GetUser(repository),
            new UpdateUser(repository),
            new DeleteUser(repository),
            email,
            serviceAuthToken
        );
        new UserCrudRouter(server, crudController, userValidator,serviceAuthToken);

        const authController = new UserAuthController(
            new LoginUser(repository,passwordHasher),
            new VerifyEmail(repository),serviceAuthToken
        )
        new UserAuthRouter(server,authController, userValidator) 
    }
}