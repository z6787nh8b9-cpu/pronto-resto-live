import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // 1. Hash password
  const passwordHash = await bcrypt.hash('RISELVR2026@', 10);
  console.log('Password hashed');

  // 2. Create admin account
  const [accountResult] = await conn.execute(
    `INSERT INTO admin_accounts (email, name, passwordHash, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, ?, NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ['restaurant.lavoilerouge@gmail.com', 'La Voile Rouge', passwordHash]
  );
  console.log('Admin account created, ID:', accountResult.insertId);

  // 3. Create restaurant
  const [restResult] = await conn.execute(
    `INSERT INTO restaurants (slug, name, description, primaryColor, accentColor, fontFamily, subscriptionTier, subscriptionStatus, isActive, showAds, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [
      'la-voile-rouge',
      'La Voile Rouge',
      'Restaurant de cuisine méditerranéenne et corse, grillades au feu de bois',
      '#8B1A1A',
      '#C4A44A',
      'Playfair Display',
      'pro',
      'active'
    ]
  );
  
  // Get restaurant ID
  let restaurantId;
  if (restResult.insertId > 0) {
    restaurantId = restResult.insertId;
    console.log('Restaurant created, ID:', restaurantId);
  } else {
    const [existing] = await conn.execute('SELECT id FROM restaurants WHERE slug = ?', ['la-voile-rouge']);
    restaurantId = existing[0].id;
    console.log('Restaurant already exists, ID:', restaurantId);
  }

  // 4. Create chatbot config
  await conn.execute(
    `INSERT IGNORE INTO chatbotConfigs (restaurantId, isEnabled, tone, welcomeMessage, totalConversations, createdAt, updatedAt)
     VALUES (?, 1, 'warm', 'Bienvenue à La Voile Rouge ! Comment puis-je vous aider ?', 0, NOW(), NOW())`,
    [restaurantId]
  );
  console.log('Chatbot config created');

  // 5. Create menu categories
  const categories = [
    { name: 'Entrées', emoji: '🥗', order: 1 },
    { name: 'Poissons', emoji: '🐟', order: 2 },
    { name: 'Viandes', emoji: '🥩', order: 3 },
    { name: 'Pâtes & Risotti', emoji: '🍝', order: 4 },
    { name: 'Burgers', emoji: '🍔', order: 5 },
    { name: 'Desserts', emoji: '🍮', order: 6 },
  ];

  const categoryIds = {};
  for (const cat of categories) {
    const [catResult] = await conn.execute(
      `INSERT INTO menuCategories (restaurantId, name, emoji, displayOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [restaurantId, cat.name, cat.emoji, cat.order]
    );
    categoryIds[cat.name] = catResult.insertId;
    console.log(`Category "${cat.name}" created, ID:`, catResult.insertId);
  }

  // 6. Insert menu items
  const menuItems = [
    // ENTRÉES
    { cat: 'Entrées', name: 'Moules farcies', desc: 'Beurre, ail, persil et chapelure', price: 15.00, order: 1 },
    { cat: 'Entrées', name: 'Salade de chèvre chaud', desc: 'Toasts de chèvre, lardons, tomates, salade verte, oignons rouges et pignons de pin', price: 17.00, order: 2 },
    { cat: 'Entrées', name: 'Huîtres', desc: 'La demi-douzaine, servies avec vinaigre d\'échalotes et pain nordique. Provenance selon arrivage', price: 18.00, order: 3 },
    { cat: 'Entrées', name: 'Carpaccio de bœuf à l\'italienne', desc: 'Copeaux de parmesan et pesto maison', price: 18.50, order: 4 },
    { cat: 'Entrées', name: 'Fritto misto et sa rouille maison', desc: 'Friture de gambas, éperlans, calmars, poulpe et cabillaud', price: 19.50, order: 5 },
    { cat: 'Entrées', name: 'Salade Caesar', desc: 'Salade iceberg, poulet pané maison, œuf mollet, copeaux de parmesan, oignons rouges, tomates cerises et sauce Caesar maison', price: 20.00, order: 6 },
    { cat: 'Entrées', name: 'Duo de tartares de la mer', desc: 'Tartare de thon, sauce vierge et pignons de pin / Tartare de saumon mariné aux agrumes, avocat crémeux', price: 21.00, order: 7 },
    { cat: 'Entrées', name: 'Salade de poulpe', desc: 'Poulpe en persillade, pommes de terre, salade verte, échalotes et oignons rouges', price: 21.00, order: 8 },
    { cat: 'Entrées', name: 'Salade du soleil', desc: 'Mozzarella, jambon cru, tomates, melon', price: 22.00, order: 9 },
    { cat: 'Entrées', name: 'Poké bowl au saumon', desc: 'Riz blanc, gravlax de saumon, avocat, mangue, edamame, tomates cerises, concombre, sauce soja sucrée salée', price: 22.00, order: 10 },
    { cat: 'Entrées', name: 'Planche de charcuterie et fromage Corse', desc: 'Coppa, lonzu, saucisson, pancetta grillée, figatellu grillé, fromages de chèvre et de brebis', price: 24.00, order: 11 },

    // POISSONS
    { cat: 'Poissons', name: 'Moules marinières', desc: 'Avec frites maison', price: 19.50, order: 1 },
    { cat: 'Poissons', name: 'Moules à la crème', desc: 'Avec frites maison', price: 20.00, order: 2 },
    { cat: 'Poissons', name: 'Moules au curry', desc: 'Avec frites maison', price: 20.00, order: 3 },
    { cat: 'Poissons', name: 'Pavé de saumon frais', desc: 'Accompagnement au choix', price: 24.00, order: 4 },
    { cat: 'Poissons', name: 'Filet de Saint-Pierre', desc: 'Sauce beurre citronné', price: 25.00, order: 5 },
    { cat: 'Poissons', name: 'Mi-cuit de thon', desc: 'Sauce vierge, accompagnement au choix', price: 26.00, order: 6 },
    { cat: 'Poissons', name: 'Poulpe snacké à la persillade', desc: 'Et ses pommes de terre grenaille', price: 26.00, order: 7 },
    { cat: 'Poissons', name: 'Loup ou dorade grillés', desc: '400 à 600 g, grillés au feu de bois, sauce vierge', price: 27.00, order: 8 },
    { cat: 'Poissons', name: 'Planche de la mer', desc: 'Poulpe snacké, mi-cuit de thon à la plancha et moules farcies', price: 30.00, order: 9 },
    { cat: 'Poissons', name: 'Menu Enfant', desc: 'Steak haché, frites ou Tenders, frites ou Coquillettes au jambon ou Pâtes bolognaise. Boisson : Un pot de glace vanille-fraise ou vanille-chocolat', price: 12.00, order: 10 },

    // VIANDES
    { cat: 'Viandes', name: 'Sauté de veau aux olives', desc: 'Veau mijoté aux olives, accompagnement au choix', price: 21.00, order: 1 },
    { cat: 'Viandes', name: 'Tartare de bœuf classique', desc: 'Cœur de rumsteak coupé au couteau, câpres, échalotes, cornichons, jaune d\'œuf et sauce cocktail', price: 23.00, order: 2 },
    { cat: 'Viandes', name: 'Escalope de veau à la milanaise', desc: 'Accompagnement au choix', price: 24.00, order: 3 },
    { cat: 'Viandes', name: 'Filet mignon de porc', desc: 'Sauce moutarde à l\'ancienne, accompagnement au choix', price: 24.00, order: 4 },
    { cat: 'Viandes', name: 'Brochette de picanha de bœuf Angus', desc: 'Grillée au feu de bois, accompagnement au choix', price: 27.50, order: 5 },
    { cat: 'Viandes', name: 'Côte de veau rôtie à l\'échalote', desc: 'Accompagnement au choix', price: 28.00, order: 6 },
    { cat: 'Viandes', name: 'Secreto Ibérico', desc: 'Pièce noble de porc ibérique, grillée au feu de bois', price: 28.00, order: 7 },
    { cat: 'Viandes', name: 'Entrecôte charolaise', desc: 'Grillée au feu de bois, sauce au choix', price: 32.00, order: 8 },
    { cat: 'Viandes', name: 'Côte de bœuf', desc: 'Grillée au feu de bois (prix au kg)', price: 80.00, order: 9 },

    // PÂTES & RISOTTI
    { cat: 'Pâtes & Risotti', name: 'Penne à la Corse', desc: 'Crème fraîche et charcuterie corse', price: 21.00, order: 1 },
    { cat: 'Pâtes & Risotti', name: 'Gnocchi à la truffe et burratina', desc: 'Sauce à la truffe et burratina crémeuse', price: 22.00, order: 2 },
    { cat: 'Pâtes & Risotti', name: 'Wok de poulet', desc: 'Nouilles chinoises, poulet, légumes, sauce soja sucrée-salée et sauce wok curry', price: 22.00, order: 3 },
    { cat: 'Pâtes & Risotti', name: 'Wok de gambas', desc: 'Nouilles chinoises, gambas décortiquées, légumes, sauce soja sucrée-salée et sauce wok curry', price: 25.00, order: 4 },
    { cat: 'Pâtes & Risotti', name: 'Linguine aux fruits de mer', desc: 'Moules, palourdes, couteaux et gambas', price: 27.00, order: 5 },
    { cat: 'Pâtes & Risotti', name: 'Risotto aux gambas et courgettes', desc: 'Risotto crémeux aux gambas et courgettes', price: 27.00, order: 6 },

    // BURGERS
    { cat: 'Burgers', name: 'Burger de la Voile', desc: 'Steak Angus, cheddar, oignons confits, sauce cocktail et salade', price: 18.50, order: 1 },
    { cat: 'Burgers', name: 'Burger végétarien', desc: 'Tian de légumes, cheddar, oignons confits, sauce cocktail et salade', price: 18.50, order: 2, isVegetarian: true },
    { cat: 'Burgers', name: 'Fish Burger', desc: 'Pavé de saumon, cheddar, oignons confits, sauce tartare et salade', price: 21.00, order: 3 },

    // DESSERTS
    { cat: 'Desserts', name: 'Baba au rhum', desc: null, price: 10.00, order: 1 },
    { cat: 'Desserts', name: 'Tiramisu speculoos', desc: null, price: 10.00, order: 2 },
    { cat: 'Desserts', name: 'Mousse au chocolat', desc: null, price: 10.00, order: 3 },
    { cat: 'Desserts', name: 'Pavlova aux fruits rouges', desc: null, price: 10.00, order: 4 },
    { cat: 'Desserts', name: 'Café gourmand', desc: null, price: 10.00, order: 5 },
    { cat: 'Desserts', name: 'Crème brûlée', desc: null, price: 10.00, order: 6 },
    { cat: 'Desserts', name: 'Carpaccio d\'ananas et sa boule coco', desc: null, price: 10.00, order: 7 },
    { cat: 'Desserts', name: 'Brioche façon pain perdu au Nutella', desc: null, price: 11.00, order: 8 },
    { cat: 'Desserts', name: 'Profiterol au chocolat', desc: null, price: 11.00, order: 9 },
    { cat: 'Desserts', name: 'Assiette de fromage', desc: null, price: 12.00, order: 10 },
    { cat: 'Desserts', name: 'Glace Magnum (amande ou caramel)', desc: null, price: 3.50, order: 11 },
    { cat: 'Desserts', name: 'Nos glaces (la boule)', desc: 'Vanille, chocolat, fraise, café, pistache, coco, framboise, citron, cédrat Corse, clémentine Corse, caramel, poire, rhum, raisin', price: 3.00, order: 12 },
    { cat: 'Desserts', name: 'Supplément chantilly', desc: null, price: 2.00, order: 13 },
  ];

  for (const item of menuItems) {
    const catId = categoryIds[item.cat];
    if (!catId) {
      console.error(`Category not found: ${item.cat}`);
      continue;
    }
    await conn.execute(
      `INSERT INTO menuItems (categoryId, restaurantId, name, description, price, isVegetarian, isVegan, isGlutenFree, allergens, displayOrder, isActive, isFeatured, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, '[]', ?, 1, 0, NOW(), NOW())`,
      [catId, restaurantId, item.name, item.desc || null, item.price, item.isVegetarian ? 1 : 0, item.order]
    );
  }
  console.log(`Inserted ${menuItems.length} menu items`);

  console.log('\n✅ La Voile Rouge setup complete!');
  console.log('Restaurant ID:', restaurantId);
  console.log('Login: restaurant.lavoilerouge@gmail.com / RISELVR2026@');
  console.log('Public page: /la-voile-rouge/menu');
  console.log('Dashboard: /la-voile-rouge/dashboard');

} catch (err) {
  console.error('Error:', err.message);
  console.error(err);
} finally {
  await conn.end();
}
