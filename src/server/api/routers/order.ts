import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const orderRouter = createTRPCRouter({
  // Place a new order
  place: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({ dishId: z.number(), quantity: z.number().min(1) })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch dishes to calculate total
      const dishes = await ctx.db.dish.findMany({
        where: { id: { in: input.items.map((i) => i.dishId) } },
      });

      const total = input.items.reduce((sum, item) => {
        const dish = dishes.find((d) => d.id === item.dishId);
        return sum + (dish?.price ?? 0) * item.quantity;
      }, 0);

      const order = await ctx.db.order.create({
        data: {
          total,
          status: "CONFIRMED",
          items: {
            create: input.items.map((item) => ({
              dishId: item.dishId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: { include: { dish: true } },
        },
      });

      return order;
    }),

  // Get order status
  getStatus: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: { include: { dish: true } },
        },
      });
    }),

  // Advance order status (simulate delivery progression)
  advance: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
      });
      if (!order) throw new Error("Order not found");

      const flow = ["CONFIRMED", "PREPARING", "READY", "ON_WAY", "DELIVERED"];
      const nextStatus =
        flow[flow.indexOf(order.status) + 1] ?? "DELIVERED";

      return ctx.db.order.update({
        where: { id: input.orderId },
        data: { status: nextStatus },
      });
    }),
});
