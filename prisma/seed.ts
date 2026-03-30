import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Clear existing data
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.chatMessage.deleteMany();
  await db.dish.deleteMany();
  await db.category.deleteMany();

  const categories = [
    {
      name: "Starters",
      emoji: "🍱",
      dishes: [
        { name: "Paneer Tikka", description: "Smoky cottage cheese skewers", price: 22000, emoji: "🥙", tags: "veg,spicy,popular" },
        { name: "Chicken Seekh Kebab", description: "Minced chicken, spiced & grilled", price: 28000, emoji: "🍢", tags: "non-veg,spicy" },
        { name: "Caesar Salad", description: "Romaine, parmesan, house dressing", price: 18000, emoji: "🥗", tags: "veg,healthy" },
      ],
    },
    {
      name: "Mains",
      emoji: "🍛",
      dishes: [
        { name: "Butter Chicken", description: "Creamy tomato-based curry", price: 34000, emoji: "🍛", tags: "non-veg,popular,bestseller" },
        { name: "Dal Makhani", description: "Slow-cooked black lentils", price: 26000, emoji: "🍲", tags: "veg,popular" },
        { name: "Prawn Masala", description: "King prawns in coastal spice", price: 42000, emoji: "🥘", tags: "non-veg,spicy,seafood" },
        { name: "Pasta Arrabiata", description: "Spicy tomato pasta, fresh basil", price: 29000, emoji: "🍝", tags: "veg,spicy" },
      ],
    },
    {
      name: "Breads & Rice",
      emoji: "🍞",
      dishes: [
        { name: "Garlic Naan", description: "Oven-fresh, buttered garlic", price: 6000, emoji: "🫓", tags: "veg" },
        { name: "Jeera Rice", description: "Basmati with cumin tempering", price: 9000, emoji: "🍚", tags: "veg" },
        { name: "Chicken Biryani", description: "Dum-cooked with saffron", price: 35000, emoji: "🫕", tags: "non-veg,popular,bestseller" },
      ],
    },
    {
      name: "Desserts",
      emoji: "🍮",
      dishes: [
        { name: "Gulab Jamun", description: "Soft milk dumplings in syrup", price: 11000, emoji: "🍮", tags: "veg,sweet" },
        { name: "Mango Kulfi", description: "Frozen Indian ice cream", price: 13000, emoji: "🍦", tags: "veg,sweet,popular" },
      ],
    },
    {
      name: "Drinks",
      emoji: "🥤",
      dishes: [
        { name: "Mango Lassi", description: "Chilled yogurt & mango blend", price: 10000, emoji: "🥭", tags: "veg,cold" },
        { name: "Masala Chai", description: "Spiced milk tea", price: 6000, emoji: "🍵", tags: "veg,hot" },
      ],
    },
  ];

  for (const cat of categories) {
    const category = await db.category.create({
      data: { name: cat.name, emoji: cat.emoji },
    });
    for (const dish of cat.dishes) {
      await db.dish.create({
        data: { ...dish, categoryId: category.id },
      });
    }
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
