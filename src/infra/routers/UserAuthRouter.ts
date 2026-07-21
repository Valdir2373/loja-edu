import { UserOutput } from "../../app/users/dto/UserOutput";
import { ForbiddenError } from "../../domain/errors/ForbiddenError";
import { OnboardingPendingError } from "../../domain/errors/OnboardingPendingError";
import { UnauthorizedError } from "../../domain/errors/UnauthorizedError";
import { OAuthProviderPort } from "../../domain/security/OAuthProviderPort";
import { UserAuthController } from "../controller/UserAuthController";
import { ConfigDomain } from "../config/ConfigDomain";
import { HttpErrorMapper } from "../shared/errors/HttpErrorMapper";
import { IRequest, IResponse, ServerPort, middleWare } from "../server/ServerPort";
import { createIdAdapter } from "../utils/createId";

export interface SessionInjection {
    authenticatedUser: UserOutput;
    sessionToken: string;
}

const OAUTH_STATE_COOKIE = "oauthState";
const OAUTH_REDIRECT_URI_COOKIE = "oauthRedirectUri";
const SESSION_COOKIE = "tokenUser";
const HARNESS_ROUTE_PREFIX = "/app";
const GOOGLE_CALLBACK_PATH = "/auth/google/callback";

export class UserAuthRouter {
    constructor(
        private server: ServerPort,
        private controller: UserAuthController,
        private oauthProvider: OAuthProviderPort
    ) {
        this.boot();
    }

    private boot() {
        this.server.addRouter("get", "/auth/google", this.redirectToGoogle);
        this.server.addRouter("get", "/auth/google/callback", this.handleGoogleCallback);
        this.server.addRouter("post", "/auth/logout", this.requireSession, this.logout);
    }

    private setSessionCookie(res: IResponse, token: string) {
        res.cookie(SESSION_COOKIE, token, {
            httpOnly: true,
            secure: ConfigDomain.secure,
            sameSite: "lax",
            maxAge: 3600000,
        });
    }

    private buildRedirectUri(req: IRequest): string {
        return `${req.protocol}://${req.headers.host}${GOOGLE_CALLBACK_PATH}`;
    }

    private redirectToGoogle: middleWare = async (req, res) => {
        const state = createIdAdapter();
        const redirectUri = this.buildRedirectUri(req);
        res.cookie(OAUTH_STATE_COOKIE, state, {
            httpOnly: true,
            secure: ConfigDomain.secure,
            sameSite: "lax",
            maxAge: 5 * 60 * 1000,
        });
        res.cookie(OAUTH_REDIRECT_URI_COOKIE, redirectUri, {
            httpOnly: true,
            secure: ConfigDomain.secure,
            sameSite: "lax",
            maxAge: 5 * 60 * 1000,
        });
        return res.status(302).json({ url: this.oauthProvider.buildAuthorizationUrl(state, redirectUri) });
    };

    private handleGoogleCallback: middleWare = async (req, res) => {
        try {
            const { code, state } = req.query as { code?: string; state?: string };
            const redirectUri = req.cookies[OAUTH_REDIRECT_URI_COOKIE];
            if (!code || !state || state !== req.cookies[OAUTH_STATE_COOKIE] || !redirectUri) {
                throw new UnauthorizedError("Autenticação com o Google inválida.");
            }
            const result = await this.controller.authenticateWithGoogleCode(code, redirectUri);
            res.clearCookie(OAUTH_STATE_COOKIE);
            res.clearCookie(OAUTH_REDIRECT_URI_COOKIE);
            this.setSessionCookie(res, result.token);
            return res.redirect(`${HARNESS_ROUTE_PREFIX}/?onboardingPending=${result.onboardingPending}`);
        } catch (error) {
            const { status, body } = HttpErrorMapper.toHttp(error);
            return res.status(status).json(body);
        }
    };

    public requireSession: middleWare = async (req, res, next) => {
        try {
            const token = req.cookies[SESSION_COOKIE];
            const authenticatedUser = await this.controller.resolveAuthenticatedUser(token);
            (req as IRequest<any, any, any, SessionInjection>).authenticatedUser = authenticatedUser;
            (req as IRequest<any, any, any, SessionInjection>).sessionToken = token;
            next();
        } catch (error) {
            const { status, body } = HttpErrorMapper.toHttp(error);
            res.status(status).json(body);
        }
    };

    public requireAdmin: middleWare = async (req, res, next) => {
        try {
            const { authenticatedUser } = req as IRequest<any, any, any, SessionInjection>;
            if (!authenticatedUser.isAdmin) {
                throw new ForbiddenError("Ação permitida apenas para administradores.");
            }
            next();
        } catch (error) {
            const { status, body } = HttpErrorMapper.toHttp(error);
            res.status(status).json(body);
        }
    };

    public requireCompletedOnboarding: middleWare = async (req, res, next) => {
        try {
            const { authenticatedUser } = req as IRequest<any, any, any, SessionInjection>;
            if (!authenticatedUser.onboardingCompleted) {
                throw new OnboardingPendingError();
            }
            next();
        } catch (error) {
            const { status, body } = HttpErrorMapper.toHttp(error);
            res.status(status).json(body);
        }
    };

    private logout: middleWare = async (req, res) => {
        try {
            const { sessionToken } = req as IRequest<any, any, any, SessionInjection>;
            await this.controller.logout(sessionToken);
            res.clearCookie(SESSION_COOKIE);
            return res.status(200).json({ message: "Sessão encerrada com sucesso." });
        } catch (error) {
            const { status, body } = HttpErrorMapper.toHttp(error);
            return res.status(status).json(body);
        }
    };
}
