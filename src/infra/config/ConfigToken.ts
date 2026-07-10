import { ConfigEnv } from "./ConfigEnv";

export interface ITokenSecrets {
    jwtSecret: string;
    jwtRefreshSecret: string;
    jwtTimeSetSecret: string;
    accessTokenExpiresIn: string | number;
    refreshTokenExpiresIn: string | number;
}

export class ConfigToken {
    constructor(private config:ConfigEnv){
    }
    getToken(): ITokenSecrets {
        return {
            jwtSecret: this.config.getVariable("JWT_SECRET"),
            jwtRefreshSecret: this.config.getVariable("JWT_REFRESH_SECRET"),
            jwtTimeSetSecret: this.config.getVariable("JWT_TIME_SET_SECRET"),
            accessTokenExpiresIn: this.config.getVariable("JWT_ACCESS_EXPIRES") || "15m",
            refreshTokenExpiresIn: this.config.getVariable("JWT_REFRESH_EXPIRES") || "7d",
        }
    }
}