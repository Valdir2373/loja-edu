import { User } from "../../../domain/entites/User";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";

export class DeleteUser {
    constructor(private repo: RepositoryPort<User>) {}
    async execute(id: string): Promise<number> {
        return await this.repo.delete(id);
    }
}