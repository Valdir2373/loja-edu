import { UserInput } from "../../app/users/dto/UserInput";
import { CreateUser } from "../../app/users/useCase/CreateUser";
import { DeleteUser } from "../../app/users/useCase/DeleteUser";
import { GetUser } from "../../app/users/useCase/GetUser";
import { UpdateUser } from "../../app/users/useCase/UpdateUser";

export class UserCrudController {
    constructor(
        private createUser: CreateUser,
        private getUser: GetUser,
        private updateUser: UpdateUser,
        private removeUser: DeleteUser
    ) {}

    async create(input: UserInput) {
        return await this.createUser.execute(input);
    }

    async getById(id: string) {
        return await this.getUser.execute(id);
    }

    async update(id: string, input: Partial<UserInput>) {
        return await this.updateUser.execute(id, input);
    }

    async delete(id: string) {
        return await this.removeUser.execute(id);
    }
}