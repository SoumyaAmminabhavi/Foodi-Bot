import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const menuRouter = createTRPCRouter({
  // Get full menu grouped by category
  getAll: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      include: {
        dishes: {
          where: { available: true },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });
    return categories;
  }),

  // Get dishes by tag filter
  getByTag: publicProcedure
    .input(z.object({ tag: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.dish.findMany({
        where: {
          available: true,
          tags: { contains: input.tag },
        },
        include: { category: true },
      });
    }),

  // Get single dish
  getDish: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.dish.findUnique({
        where: { id: input.id },
        include: { category: true },
      });
    }),
});
// wassup