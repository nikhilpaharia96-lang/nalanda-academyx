import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? (exception as HttpException).getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? (exception as HttpException).getResponse() : null;

    // Fail CLOSED by default: only the explicit value "development" relaxes
    // redaction. Any other value (including an accidentally-unset NODE_ENV)
    // is treated as production-safe, so a missing environment variable can
    // never cause internal error details to leak to a client.
    const isDev = process.env.NODE_ENV === "development";

    const message = isHttp
      ? (typeof body === "string" ? body : (body as any)?.message) ?? "Error"
      : isDev
        ? (exception as Error)?.message || "Internal server error"
        : "Internal server error";

    // Zod validation errors (ZodValidationPipe) attach a structured `issues`
    // array to the exception body — field name + human-readable message,
    // nothing sensitive. Passing it through lets forms highlight the exact
    // field that failed instead of just showing "Validation failed". This
    // is intentionally NOT gated behind isDev: these are user input errors,
    // not internal/server details, so redacting them in production would
    // break form validation UX for every user without any security benefit.
    const issues = isHttp && body && typeof body === "object" ? (body as any).issues : undefined;

    // Unexpected (non-HttpException) errors are always logged server-side —
    // regardless of environment — since silence would make production
    // incidents undiagnosable. Only the response sent to the client is
    // redacted based on environment.
    if (!isHttp) {
      // eslint-disable-next-line no-console
      console.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(issues ? { issues } : {}),
      timestamp: new Date().toISOString(),
    });
  }
}
