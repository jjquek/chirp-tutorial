// This code runs on the server, but we can still access it in the same code base.
import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  // filtering the User object that gets returned by clerkClient
  return {
    id: user.id,
    username: user.username,
    profilePic: user.profileImageUrl,
  };
};
export const postsRouter = createTRPCRouter({
  //  a public procedure can be run by anyone regardless of their auth state.
  //  we're fine w non-authenticated users doing this
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });
    // one of the neat things about clerk is the API for a client object.
    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);
      if (!author || !author.username)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author not found for post.",
        });
      // console.log(author.username) <= funny bug: registers that username cannot be null but
      // still need to create the username
      return {
        post,
        //NOTE:  can't just return 'author' because TS doesn't register that 'username' cannot be null despite the type guarding above.
        author: {
          ...author,
          username: author.username,
        },
      };
    });
  }),
});
