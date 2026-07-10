export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly created_at: Date = new Date(),
    public readonly updated_at: Date = new Date(),
    public readonly deleted_at: Date | null = null
  ) {}

  static build(
    createId: () => string,
    name: string,
    email: string,
    password: string
  ): User {
    return new User(createId(), name, email, password);
  }

  public softDelete(): void {
    (this as any).deleted_at = new Date();
  }
}