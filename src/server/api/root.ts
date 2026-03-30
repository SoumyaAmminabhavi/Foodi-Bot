import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { menuRouter } from "~/server/api/routers/menu";
import { orderRouter } from "~/server/api/routers/order";
import { chatRouter } from "~/server/api/routers/chat";

export const appRouter = createTRPCRouter({
  menu: menuRouter,
  order: orderRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
