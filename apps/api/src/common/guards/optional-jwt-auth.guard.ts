import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TokenService } from "../token.service";

/**
 * Unlike JwtAuthGuard, this NEVER blocks the request. It's for routes that
 * must remain publicly accessible (read-only content the public website
 * consumes) but still want to show admins extra data (e.g. unpublished
 * items) when a valid admin session is present. Anonymous requests and
 * requests with an invalid/expired token simply proceed with
 * `request.user` left undefined — callers must not assume `user` exists.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const token = bearer || request.cookies?.access_token;

    if (token) {
      try {
        request.user = this.tokenService.verifyAccessToken(token);
      } catch {
        // Invalid/expired token on an optional-auth route: proceed as
        // anonymous rather than rejecting the request.
      }
    }
    return true;
  }
}
