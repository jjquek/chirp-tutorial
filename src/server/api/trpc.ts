/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * NOTE : Editing this file to embed the auth state into `ctx` so we can determine if a user is logged in and who they are.
 *  NOTE: We wouldn't have to do this if we just set up with NextAuth. But, since we're using Clerk, we're doing things this way.
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *  NOTE: we are also creating a software layer before our main back-end process (i.e., middleware) to enforce that a user is authenticated before any posting is allowed. See `enforceUserIsAuthed` for details.
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";

import { prisma } from "~/server/db";

// type CreateContextOptions = Record<string, never>;

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
// NOTE: Removing/Commenting Out this helper function as it's mainly isolated for testing purposes-- which we aren't doing in the tutorial.
// const createInnerTRPCContext = (_opts: CreateContextOptions) => {
//   return {
//     prisma,
//   };
// };

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
// NOTE: removed the _ prefix in `opts` parameter to show that we're intending to use it.
export const createTRPCContext = (opts: CreateNextContextOptions) => {
  const { req } = opts;
  const sesh = getAuth(req);
  // getAuth is a clerk API that can receive the Next.js req object and returns to us an object that tells us about the user logged in/if the user is not logged in.
  const userId = sesh.userId;
  return {
    prisma,
    userId,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getAuth } from "@clerk/nextjs/server";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

export const privateProcedure = t.procedure.use(enforceUserIsAuthed);
