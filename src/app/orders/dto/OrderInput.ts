export interface OrderInput {
    userId: string;
    items: { 
        productId: string; 
        quantity: number; 
    }[];
}