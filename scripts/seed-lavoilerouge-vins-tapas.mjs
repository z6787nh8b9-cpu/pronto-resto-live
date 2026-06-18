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

  // All categories and items
  const categories = [
    // ---- TAPAS ----
    {
      name: 'Tapas',
      emoji: '🫒',
      items: [
        { name: 'Planche de charcuteries corse', description: 'Coppa, lonzu, saucisson', price: 11.00 },
        { name: 'Pizza roulé', description: 'Jambon & fromage / Chèvre & miel / Salami piquant', price: 12.00 },
        { name: 'Trio de tartes nustrale', description: 'Aux herbes "Signature" / Aux oignons "Douceur du maquis" / Aux herbes et brocciu "L\'authentique"', price: 12.00 },
        { name: 'Planche de jambon ibérique', price: 15.00 },
        { name: 'Trio de dips et son pane carasau', description: 'Houmous, guacamole, mousse de pommes de terre truffée & chips de panzetta', price: 15.00 },
        { name: 'Moules gratinées', price: 15.00 },
        { name: 'Trio de bruschettas', description: 'Mortadella & pistache / Saumon gravlax & ricotta citron / Magret de canard fumé', price: 18.00 },
        { name: 'Fritto misto', price: 19.50 },
        { name: 'Planche de charcuteries et fromages', description: 'Coppa, lonzu, saucisson, jambon cru, panzetta et figatelli grillées, fromage de chèvre et brebis', price: 24.00 },
        { name: 'Secreto iberico', description: 'Porc ibéric grillé au feu de bois, servi en fines tranches', price: 26.00 },
        { name: 'Entrecôte façon tagliata', description: 'Grillée au feu de bois, découpée en fines tranches, fleur de sel', price: 28.00 },
        { name: 'Planche de la mer', description: 'Poulpe snacké, mi-cuit de thon, moules gratinées', price: 30.00 },
      ]
    },
    // ---- VINS ----
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
    const [catResult] = await conn.execute(
      `INSERT INTO menuCategories (restaurantId, name, emoji, displayOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [restaurantId, cat.name, cat.emoji, catOrder++]
    );
    const categoryId = catResult.insertId;
    console.log(`✅ Category "${cat.name}" (ID: ${categoryId})`);

    let itemOrder = 0;
    for (const item of cat.items) {
      await conn.execute(
        `INSERT INTO menuItems (restaurantId, categoryId, name, description, price, displayOrder, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [restaurantId, categoryId, item.name, item.description || null, item.price, itemOrder++]
      );
    }
    console.log(`   → ${cat.items.length} items`);
  }

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  console.log(`\n🎉 Done! ${categories.length} catégories, ${totalItems} items insérés.`);

} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
