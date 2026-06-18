import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Get restaurant ID
  const [restaurants] = await conn.execute(
    "SELECT id FROM restaurants WHERE slug = 'la-voile-rouge' LIMIT 1"
  );
  if (!restaurants.length) throw new Error('Restaurant la-voile-rouge not found');
  const restaurantId = restaurants[0].id;
  console.log('Restaurant ID:', restaurantId);

  // Get current max display order for categories
  const [maxOrder] = await conn.execute(
    'SELECT MAX(displayOrder) as maxOrder FROM menuCategories WHERE restaurantId = ?',
    [restaurantId]
  );
  let catOrder = (maxOrder[0].maxOrder || 0) + 1;

  // Categories and items
  const categories = [
    {
      name: 'Vins au verre',
      emoji: '🍷',
      items: [
        { name: 'Verre Vin IGP', price: 5.00 },
        { name: 'Verre Vin AOP Supérieur', price: 8.00 },
        { name: 'Piscine de Rosé', price: 7.00 },
      ]
    },
    {
      name: 'Pichets',
      emoji: '🫙',
      items: [
        { name: 'Pichet 50 cl', price: 8.00 },
        { name: 'Pichet 1 L', price: 15.00 },
      ]
    },
    {
      name: 'Vins Rosés',
      emoji: '🌸',
      items: [
        { name: 'Domaine Solenzara', description: 'AOP Porto-Vecchio', price: 28.00 },
        { name: 'Domaine de la Punta', description: 'AOP Aléria', price: 30.00 },
        { name: 'Domaine Saparale', description: 'AOP Sartène', price: 32.00 },
        { name: 'Clos Culombu', description: 'AOP Calvi', price: 32.00 },
      ]
    },
    {
      name: 'Vins Blancs',
      emoji: '🥂',
      items: [
        { name: 'Domaine Solenzara', description: 'AOP Porto-Vecchio', price: 30.00 },
        { name: 'Domaine de la Punta', description: 'AOP Aléria', price: 30.00 },
        { name: 'Domaine Saparale', description: 'AOP Sartène', price: 32.00 },
        { name: 'Clos Culombu', description: 'AOP Calvi', price: 32.00 },
        { name: 'Balianu', description: 'AOP Aléria', price: 40.00 },
        { name: 'Domaine Alzipratu', description: 'AOP Calvi', price: 42.00 },
        { name: 'Casteddu', description: 'AOP Sartène', price: 42.00 },
      ]
    },
    {
      name: 'Bouteilles 50 cl',
      emoji: '🍾',
      items: [
        { name: 'Domaine Saparale Rosé', description: 'AOP Sartène', price: 21.00 },
        { name: 'Domaine Saparale Blanc', description: 'AOP Sartène', price: 21.00 },
        { name: 'Domaine Saparale Rouge', description: 'AOP Sartène', price: 21.00 },
      ]
    },
    {
      name: 'Vins Rouges',
      emoji: '🍷',
      items: [
        { name: 'Domaine de la Punta', description: 'AOP Aléria', price: 30.00 },
        { name: 'Domaine Saparale', description: 'AOP Sartène', price: 32.00 },
        { name: 'Clos Culombu', description: 'AOP Calvi', price: 32.00 },
        { name: 'Balianu', description: 'AOP Aléria', price: 37.00 },
        { name: 'Domaine Alzipratu', description: 'AOP Calvi', price: 42.00 },
        { name: 'Casteddu', description: 'AOP Sartène', price: 42.00 },
        { name: 'Aldilà', description: 'AOP Niellucciu', price: 45.00 },
      ]
    },
    {
      name: 'Magnums',
      emoji: '🍾',
      items: [
        { name: 'Solenzara Rosé', description: 'AOP Porto-Vecchio', price: 60.00 },
        { name: 'Clos Culombu Rosé', description: 'AOP Calvi', price: 65.00 },
        { name: 'Casteddu Rosé', description: 'AOP Sartène', price: 75.00 },
        { name: 'Punta Blanc', description: 'AOP Aléria', price: 80.00 },
        { name: 'Balianu Rouge', description: 'AOP Aléria', price: 85.00 },
        { name: 'Casteddu Rouge', description: 'AOP Sartène', price: 85.00 },
        { name: 'Deutz Magnum', price: 215.00 },
      ]
    },
    {
      name: 'Champagnes',
      emoji: '🥂',
      items: [
        { name: 'Brigandat Blanc de Noirs', price: 60.00 },
        { name: 'Brigandat Blanc de Blancs', price: 90.00 },
        { name: 'Deutz Brut', price: 105.00 },
        { name: 'Ruinart Blanc de Blancs', price: 160.00 },
      ]
    },
  ];

  for (const cat of categories) {
    // Insert category
    const [catResult] = await conn.execute(
      `INSERT INTO menuCategories (restaurantId, name, emoji, displayOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [restaurantId, cat.name, cat.emoji, catOrder++]
    );
    const categoryId = catResult.insertId;
    console.log(`Category "${cat.name}" created (ID: ${categoryId})`);

    // Insert items
    let itemOrder = 0;
    for (const item of cat.items) {
      await conn.execute(
        `INSERT INTO menuItems (restaurantId, categoryId, name, description, price, displayOrder, isActive, isAvailable, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())`,
        [restaurantId, categoryId, item.name, item.description || null, item.price, itemOrder++]
      );
    }
    console.log(`  → ${cat.items.length} items inserted`);
  }

  console.log('\n✅ Carte des vins La Voile Rouge insérée avec succès !');
  console.log('Total catégories:', categories.length);
  console.log('Total items:', categories.reduce((sum, c) => sum + c.items.length, 0));

} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
