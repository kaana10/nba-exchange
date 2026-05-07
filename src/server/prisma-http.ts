import { Prisma } from "@prisma/client";

/**
 * Maps Prisma errors to stable HTTP responses for auth routes.
 */
export function mapPrismaToAuthError(e: unknown): { status: number; error: string } | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return { status: 409, error: "Email already in use" };
    }
    if (e.code === "P2021") {
      return {
        status: 500,
        error:
          "Database not migrated (missing tables). Ensure build runs `prisma migrate deploy` (see vercel.json).",
      };
    }
    if (e.code === "P1001" || e.code === "P1000" || e.code === "P1017") {
      return {
        status: 503,
        error:
          "Cannot reach database from Vercel. Fix DATABASE_URL: must be a public Postgres URL (not localhost), include SSL if your host requires it (e.g. ?sslmode=require), use Neon/Supabase pooled URL for the app. Wake the DB if it auto-paused. Migrations use DIRECT_URL separately.",
      };
    }
    return { status: 500, error: `Database error (${e.code})` };
  }

  if (e instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      error: "Database failed to initialize (invalid DATABASE_URL or network unreachable).",
    };
  }

  return null;
}
