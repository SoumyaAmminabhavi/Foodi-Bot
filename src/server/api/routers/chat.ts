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

      if (matchesIntent(txt, [/^\s*(hello|hi+)\b/i, /^\s*(hey|namaste|hola)\b/i])) {
        intent = "greeting";
        replyText =
          "Hey there! 👋 I'm BiteBot — your AI food companion. I can recommend dishes, help you order, and track delivery. What are you craving today?";
      } else if (matchesIntent(txt, [/(special|featured|trending|today's)\s+(dish|food|menu|item|recommend)/i])) {
        intent = "popular";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "popular" }, available: true },
          take: 4,
        });
        replyText = "🔥 Here are today's **fan favourites**:";
      } else if (matchesIntent(txt, [/(spicy|hot)\s+(dish|food|menu|item|curry)/i])) {
        intent = "spicy";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "spicy" }, available: true },
        });
        replyText = "🌶️ Feeling the heat? Here are our **spiciest dishes**:";
      } else if (matchesIntent(txt, [/(veg|vegetarian|vegan|plant-based)\s+(dish|food|menu|item|option)/i])) {
        intent = "veg";
        dishes = await ctx.db.dish.findMany({
          where: {
            tags: { contains: "veg" },
            NOT: { tags: { contains: "sweet" } },
            available: true,
          },
        });
        replyText = "🥦 Great choice! Here are our **vegetarian options**:";
      } else if (matchesIntent(txt, [/(dessert|sweet|ice cream|kulfi|gulab jamun)\b/i, /something sweet/i])) {
        intent = "dessert";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "sweet" }, available: true },
        });
        replyText = "🍮 Save room for something sweet!";
      } else if (matchesIntent(txt, [/\b(drink|beverage|chai|lassi|juice|soda)\b/i])) {
        intent = "drinks";
        dishes = await ctx.db.dish.findMany({
          where: { category: { name: "Drinks" }, available: true },
        });
        replyText = "🥤 Quench your thirst with these:";
      } else if (matchesIntent(txt, [/(surprise me|random dish|suggest something|don't know what to order)/i])) {
        intent = "surprise";
        const all = await ctx.db.dish.findMany({ where: { available: true } });
        const pick = all[Math.floor(Math.random() * all.length)];
        if (pick) {
          dishes = [pick];
          replyText = `🎲 Feeling adventurous? I'd suggest the **${pick.name}** — ${pick.description}. Absolutely worth it!`;
        }
      } else if (matchesIntent(txt, [/(bestseller|best seller|best dish|top dish|most ordered)/i])) {
        intent = "bestseller";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "bestseller" }, available: true },
        });
        replyText = "⭐ Our **bestsellers** — loved by thousands:";
      } else if (matchesIntent(txt, [/(seafood|prawn|fish)\s+(dish|food|item|curry)/i])) {
        intent = "seafood";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "seafood" }, available: true },
        });
        replyText = "🦐 Fresh from the coast:";
      } else if (matchesIntent(txt, [/what.*order|can.*order|place.*order/i])) {
        intent = "menu";
        dishes = await ctx.db.dish.findMany({
          where: { tags: { contains: "popular" }, available: true },
          take: 4,
        });
        replyText = "🍽️ Here are some dishes you can order right now:";
      } else if (matchesIntent(txt, [/track.*order|order.*status|where.*my.*order|status.*order/i])) {
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
      } else if (matchesIntent(txt, [/(cheap|budget|affordable)\s+(dish|food|option)/i, /under\s*200/i])) {
        intent = "budget";
        dishes = await ctx.db.dish.findMany({
          where: { price: { lt: 20000 }, available: true },
        });
        replyText = "💰 Great value picks:";
      } else if (matchesIntent(txt, [/(show|what's on the|full)\s+(menu|list|dishes)/i])) {
        intent = "menu";
        replyText =
          "📋 Check out the **full menu** in the sidebar on the left — or just tell me what you're in the mood for and I'll pick for you!";
      } else if (matchesIntent(txt, [/\bbiryani\b/i])) {
        intent = "biryani";
        dishes = await ctx.db.dish.findMany({
          where: { name: { contains: "Biryani" }, available: true },
        });
        replyText =
          "👑 Our **Chicken Biryani** is legendary — slow dum-cooked with whole spices & saffron. A must-try!";
      } else if (matchesIntent(txt, [/^\s*(thank|thanks|bye|goodbye|great|awesome|perfect)\b/i])) {
        intent = "farewell";
        replyText =
          "😊 Anytime! Enjoy your meal — we'll get it to you piping hot. Bon appétit! 🍽️";
      } else {
        intent = "fallback";

        if (groq) {
          try {
            const allDishes = await ctx.db.dish.findMany({ where: { available: true } });
            const menuContext = allDishes
              .map((d) => `- ${d.name} (₹${d.price / 100}): ${d.description}`)
              .join("\n");

            const response = await groq.chat.completions.create({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content: `You are BiteBot, a highly knowledgeable food expert and menu ordering assistant. 
You MUST enthusiastically and accurately answer ANY question about food, cooking, diets, nutrition, or recipes (e.g., explaining what "gluten-free" means). 
However, if the user asks about ANYTHING NOT RELATED TO FOOD (e.g., science, math, coding, politics, general knowledge), you MUST politely REFUSE to answer and state that you only talk about food.
When a user asks about what to eat or order, ALWAYS recommend dishes from our actual menu below by exact name:
--- MENU ---
${menuContext}
--- END MENU ---
Keep your answers friendly, informative, and concise (max 3-4 sentences).`,
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
              "💬 I can answer any question about food! What would you like to order?";

            const mentionedDishes = allDishes.filter((d) =>
              replyText.toLowerCase().includes(d.name.toLowerCase())
            );

            if (mentionedDishes.length > 0) {
              dishes = mentionedDishes.slice(0, 3);
            } else {
              // The AI answered a general food question but didn't recommend a dish from the menu.
              // So, don't show any random dishes to avoid confusion.
              dishes = [];
            }
          } catch (e) {
            replyText =
              "💬 Got it! I’m having trouble connecting to my brain right now, but I can help with ordering and tracking! Here are some favourites to get you started:";
            dishes = await ctx.db.dish.findMany({
              where: { tags: { contains: "popular" }, available: true },
              take: 3,
            });
          }
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
