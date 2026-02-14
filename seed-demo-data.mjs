import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  console.log("🌱 Seeding demo data...");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Insert demo restaurant: Hôtel des Nacres
    const [restaurantResult] = await connection.execute(
      `INSERT INTO restaurants (
        ownerId, slug, name, description,
        whatsapp, reservationUrl, email, phone, address,
        logoUrl, heroImageUrl,
        primaryColor, accentColor, fontFamily,
        subscriptionPlan, subscriptionStatus,
        isActive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, // ownerId
        'hotel-des-nacres',
        'Hôtel des Nacres',
        'Restaurant méditerranéen proposant des pizzas artisanales, des pâtes fraîches et des spécialités corses dans un cadre élégant.',
        '0612345678',
        'https://www.hoteldesnacres.fr/',
        'contact@hoteldesnacres.fr',
        '04 95 12 34 56',
        'Ajaccio, Corse',
        '/hotel-des-nacres-logo.png',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        '#7D3A31',
        '#FFD700',
        'Playfair Display',
        'premium',
        'active',
        true
      ]
    );

    const restaurantId = Number(restaurantResult.insertId);
    console.log(`✅ Restaurant created with ID: ${restaurantId}`);

    // Insert menu categories
    const categories = [
      { name: 'Entrées', displayOrder: 1 },
      { name: 'Pizze (le soir)', displayOrder: 2 },
      { name: 'Pâtes', displayOrder: 3 },
      { name: 'Viandes', displayOrder: 4 },
      { name: 'Hamburgers', displayOrder: 5 },
    ];

    const categoryIds = {};

    for (const cat of categories) {
      const [catResult] = await connection.execute(
        `INSERT INTO menuCategories (restaurantId, name, displayOrder, isActive) VALUES (?, ?, ?, ?)`,
        [restaurantId, cat.name, cat.displayOrder, true]
      );
      categoryIds[cat.name] = Number(catResult.insertId);
      console.log(`✅ Category "${cat.name}" created`);
    }

    // Insert menu items - Entrées
    const entrees = [
      { name: "Assiette «corse» à partager (2 pers)", price: 19.00, description: "Charcuterie corse, tomme corse" },
      { name: "Assiette de charcuterie corse", price: 14.00, description: "Coppa, lonzu, jambon corse, saucisson" },
      { name: "Salade «Corsica»", price: 12.00, description: "Salade, tomates, jambon corse, croûtons, noix, tomme corse", isVegetarian: false },
      { name: "Salade de poulet à la tomme corse", price: 12.00, description: "Salade, tomates, poulet grillé, tomme corse, croûtons, œufs, olives" },
      { name: "Salade de chèvre chaud", price: 12.00, description: "Salade, tomates, lardons, fromage de chèvre, olives", isVegetarian: true },
      { name: "Salade composée", price: 12.00, description: "Salade, tomates, thon, maïs, œufs, oignons, olives" },
      { name: "Salade poulet crispy", price: 13.00, description: "Salade, tomates, poulet pané, copeaux de parmesan, oignons, œufs, olives" },
    ];

    for (let i = 0; i < entrees.length; i++) {
      const item = entrees[i];
      await connection.execute(
        `INSERT INTO menuItems (categoryId, restaurantId, name, description, price, isVegetarian, displayOrder, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [categoryIds['Entrées'], restaurantId, item.name, item.description || '', item.price, item.isVegetarian || false, i, true]
      );
    }
    console.log(`✅ ${entrees.length} entrées added`);

    // Insert menu items - Pizze (shortened for brevity)
    const pizzas = [
      { name: "Marguerite", price: 8.00, description: "Sauce tomate, emmental, olives", isVegetarian: true },
      { name: "Napolitaine", price: 8.50, description: "Sauce tomate, anchois, olives, emmental" },
      { name: "Capricieuse", price: 9.00, description: "Sauce tomate, jambon, champignons frais, emmental" },
      { name: "Mozzarella", price: 9.00, description: "Sauce tomate, mozzarella, basilic", isVegetarian: true },
      { name: "Reine", price: 9.00, description: "Sauce tomate, jambon, champignons frais, emmental" },
      { name: "Quatre fromages", price: 9.00, description: "Sauce tomate, chèvre, mozzarella, emmental, roquefort", isVegetarian: true },
      { name: "Végétarienne", price: 9.00, description: "Sauce tomate, poivrons, artichauts, oignons, emmental", isVegetarian: true },
      { name: "Royale", price: 9.50, description: "Sauce tomate, jambon, champignons frais, emmental, œuf" },
      { name: "Carbonara", price: 9.50, description: "Crème fraîche, lardons, oignons, emmental, œuf" },
      { name: "Forestière", price: 9.50, description: "Crème fraîche, lardons, champignons frais, emmental, œuf" },
      { name: "Saumon", price: 9.50, description: "Sauce tomate, crème fraîche, saumon, persillade, emmental, olives" },
      { name: "Chèvre miel", price: 9.50, description: "Crème fraîche, chèvre, miel, lardons, mozzarella, olives", isVegetarian: true },
      { name: "Corse", price: 12.00, description: "Crème fraîche, emmental, mozzarella, tomme corse, coppa, lonzu, olives" },
      { name: "Tartiflette", price: 12.00, description: "Crème fraîche, pommes de terre, lardons, oignons, reblochon, emmental, olives" },
    ];

    for (let i = 0; i < pizzas.length; i++) {
      const item = pizzas[i];
      await connection.execute(
        `INSERT INTO menuItems (categoryId, restaurantId, name, description, price, isVegetarian, displayOrder, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [categoryIds['Pizze (le soir)'], restaurantId, item.name, item.description, item.price, item.isVegetarian || false, i, true]
      );
    }
    console.log(`✅ ${pizzas.length} pizzas added`);

    // Insert menu items - Pâtes
    const pates = [
      { name: "Pâtes bolognaise", price: 12.00, description: "Sauce bolognaise maison" },
      { name: "Pâtes carbonara", price: 12.00, description: "Crème fraîche, lardons, parmesan" },
      { name: "Pâtes forestière", price: 12.00, description: "Crème fraîche, champignons, lardons" },
      { name: "Pâtes aux crevettes", price: 14.00, description: "Crème fraîche, crevettes, persillade" },
    ];

    for (let i = 0; i < pates.length; i++) {
      const item = pates[i];
      await connection.execute(
        `INSERT INTO menuItems (categoryId, restaurantId, name, description, price, displayOrder, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [categoryIds['Pâtes'], restaurantId, item.name, item.description, item.price, i, true]
      );
    }
    console.log(`✅ ${pates.length} pâtes added`);

    // Insert menu items - Viandes
    const viandes = [
      { name: "Escalope de veau sauce forestière", price: 18.00, description: "Escalope de veau avec sauce aux champignons" },
      { name: "Escalope milanaise", price: 18.00, description: "Escalope panée à la milanaise" },
      { name: "Entrecôte grillée", price: 18.00, description: "Entrecôte grillée au feu de bois" },
      { name: "Entrecôte sauce au roquefort", price: 19.00, description: "Entrecôte avec sauce au roquefort" },
    ];

    for (let i = 0; i < viandes.length; i++) {
      const item = viandes[i];
      await connection.execute(
        `INSERT INTO menuItems (categoryId, restaurantId, name, description, price, displayOrder, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [categoryIds['Viandes'], restaurantId, item.name, item.description, item.price, i, true]
      );
    }
    console.log(`✅ ${viandes.length} viandes added`);

    // Insert menu items - Hamburgers
    const burgers = [
      { name: "Corsica burger", price: 15.00, description: "Salade, tomates, steak haché 150g, jambon corse, tomme corse, chutney d'oignons" },
      { name: "Hamburger au foie gras", price: 15.00, description: "Salade, tomates, steak haché 150g, bacon, foie gras, chutney d'oignons" },
      { name: "Burger chèvre miel", price: 15.00, description: "Salade, tomates, steak haché 150g, bacon, chèvre, miel, chutney d'oignons" },
      { name: "Bacon burger", price: 14.00, description: "Salade, tomates, steak haché 150g, bacon, cheddar, sauce burger" },
      { name: "Chicken crispy", price: 14.00, description: "Salade, tomates, filets de poulet panés, oignons, cheddar, sauce burger" },
      { name: "Classic", price: 13.00, description: "Salade, tomates, steak haché 150g, oignons, sauce burger" },
    ];

    for (let i = 0; i < burgers.length; i++) {
      const item = burgers[i];
      await connection.execute(
        `INSERT INTO menuItems (categoryId, restaurantId, name, description, price, displayOrder, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [categoryIds['Hamburgers'], restaurantId, item.name, item.description, item.price, i, true]
      );
    }
    console.log(`✅ ${burgers.length} burgers added`);

    // Insert chatbot config
    await connection.execute(
      `INSERT INTO chatbotConfigs (restaurantId, isEnabled, tone, customInfo, welcomeMessage)
       VALUES (?, ?, ?, ?, ?)`,
      [
        restaurantId,
        true,
        'warm',
        'Nous sommes spécialisés dans les pizzas artisanales et les spécialités corses. Nous acceptons les réservations par téléphone ou via notre site web.',
        'Bonjour ! 👋 Bienvenue à l\'Hôtel des Nacres. Comment puis-je vous aider aujourd\'hui ?'
      ]
    );
    console.log(`✅ Chatbot config created`);

    console.log("\n🎉 Demo data seeded successfully!");
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    await connection.end();
    process.exit(1);
  }
}

seed();
