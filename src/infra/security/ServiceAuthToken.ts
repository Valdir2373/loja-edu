import { CachePort } from "../../domain/database/CachePort";
import { DependencyInjection } from "../pattern/DI";
import { AuthTokenManager } from "./AuthTokenManager";
import { TokenGenerationOptions } from "./IAuthTokenManager";

export class ServiceAuthToken {
    private cache: CachePort;
    private tokenManager: AuthTokenManager;

    constructor(private di: DependencyInjection) {
        this.cache = this.di.getDependency<CachePort>(CachePort);
        this.tokenManager = this.di.getDependency<AuthTokenManager>(AuthTokenManager);
    }

    
    generateToken(payload: object, options?: TokenGenerationOptions): string {
        return this.tokenManager.generateToken(payload, options);
    }

    generateRefreshToken(payload: object, options?: TokenGenerationOptions): string {
        return this.tokenManager.generateRefreshToken(payload, options);
    }

    generateTimeSetToken(payload: object, expiresIn: string | number): string {
        return this.tokenManager.generateTimeSetToken(payload, expiresIn);
    }


    async verifySessionToken<T extends object>(token: string): Promise<T> {
        const decoded = await this.tokenManager.verifyToken<T>(token);
        await this.ensureNotRevoked(token);
        return decoded;
    }

    async verifyRefreshToken<T extends object>(token: string): Promise<T> {
        const decoded = await this.tokenManager.verifyRefreshToken<T>(token);
        await this.ensureNotRevoked(token);
        return decoded;
    }

    async verifyTimeSetToken<T extends object>(token: string): Promise<T> {
        const decoded = await this.tokenManager.verifyTimeSetToken<T>(token);
        await this.ensureNotRevoked(token);
        return decoded;
    }


    async revoke(token: string, ttl: number = 3600): Promise<void> {
        await this.cache.set(`blacklist:${token}`, 'revoked', ttl);
    }

    private async ensureNotRevoked(token: string): Promise<void> {
        const isRevoked = await this.cache.get(`blacklist:${token}`);
        if (isRevoked) {
            throw new Error("Token revogado.");
        }
    }

    decode<T extends object>(token: string): T | null {
        return this.tokenManager.decodeToken<T>(token);
    }
}