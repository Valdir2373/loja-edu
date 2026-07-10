import { UserInput } from "../../app/users/dto/UserInput";
import { ValidationError } from "../shared/errors/ValidationError";
import { DTOBuilderAndValidator } from "../shared/validators/DTOBuilderAndValidator";

export class UserValidator {
    
    constructor(private builder: DTOBuilderAndValidator) {
        this.builder.defineSchema(
            { name: "name", type: "string", minLength: 3, maxLength: 100 },
            { name: "email", type: "string", email: true },
            { name: "password", type: "string", minLength: 6, maxLength: 50 }
        );
    }

    validate(data: unknown): UserInput {
        return this.builder.validateAndTransform(data as UserInput);
    }

    validateUpdate(data: unknown): Partial<UserInput> {
        
        
        this.builder.defineSchema(
            { name: "name", type: "string", minLength: 3, required: false },
            { name: "email", type: "string", email: true, required: false },
            { name: "password", type: "string", minLength: 6, required: false }
        );
        return this.builder.validateAndTransform(data as Partial<UserInput>);
    }

    formatError(error: any): Record<string, string[]> {
        
        
        if (error instanceof ValidationError) {
            return error.details.reduce((acc: Record<string, string[]>, issue) => {
                const path = issue.path;
                if (!acc[path]) acc[path] = [];
                acc[path].push(issue.message);
                return acc;
            }, {});
        }
        return { general: ["Erro de validação desconhecido"] };
    }
}