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

export class UserModule {
    constructor(private di: DependencyInjection) {
        const db = this.di.getDependency<DataAccessPort>(DataAccessPort);
        const server = this.di.getDependency<ServerPort>(ServerPort);
        const validator = this.di.getDependency<DTOBuilderAndValidator>(DTOBuilderAndValidator)
        const repository = new UserRepository(db);
        const userValidator = new UserValidator(validator);
        const crudController = new UserCrudController(
            new CreateUser(repository, createIdAdapter),
            new GetUser(repository),
            new UpdateUser(repository),
            new DeleteUser(repository)
        );
        new UserCrudRouter(server, crudController, userValidator);
    }
}