import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { loginSchema, changePasswordSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const REFRESH_COOKIE = "refresh_token";
// Fail CLOSED: cookies are only sent without the Secure flag when NODE_ENV
// is explicitly "development". Any other value (including an accidentally
// unset NODE_ENV in a misconfigured production deploy) defaults to secure.
const isSecureCookie = process.env.NODE_ENV !== "development";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  // Overrides the global 120/min limit: login is a brute-force/credential-
  // stuffing target, so it gets a much stricter per-IP limit.
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(@Body(new ZodValidationPipe(loginSchema)) dto: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    return { accessToken: result.accessToken, user: result.user };
  }

  @Post("refresh")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw new UnauthorizedException("Missing refresh token");

    const result = await this.authService.refresh(refreshToken);

    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    return { accessToken: result.accessToken };
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) await this.authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: any,
  ) {
    await this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return { id: user.sub, email: user.email, role: user.role, profileId: user.profileId };
  }
}
