export interface OrderOutput {
    id: string;
    userId: string;
    items: { 
        productId: string; 
        quantity: number; 
        priceAtPurchase: number; 
    }[];
    total: number;
    status: string;
    createdAt: Date;
}
