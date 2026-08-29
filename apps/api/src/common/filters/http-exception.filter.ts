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
      timestamp: new Date().toISOString(),
    });
  }
}
