import { User } from "../../../domain/entites/User";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { PasswordHasher } from "../../../domain/security/PasswordHasher";
import { UserInput } from "../dto/UserInput";
import { UserOutput } from "../dto/UserOutput";

export class CreateUser {
    constructor(
        private repo: RepositoryPort<User>, 
        private createId: () => string, 
        private passwordHasher: PasswordHasher,
    ) {}
    async execute(input: UserInput): Promise<UserOutput> {
        if (await this.repo.exists({ email: input.email } as any)) {
            throw new Error("Email já cadastrado");
        }
        const hashedPassword = await this.passwordHasher.hash(input.password);
        const user = User.build(
            this.createId, 
            input.name, 
            input.email, 
            hashedPassword
        );
        await this.repo.save(user);
        console.log("Usuario criado: "+user.id);
        
        return { id: user.id, name: user.name, email: user.email };
    }
}