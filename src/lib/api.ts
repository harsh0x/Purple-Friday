import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import logger from "./logger";
import { checkRateLimit, getClientKey } from "./rate-limit";

export interface ApiHandlerOptions<TBody = unknown, TQuery = unknown> {
  bodySchema?: ZodSchema<TBody>;
  querySchema?: ZodSchema<TQuery>;
  rateLimit?: {
    limit: number;
    windowMs: number;
  };
  requireJson?: boolean;
}

export type ApiContext<TBody = unknown, TQuery = unknown> = {
  body: TBody;
  query: TQuery;
  requestId: string;
  req: Request;
};

/**
 * Standardized API Route Handler Wrapper
 */
export function createApiHandler<TBody = unknown, TQuery = unknown>(
  options: ApiHandlerOptions<TBody, TQuery>,
  handler: (ctx: ApiContext<TBody, TQuery>) => Promise<NextResponse | Response>
) {
  return async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const route = new URL(req.url).pathname;
    const method = req.method.toUpperCase();

    try {
      // 1. Origin Header Validation on mutating routes
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const origin = req.headers.get("origin");
        const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        if (origin) {
          try {
            const originHost = new URL(origin).host;
            const siteHost = new URL(configuredSiteUrl).host;

            if (originHost !== siteHost && !originHost.includes("localhost")) {
              logger.warn({ requestId, origin, siteHost }, "Origin validation rejected");
              return NextResponse.json(
                { success: false, error: "Cross-origin request forbidden", requestId },
                { status: 403 }
              );
            }
          } catch {
            // Ignore malformed URL parse errors
          }
        }
      }

      // 2. Content-Type Check on Mutating routes with body
      if (
        options.requireJson !== false &&
        ["POST", "PUT", "PATCH"].includes(method)
      ) {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          return NextResponse.json(
            { success: false, error: "Content-Type must be application/json", requestId },
            { status: 415 }
          );
        }
      }

      // 3. Rate Limiting Check
      const rateLimitConfig = options.rateLimit ?? { limit: 60, windowMs: 60000 };
      const clientKey = getClientKey(req, route);
      const rateLimitResult = await checkRateLimit(
        clientKey,
        rateLimitConfig.limit,
        rateLimitConfig.windowMs
      );

      if (!rateLimitResult.success) {
        logger.warn({ requestId, clientKey, route }, "Rate limit exceeded");
        return NextResponse.json(
          {
            success: false,
            error: "Too many requests. Please try again later.",
            requestId,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
            },
          }
        );
      }

      // 4. Query Parsing & Validation
      let parsedQuery = {} as TQuery;
      if (options.querySchema) {
        const url = new URL(req.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        parsedQuery = options.querySchema.parse(queryParams);
      }

      // 5. Body Parsing & Validation
      let parsedBody = {} as TBody;
      if (options.bodySchema && ["POST", "PUT", "PATCH"].includes(method)) {
        try {
          const rawBody = await req.json();
          parsedBody = options.bodySchema.parse(rawBody);
        } catch (err) {
          if (err instanceof ZodError) {
            return NextResponse.json(
              {
                success: false,
                error: "Invalid request payload",
                details: err.flatten().fieldErrors,
                requestId,
              },
              { status: 422 }
            );
          }
          return NextResponse.json(
            { success: false, error: "Invalid JSON body", requestId },
            { status: 400 }
          );
        }
      }

      // 6. Execute Handler
      const response = await handler({
        body: parsedBody,
        query: parsedQuery,
        requestId,
        req,
      });

      // Inject Request ID header into response
      response.headers.set("X-Request-Id", requestId);
      return response;
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: err.flatten().fieldErrors,
            requestId,
          },
          { status: 422 }
        );
      }

      logger.error({ requestId, route, err }, "Unhandled API server exception");

      return NextResponse.json(
        {
          success: false,
          error: "An unexpected error occurred. Please contact support with this request ID.",
          requestId,
        },
        { status: 500 }
      );
    }
  };
}

