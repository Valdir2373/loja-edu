// src/app/user/useCase/CreateUser.ts
import { User } from "../../../domain/entites/User";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { UserInput } from "../dto/UserInput";
import { UserOutput } from "../dto/UserOutput";

export class CreateUser {
    constructor(private repo: RepositoryPort<User>, private createId: () => string) {}

    async execute(input: UserInput): Promise<UserOutput> {
        if (await this.repo.exists({ email: input.email } as any)) 
            throw new Error("Email já cadastrado");
        
        const user = User.build(this.createId, input.name, input.email, input.password);
        await this.repo.save(user);
        return { id: user.id, name: user.name, email: user.email };
    }
}
