import { UserInput } from "../../app/users/dto/UserInput";
import { UserOutput } from "../../app/users/dto/UserOutput";
import { CreateUser } from "../../app/users/useCase/CreateUser";
import { DeleteUser } from "../../app/users/useCase/DeleteUser";
import { UpdateUser } from "../../app/users/useCase/UpdateUser";
import { EmailPort } from "../email/EmailPort";
import { ServiceAuthToken } from "../security/ServiceAuthToken";

export class UserCrudController {
    constructor(
        private createUser: CreateUser,
        private updateUser: UpdateUser,
        private removeUser: DeleteUser,
        private email: EmailPort,
        private serviceToken: ServiceAuthToken,
    ) {}

    async create(input: UserInput):Promise<UserOutput> {
        const userOutput = await this.createUser.execute(input);
        const token = await this.createTokenVerify(userOutput)
        await this.email.sendVerificationEmail(input.email,token)
        return userOutput
    }

    async createTokenVerify(userOutput:UserOutput){
        return this.serviceToken.generateTimeSetToken(userOutput,"1h")
    }

    async update(id: string, input: Partial<UserInput>) {
        return await this.updateUser.execute(id, input);
    }

    async delete(id: string) {
        return await this.removeUser.execute(id);
    }
}