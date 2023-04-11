// This code runs on the server, but we can still access it in the same code base.
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postsRouter = createTRPCRouter({
  //  a public procedure can be run by anyone regardless of their auth state.
  //  we're fine w non-authenticated users doing this
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany();
  }),
});
