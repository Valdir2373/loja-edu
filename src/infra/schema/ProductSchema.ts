import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.string(),
  discount: z.string().nullable(),
  stock: z.number().int().min(0),
});

export type ProductInput = z.infer<typeof ProductSchema>;