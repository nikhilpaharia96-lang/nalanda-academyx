import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", ".env") });
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import express from "express";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";

/** Parses a comma-separated list of origins from ALLOWED_ORIGINS, falling
 * back to the single-origin WEB_URL var, and finally to the two local-dev
 * frontends this monorepo runs (public site :3000, portal app :3002) so
 * local development keeps working with zero required configuration. */
function resolveAllowedOrigins(): string[] {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
  }
  if (process.env.WEB_URL) return [process.env.WEB_URL];
  return ["http://localhost:3000", "http://localhost:3002"];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  // Behind a reverse proxy / load balancer (nginx, Vercel, Render, Cloudflare)
  // in production, req.ip resolves to the proxy's address unless Express is
  // told to trust the X-Forwarded-For header. TRUST_PROXY=1 (or a specific
  // hop count / CIDR per Express's docs) must be set in that environment for
  // per-IP rate limiting and audit-log IP addresses to reflect real clients.
  if (process.env.TRUST_PROXY) {
    const value = process.env.TRUST_PROXY;
    const numeric = Number(value);
    app.set("trust proxy", Number.isFinite(numeric) && value.trim() !== "" ? numeric : value);
  }

  app.use(cookieParser());
  // Capture the raw request body so the Razorpay webhook handler can verify
  // its HMAC signature over the exact bytes Razorpay signed — verifying a
  // re-serialized JSON object would silently break on any whitespace/key-
  // order difference.
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  const allowedOrigins = resolveAllowedOrigins();
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix("api");
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nalanda Academy Cloud API listening on :${port}`);
  // eslint-disable-next-line no-console
  console.log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);
}

bootstrap();
