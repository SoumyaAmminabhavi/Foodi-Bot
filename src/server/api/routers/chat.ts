import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Intent detection helpers
const matchesIntent = (text: string, patterns: RegExp[]) =>
  patterns.some((p) => p.test(text));

export const chatRouter = createTRPCRouter({
  // Persist and process a chat message — returns bot reply
  send: publicProcedure
    .input(z.object({ message: z.string().min(1).max(500), userId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Save user message
      await ctx.db.chatMessage.create({
        data: { role: "user", content: input.message, userId: input.userId ?? null },
      });

      const txt = input.message.toLowerCase();

      // 2. Determine intent → fetch relevant dishes
      let replyText = "";
      let dishes: { id: number; name: string; emoji: string; price: number; description: string }[] = [];
      let intent: string = "general";

      if (matchesIntent(txt, [/hello|hi+\b|hey|namaste|hola/])) {
        intent = "greeting";
        replyText =
          "Hey there! 👋 I'm BiteBot — your AI food companion. I can recommend dishes, help you order, and track delivery. What are you craving today?";
      } else if (matchesIntent(txt, [/special|today|featured|trending/])) {
        intent = "popular";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "popular" }, available: true },
          take: 4,
        });
        replyText = "🔥 Here are today's **fan favourites**:";
      } else if (matchesIntent(txt, [/spicy|spice|\bhot\b/])) {
        intent = "spicy";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "spicy" }, available: true },
        });
        replyText = "🌶️ Feeling the heat? Here are our **spiciest dishes**:";
      } else if (matchesIntent(txt, [/veg|vegetarian|no meat|plant.based/])) {
        intent = "veg";
        dishes = await ctx.db.dish.findMany({
          where: {
            tags: { contains: "veg" },
            NOT: { tags: { contains: "sweet" } },
            available: true,
          },
        });
        replyText = "🥦 Great choice! Here are our **vegetarian options**:";
      } else if (matchesIntent(txt, [/dessert|sweet|sugar|ice cream|kulfi|gulab/])) {
        intent = "dessert";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "sweet" }, available: true },
        });
        replyText = "🍮 Save room for something sweet!";
      } else if (matchesIntent(txt, [/drink|beverage|chai|lassi|juice/])) {
        intent = "drinks";
        dishes = await ctx.db.dish.findMany({
          where: { category: { name: "Drinks" }, available: true },
        });
        replyText = "🥤 Quench your thirst with these:";
      } else if (matchesIntent(txt, [/surprise|random|anything|idk|don.t know/])) {
        intent = "surprise";
        const all = await ctx.db.dish.findMany({ where: { available: true } });
        const pick = all[Math.floor(Math.random() * all.length)];
        if (pick) {
          dishes = [pick];
          replyText = `🎲 Feeling adventurous? I'd suggest the **${pick.name}** — ${pick.description}. Absolutely worth it!`;
        }
      } else if (matchesIntent(txt, [/bestseller|best seller|best dish|top dish|most ordered/])) {
        intent = "bestseller";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "bestseller" }, available: true },
        });
        replyText = "⭐ Our **bestsellers** — loved by thousands:";
      } else if (matchesIntent(txt, [/seafood|prawn|fish/])) {
        intent = "seafood";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "seafood" }, available: true },
        });
        replyText = "🦐 Fresh from the coast:";
      } else if (matchesIntent(txt, [/what.*order|can.*order|place.*order/])) {
        intent = "menu";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "popular" }, available: true },
          take: 4,
        });
        replyText = "🍽️ Here are some dishes you can order right now:";
      } else if (matchesIntent(txt, [/track.*order|order.*status|where.*my.*order|status.*order/])) {
        intent = "track";

        const orderIdMatch = txt.match(/order\s*#?(\d+)/i) || txt.match(/#(\d+)/);
        const orderId = orderIdMatch ? Number(orderIdMatch[1]) : undefined;
        const order = orderId
          ? await ctx.db.order.findUnique({ where: { id: orderId } })
          : await ctx.db.order.findFirst({ orderBy: { createdAt: "desc" } });

        if (!order) {
          replyText =
            "I couldn't find that order. Please place an order first or specify a valid order number like 'Track order #7'.";
        } else {
          replyText = `🚚 Order #${order.id} is currently **${order.status}**. Open your cart panel to watch live progress (or type 'Track order #${order.id}' to refresh).`;
        }
      } else if (matchesIntent(txt, [/cheap|budget|affordable|under.?200/])) {
        intent = "budget";
        dishes = await ctx.db.dish.findMany({
          where: { price: { lt: 20000 }, available: true },
        });
        replyText = "💰 Great value picks:";
      } else if (matchesIntent(txt, [/menu|list|all dishes|show.?menu/])) {
        intent = "menu";
        replyText =
          "📋 Check out the **full menu** in the sidebar on the left — or just tell me what you're in the mood for and I'll pick for you!";
      } else if (matchesIntent(txt, [/biryani/])) {
        intent = "biryani";
        dishes = await ctx.db.dish.findMany({
          where: { name: { contains: "Biryani" }, available: true },
        });
        replyText =
          "👑 Our **Chicken Biryani** is legendary — slow dum-cooked with whole spices & saffron. A must-try!";
      } else if (matchesIntent(txt, [/\b(thank|thanks|bye|goodbye|great|awesome|perfect)\b/])) {
        intent = "farewell";
        replyText =
          "😊 Anytime! Enjoy your meal — we'll get it to you piping hot. Bon appétit! 🍽️";
      } else {
        intent = "fallback";

        if (groq) {
          try {
            const response = await groq.chat.completions.create({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content: "You are BiteBot, a highly knowledgeable food expert and ordering assistant. You MUST enthusiastically answer any question about food (e.g., gluten-free diets, ingredients, recipes, or nutrition) in a friendly, conversational tone (max 3 sentences). Always tie the conversation back to offering our food delivery menu options.",
                },
                {
                  role: "user",
                  content: input.message,
                },
              ],
              max_tokens: 256,
            });
            replyText =
              response.choices[0]?.message?.content ||
              "💬 I can answer any question about food! What would you like to know?";
          } catch (e) {
            replyText =
              "💬 Got it! I’m having trouble connecting to my brain right now, but I can help with ordering and tracking! Here are some favourites to get you started:";
          }

          dishes = await ctx.db.dish.findMany({
            where: { tags: { contains: "popular" }, available: true },
            take: 3,
          });
        } else {
          dishes = await ctx.db.dish.findMany({
            where: { tags: { contains: "popular" }, available: true },
            take: 3,
          });
          replyText =
            "🤔 I can answer questions about the menu, ordering, or tracking your order. (Configure GROQ_API_KEY for advanced food chat!)";
        }
      }

      // 3. Save bot reply
      await ctx.db.chatMessage.create({
        data: { role: "bot", content: replyText, userId: input.userId ?? null },
      });

      return { replyText, dishes, intent };
    }),

  // Get chat history
  getHistory: publicProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.chatMessage.findMany({
        where: input.userId ? { userId: input.userId } : {},
        orderBy: { createdAt: "asc" },
        take: 200,
      });
    }),

  clearHistory: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.db.chatMessage.deleteMany();
    return { success: true };
  }),

  // Get all users
  getAllUsers: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),
});
