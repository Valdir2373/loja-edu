import { User } from "../../../domain/entites/User";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { UserOutput } from "../dto/UserOutput";

export class GetUser {
    constructor(private repo: RepositoryPort<User>) {}
    async execute(id: string): Promise<UserOutput> {
        const user = await this.repo.findById(id);
        if (!user) throw new Error("Usuário não encontrado");
        return { id: user.id, name: user.name, email: user.email };
    }
}