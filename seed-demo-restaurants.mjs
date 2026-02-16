import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🌱 Seeding demo restaurants...");

// Restaurant 1: La Voile Rouge (Beach chic)
const laVoileRouge = await db.insert(schema.restaurants).values({
  ownerId: 1,
  name: "La Voile Rouge",
  slug: "la-voile-rouge",
  description: "Restaurant de plage chic sur la Côte d'Azur",
  email: "contact@lavoilerouge.fr",
  phone: "+33 4 94 79 84 34",
  address: "Plage de Pampelonne, 83350 Ramatuelle",
  subscriptionPlan: "premium",
  subscriptionStatus: "active",
  primaryColor: "#C41E3A",
  secondaryColor: "#F5EDE4",
  accentColor: "#FF6B6B",
  chatbotTone: "decontracte",
  chatbotWelcomeMessage: "Bienvenue à La Voile Rouge ! 🌊 Comment puis-je vous aider aujourd'hui ?",
  chatbotCustomInfo: "Restaurant de plage emblématique depuis 1968. Ambiance festive, DJ sets l'après-midi. Spécialités de poissons frais et fruits de mer.",
});

const laVoileRougeId = Number(laVoileRouge[0].insertId);

// Categories for La Voile Rouge
const laVoileCategories = await db.insert(schema.menuCategories).values([
  {
    restaurantId: laVoileRougeId,
    name: "Fruits de Mer",
    description: "Fraîcheur de la Méditerranée",
    displayOrder: 1,
  },
  {
    restaurantId: laVoileRougeId,
    name: "Grillades",
    description: "Viandes et poissons grillés",
    displayOrder: 2,
  },
  {
    restaurantId: laVoileRougeId,
    name: "Salades",
    description: "Fraîcheur et légèreté",
    displayOrder: 3,
  },
]);

// Restaurant 2: Bella Vista (Italien)
const bellaVista = await db.insert(schema.restaurants).values({
  ownerId: 1,
  name: "Bella Vista",
  slug: "bella-vista",
  description: "Trattoria italienne authentique avec vue panoramique",
  email: "info@bellavista-restaurant.fr",
  phone: "+33 1 42 78 45 67",
  address: "15 Rue de la Paix, 75002 Paris",
  subscriptionPlan: "premium",
  subscriptionStatus: "active",
  primaryColor: "#008C45",
  secondaryColor: "#F4F5F0",
  accentColor: "#CD212A",
  chatbotTone: "chaleureux",
  chatbotWelcomeMessage: "Benvenuti à Bella Vista ! 🇮🇹 Comment puis-je vous aider ?",
  chatbotCustomInfo: "Cuisine italienne traditionnelle. Pâtes fraîches maison, pizzas au feu de bois. Carte des vins italiens. Vue sur les toits de Paris.",
});

const bellaVistaId = Number(bellaVista[0].insertId);

// Categories for Bella Vista
const bellaVistaCategories = await db.insert(schema.menuCategories).values([
  {
    restaurantId: bellaVistaId,
    name: "Antipasti",
    description: "Entrées italiennes",
    displayOrder: 1,
  },
  {
    restaurantId: bellaVistaId,
    name: "Pasta",
    description: "Pâtes fraîches maison",
    displayOrder: 2,
  },
  {
    restaurantId: bellaVistaId,
    name: "Pizza",
    description: "Cuites au feu de bois",
    displayOrder: 3,
  },
  {
    restaurantId: bellaVistaId,
    name: "Dolci",
    description: "Desserts italiens",
    displayOrder: 4,
  },
]);

// Restaurant 3: Le Bistrot Parisien (Français traditionnel)
const leBistrot = await db.insert(schema.restaurants).values({
  ownerId: 1,
  name: "Le Bistrot Parisien",
  slug: "le-bistrot-parisien",
  description: "Bistrot traditionnel au cœur de Saint-Germain",
  email: "contact@bistrotparisien.fr",
  phone: "+33 1 45 48 87 65",
  address: "28 Rue de Buci, 75006 Paris",
  subscriptionPlan: "basic",
  subscriptionStatus: "active",
  primaryColor: "#2C3E50",
  secondaryColor: "#ECF0F1",
  accentColor: "#E74C3C",
  chatbotTone: "formel",
  chatbotWelcomeMessage: "Bienvenue au Bistrot Parisien. Comment puis-je vous renseigner ?",
  chatbotCustomInfo: "Bistrot parisien authentique depuis 1952. Cuisine française traditionnelle. Spécialités : boeuf bourguignon, coq au vin, tarte tatin. Ambiance chaleureuse.",
});

const leBistrotId = Number(leBistrot[0].insertId);

// Categories for Le Bistrot Parisien
const leBistrotCategories = await db.insert(schema.menuCategories).values([
  {
    restaurantId: leBistrotId,
    name: "Entrées",
    description: "Pour bien commencer",
    displayOrder: 1,
  },
  {
    restaurantId: leBistrotId,
    name: "Plats",
    description: "Nos spécialités",
    displayOrder: 2,
  },
  {
    restaurantId: leBistrotId,
    name: "Fromages",
    description: "Sélection du maître fromager",
    displayOrder: 3,
  },
  {
    restaurantId: leBistrotId,
    name: "Desserts",
    description: "La touche sucrée",
    displayOrder: 4,
  },
]);

// Add some menu items for each restaurant
// La Voile Rouge items
await db.insert(schema.menuItems).values([
  {
    categoryId: 1, // Fruits de Mer
    name: "Plateau de Fruits de Mer",
    description: "Huîtres, langoustines, bulots, crevettes",
    price: "65.00",
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    allergens: JSON.stringify(["Crustacés", "Mollusques"]),
    displayOrder: 1,
  },
  {
    categoryId: 2, // Grillades
    name: "Loup de Mer Grillé",
    description: "Poisson entier grillé, légumes de saison",
    price: "42.00",
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    allergens: JSON.stringify(["Poissons"]),
    displayOrder: 1,
  },
  {
    categoryId: 3, // Salades
    name: "Salade Niçoise",
    description: "Thon, anchois, œufs, olives, tomates",
    price: "24.00",
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    allergens: JSON.stringify(["Poissons", "Œufs"]),
    displayOrder: 1,
  },
]);

// Bella Vista items
await db.insert(schema.menuItems).values([
  {
    categoryId: 5, // Antipasti
    name: "Burrata Pugliese",
    description: "Burrata crémeuse, tomates confites, basilic",
    price: "16.00",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    allergens: JSON.stringify(["Lait"]),
    displayOrder: 1,
  },
  {
    categoryId: 6, // Pasta
    name: "Tagliatelle al Tartufo",
    description: "Pâtes fraîches, truffe noire, parmesan",
    price: "32.00",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    allergens: JSON.stringify(["Gluten", "Œufs", "Lait"]),
    displayOrder: 1,
  },
  {
    categoryId: 7, // Pizza
    name: "Pizza Margherita",
    description: "Tomate, mozzarella di bufala, basilic",
    price: "18.00",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    allergens: JSON.stringify(["Gluten", "Lait"]),
    displayOrder: 1,
  },
  {
    categoryId: 8, // Dolci
    name: "Tiramisu",
    description: "Mascarpone, café, cacao",
    price: "12.00",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    allergens: JSON.stringify(["Gluten", "Œufs", "Lait"]),
    displayOrder: 1,
  },
]);

// Le Bistrot Parisien items
await db.insert(schema.menuItems).values([
  {
    categoryId: 9, // Entrées
    name: "Soupe à l'Oignon Gratinée",
    description: "Soupe traditionnelle, croûtons, gruyère",
    price: "12.00",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    allergens: JSON.stringify(["Gluten", "Lait"]),
    displayOrder: 1,
  },
  {
    categoryId: 10, // Plats
    name: "Bœuf Bourguignon",
    description: "Mijoté au vin rouge, lardons, champignons",
    price: "28.00",
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: true,
    allergens: JSON.stringify(["Céleri"]),
    displayOrder: 1,
  },
  {
    categoryId: 11, // Fromages
    name: "Plateau de Fromages",
    description: "Sélection de 5 fromages affinés",
    price: "14.00",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    allergens: JSON.stringify(["Lait"]),
    displayOrder: 1,
  },
  {
    categoryId: 12, // Desserts
    name: "Tarte Tatin",
    description: "Pommes caramélisées, crème fraîche",
    price: "11.00",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    allergens: JSON.stringify(["Gluten", "Lait", "Œufs"]),
    displayOrder: 1,
  },
]);

console.log("✅ Demo restaurants seeded successfully!");
console.log("- La Voile Rouge (Beach chic)");
console.log("- Bella Vista (Italien)");
console.log("- Le Bistrot Parisien (Français traditionnel)");

await connection.end();
