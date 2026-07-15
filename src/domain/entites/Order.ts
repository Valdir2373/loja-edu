export class Order {
  private _cachedTotal: number | null = null;
  constructor(
    public id: string,
    public userId: string,
    public items: { productId: string; quantity: number; priceAtPurchase: number }[],
    public total: number,
    public status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELLED',
    public created_at: Date = new Date(),
    public updated_at: Date = new Date(),
    public deleted_at: Date | null = null 
  ) {
    this._cachedTotal = total;
  }
  get totalAmount(): number {
    if (this._cachedTotal !== null) {
      return this._cachedTotal;
    }
    this._cachedTotal = this.items.reduce((acc, item) => {
      return acc + (item.priceAtPurchase * item.quantity);
    }, 0);
    return this._cachedTotal;
  }
  markAsUpdated(): void {
    this.updated_at = new Date();
  }
  softDelete(): void {
    this.deleted_at = new Date();
  }
  addItem(item: { productId: string; quantity: number; priceAtPurchase: number }): void {
    this.items.push(item);
    this._cachedTotal = null; 
    this.markAsUpdated();
  }
  refreshTotal(): void {
    this._cachedTotal = null;
    this.total = this.totalAmount;
  }
}