import { OrderInput } from "../../app/orders/dto/OrderInput";
import { ValidationError } from "../shared/errors/ValidationError";
import { DTOBuilderAndValidator } from "../shared/validators/DTOBuilderAndValidator";
import { ZodDTOBuilderAndValidator } from "../shared/validators/ZodDTOBuilderAndValidator";

export class OrderValidator {

    constructor() {}
    
    private createBuilder(): DTOBuilderAndValidator {
        return new ZodDTOBuilderAndValidator();
    }

    validate(data: unknown): Omit<OrderInput, 'userId'> {
        const builder = this.createBuilder();

        builder.defineSchema(
            {
                name: "items",
                type: "array",
                required: true,
                requiredMessage: "A lista de itens é obrigatória.",
                items: {
                    name: "item",
                    type: "object",
                    required: true,
                    fields: [
                        { 
                            name: "productId", 
                            type: "string", 
                            required: true, 
                            uuid: true,
                            message: "O ID do produto deve ser um UUID válido." 
                        },
                        { 
                            name: "quantity", 
                            type: "number", 
                            required: true, 
                            positive: true, 
                            integer: true,
                            message: "A quantidade deve ser um número inteiro positivo." 
                        }
                    ]
                }
            } as any 
        );

        return builder.validateAndTransform(data as any);
    }

    formatError(error: any): Record<string, string[]> {
        if (error instanceof ValidationError) {
            return error.details.reduce((acc: Record<string, string[]>, issue: any) => {
                const path = issue.path || "general";
                if (!acc[path]) acc[path] = [];
                acc[path].push(issue.message);
                return acc;
            }, {});
        }
        
        return { general: ["Ocorreu um erro inesperado na validação dos dados."] };
    }
}