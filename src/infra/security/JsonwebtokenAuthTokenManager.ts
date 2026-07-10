import jwt, { SignOptions } from "jsonwebtoken";
import { AuthTokenManager } from "./AuthTokenManager";
import { IAuthTokenManager, TokenGenerationOptions } from "./IAuthTokenManager";
import { ConfigToken, ITokenSecrets } from "../config/ConfigToken";

export class JsonwebtokenAuthTokenManager extends AuthTokenManager implements IAuthTokenManager {
    private readonly secrets: ITokenSecrets;
    constructor(private configToken: ConfigToken) {
            super();
            this.secrets = this.configToken.getToken();
        }
    private buildSignOptions(baseExpiresIn: string | number, options?: TokenGenerationOptions): SignOptions {
        return {
            expiresIn: (options?.expiresIn ?? baseExpiresIn) as SignOptions['expiresIn'],
            issuer: options?.issuer,
            subject: options?.subject,
            jwtid: options?.jwtid,
            notBefore: options?.notBefore as SignOptions['notBefore'],
            audience: options?.audience
        };
    }

    public generateToken(payload: object, options?: TokenGenerationOptions): string {
        return jwt.sign(payload, this.secrets.jwtSecret, this.buildSignOptions(this.secrets.accessTokenExpiresIn, options));
    }

    public generateRefreshToken(payload: object, options?: TokenGenerationOptions): string {
        return jwt.sign(payload, this.secrets.jwtRefreshSecret, this.buildSignOptions(this.secrets.refreshTokenExpiresIn, options));
    }

    public generateTokenTimerSet(payload: object, expiresIn: string | number, options?: TokenGenerationOptions): string {
        return jwt.sign(payload, this.secrets.jwtTimeSetSecret, this.buildSignOptions(expiresIn, options));
    }

    public verifyToken<T extends object>(token: string): T {
        return jwt.verify(token, this.secrets.jwtSecret) as T;
    }

    public verifyRefreshToken<T extends object>(token: string): T {
        return jwt.verify(token, this.secrets.jwtRefreshSecret) as T;
    }

    public verifyTokenTimerSet<T extends object>(token: string): T {
        return jwt.verify(token, this.secrets.jwtTimeSetSecret) as T;
    }

    public decodeToken<T extends object>(token: string): T | null {
        return jwt.decode(token) as T | null;
    }

    public async revokeToken(token: string): Promise<void> {
        console.warn(`Revogação de token não implementada para: ${token}`);
        return Promise.resolve();
    }
}