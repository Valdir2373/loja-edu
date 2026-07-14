export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    private isAdmin: boolean = false,
    private isVerified: boolean = false,
    public readonly created_at: Date = new Date(),
    public readonly updated_at: Date = new Date(),
    private _deleted_at: Date | null = null
  ) {}

  get deleted_at(): Date | null { return this._deleted_at; }

  static build(
    createId: () => string,
    name: string,
    email: string,
    password: string
  ): User {
    if (email.length < 5 || !email.includes('@')) {
      throw new Error("Email inválido.");
    }
    return new User(createId(), name, email, password, false, false);
  }

  public verify(): void {
    if (this.isVerified) throw new Error("Usuário já está verificado.");
    this.isVerified = true;
  }

  public promoteToAdmin(): void {
    this.isAdmin = true;
  }

  public softDelete(): void {
    if (this._deleted_at) throw new Error("Usuário já está deletado.");
    this._deleted_at = new Date();
  }
}