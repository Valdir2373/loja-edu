// src/infra/validators/ProductValidator.ts
import { z } from "zod";
import { Validator } from "./Validator";
import { ProductInput } from "../../app/products/dto/ProductInput";

export class ProductValidator extends Validator<ProductInput> {
  private schema = z.object({
    name: z.string().min(3),
    price: z.string(), 
    discount: z.string().nullable().optional(),
    stock: z.number().int(),
  });

  validate(data: unknown): ProductInput {
    return this.schema.parse(data) as ProductInput;
  }

  formatError(error: any): Record<string, string[]> {
    if (error?.issues) {
      return error.issues.reduce((acc: any, issue: any) => {
        const path = issue.path[0];
        if (!acc[path]) acc[path] = [];
        acc[path].push(issue.message);
        return acc;
      }, {});
    }
    return { general: ["Erro de validação desconhecido"] };
  }
}