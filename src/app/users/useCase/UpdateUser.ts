import { User } from "../../../domain/entites/User";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { UserInput } from "../dto/UserInput";

export class UpdateUser {
    constructor(private repo: RepositoryPort<User>) {}
    async execute(id: string, input: Partial<UserInput>): Promise<void> {
        const user = await this.repo.findById(id);
        if (!user) throw new Error("Usuário não encontrado");
        await this.repo.update(id, input as any);
    }
}