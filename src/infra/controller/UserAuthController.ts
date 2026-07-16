import { UserLoginInput } from "../../app/users/dto/UserLoginInput";
import { GetUser } from "../../app/users/useCase/GetUser";
import { LoginUser } from "../../app/users/useCase/LoginUser";
import { VerifyEmail } from "../../app/users/useCase/VerifyEmail";
import { ServiceAuthToken } from "../security/ServiceAuthToken";

export class UserAuthController {
    constructor(
        private loginUser: LoginUser,
        private verifyEmailUseCase:VerifyEmail,
        private getUser: GetUser,
        private serviceToken: ServiceAuthToken,
    ) {}

    async login(input: UserLoginInput) {
        const userOutput = await this.loginUser.execute(input);
        const accessToken = this.serviceToken.generateToken({ id: userOutput.id });
        const refreshToken = this.serviceToken.generateRefreshToken({ id: userOutput.id });
        return {
            accessToken,
            refreshToken
        };
    }
    async getById(id: string) {
        return await this.getUser.execute(id);
    }

    async verifyEmail(token: string) {
        const payload = await this.serviceToken.verifyTimeSetToken<{ email: string }>(token);
        await this.verifyEmailUseCase.execute(payload.email);
        await this.serviceToken.revoke(token);
        return { message: "E-mail verificado com sucesso" };
    }
}