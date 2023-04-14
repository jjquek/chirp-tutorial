// This code runs on the server, but we can still access it in the same code base.
import { clerkClient } from "@clerk/nextjs/server";
import { type Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

// general helper functions for router routines.
export const addUserDataToPosts = async (posts: Post[]) => {
  // one of the neat things about clerk is the API for a client object.
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);
    // need to handle the case where there's an author but they only have an external username (i.e., authed with something other than GitHub)
    if (!author) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
      });
    }
    if (!author.username) {
      //check if we can use an external username
      if (!author.externalUsername) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Author has no external username: ${author.id}`,
        });
      }
      author.username = author.externalUsername;
    }
    // console.log(author.username) <= funny bug: registers that username cannot be null but
    // still need to create the username property afresh below
    return {
      post,
      //NOTE:  can't just return 'author' because TS doesn't register that 'username' cannot be null despite the type guarding above.
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

export const postsRouter = createTRPCRouter({
  //  a public procedure can be run by anyone regardless of their auth state.
  //  we're fine w non-authenticated users doing this
  getById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.userId },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return (await addUserDataToPosts([post]))[0];
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });
    return addUserDataToPosts(posts);
  }),

  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(({ ctx, input }) =>
      // note : no async needed on implicit return
      ctx.prisma.post
        .findMany({
          where: {
            authorId: input.userId,
          },
          take: 100,
          orderBy: [{ createdAt: "desc" }],
        })
        .then(addUserDataToPosts)
    ),

  create: privateProcedure
    .input(z.object({ content: z.string().emoji().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      // TODO : implement rate-limiting via upstash and redis (see upstash's documentation for instructions.)

      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });
      return post;
    }),
});
