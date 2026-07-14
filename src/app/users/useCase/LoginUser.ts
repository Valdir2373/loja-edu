import { User } from "../../../domain/entites/User";
import { RepositoryPort } from "../../../domain/repository/RepositoryPort";
import { PasswordHasher } from "../../../domain/security/PasswordHasher";
import { UserLoginInput } from "../dto/UserLoginInput";
import { UserOutput } from "../dto/UserOutput";

export class LoginUser {
    constructor(
        private userRepository: RepositoryPort<User>,
        private passwordHasher: PasswordHasher
    ) {}

    async execute(input: UserLoginInput): Promise<UserOutput> {
        
        const user = await this.userRepository.findBy({ email: input.email } as any);
        if (!user) {
            throw new Error("Credenciais inválidas.");
        }

        const isPasswordValid = await this.passwordHasher.compare(input.password, user.password);
        if (!isPasswordValid) {
            throw new Error("Credenciais inválidas.");
        }

        return { 
            id: user.id, 
            name: user.name, 
            email: user.email 
        };
    }
}