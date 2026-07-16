import { UserInput } from "../../app/users/dto/UserInput";
import { UserLoginInput } from "../../app/users/dto/UserLoginInput";
import { ValidationError } from "../shared/errors/ValidationError";
import { DTOBuilderAndValidator } from "../shared/validators/DTOBuilderAndValidator";
import { ZodDTOBuilderAndValidator } from "../shared/validators/ZodDTOBuilderAndValidator"; // Importe a implementação concreta

export class UserValidator {

    constructor(){}
    
    private createBuilder(): DTOBuilderAndValidator {
        return new ZodDTOBuilderAndValidator();
    }

    validate(data: unknown): UserInput {
        const builder = this.createBuilder();
        builder.defineSchema(
            { name: "name", type: "string", minLength: 3, maxLength: 100, required: true },
            { name: "email", type: "string", email: true, required: true },
            { name: "password", type: "string", minLength: 6, maxLength: 50, required: true }
        );
        return builder.validateAndTransform(data as UserInput);
    }

    validateUpdate(data: unknown): Partial<UserInput> {
        const builder = this.createBuilder();
        builder.defineSchema(
            { name: "name", type: "string", minLength: 3, required: false },    
            { name: "email", type: "string", email: true, required: false },
            { name: "password", type: "string", minLength: 6, required: false }
        );
        return builder.validateAndTransform(data as Partial<UserInput>);
    }

    validateLogin(data: unknown): UserLoginInput {
        const builder = this.createBuilder();
        builder.defineSchema(
            { name: "email", email: true, required: true, type: "string" },
            { name: "password", minLength: 6, required: true, type: "string" }
        );
        return builder.validateAndTransform(data as UserLoginInput);
    }


    validateAdmin(data:unknown): any{

    }

   formatError(error: any): Record<string, string[]> {
    if (error instanceof ValidationError) {
        const details = error.details;
        const formatted: Record<string, string[]> = {};

        // Itera sobre as chaves do objeto details (ex: "email", "password")
        Object.keys(details).forEach((key:any) => {
            // Ignoramos o campo _errors se for vazio ou não contiver mensagens úteis
            if (key === '_errors') return;

            const fieldError = details[key];
            
            // Verifica se existe uma lista de erros dentro do campo
            if (fieldError && Array.isArray(fieldError._errors)) {
                formatted[key] = fieldError._errors;
            }
        });

        return formatted;
    }
    return { general: ["Erro de validação desconhecido"] };
}
}