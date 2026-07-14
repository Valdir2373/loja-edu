import { User } from "../../../domain/entites/User";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";

export class VerifyEmail {
    constructor(private repo: RepositoryPort<User>) {}
    async execute(email: string) {
        const user = await this.repo.findBy({ email });
        if (!user) {
            throw new Error("User not found to verify email");
        }
        if (user.isVerified) {
            return; 
        }
        await this.repo.update(user.id, { isVerified: true });
    }
}