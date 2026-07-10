import { ProductInput } from "../../app/products/dto/ProductInput";
import { ValidationError } from "../shared/errors/ValidationError";
import { DTOBuilderAndValidator } from "../shared/validators/DTOBuilderAndValidator";

export class ProductValidator {
  constructor(private builder: DTOBuilderAndValidator) {
    
    this.builder.defineSchema(
      { name: "name", type: "string", minLength: 3, required: true },
      { name: "price", type: "string", required: true },
      { name: "discount", type: "string", required: false },
      { name: "stock", type: "number", integer: true, required: true }
    );
  }

  validate(data: unknown): ProductInput {
    
    return this.builder.validateAndTransform(data as ProductInput);
  }

  
  
  validateUpdate(data: unknown): Partial<ProductInput> {
    
    return this.builder.validateAndTransform(data as Partial<ProductInput>);
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