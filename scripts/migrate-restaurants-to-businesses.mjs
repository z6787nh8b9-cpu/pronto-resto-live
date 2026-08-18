import mysql from "mysql2/promise";

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 84) || "collection";
}

function toJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [restaurants] = await connection.query("SELECT * FROM restaurants ORDER BY id ASC");
  let migratedBusinesses = 0;
  let migratedCollections = 0;
  let migratedItems = 0;

  for (const restaurant of restaurants) {
    const businessStatus = restaurant.isActive ? "published" : "archived";

    await connection.execute(
      `INSERT INTO businesses
        (legacyRestaurantId, slug, name, vertical, status, subscriptionTier, subscriptionStatus, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, 'restaurant', ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         id = LAST_INSERT_ID(id),
         slug = VALUES(slug),
         name = VALUES(name),
         vertical = 'restaurant',
         status = VALUES(status),
         subscriptionTier = VALUES(subscriptionTier),
         subscriptionStatus = VALUES(subscriptionStatus),
         isActive = VALUES(isActive),
         updatedAt = NOW()`,
      [
        restaurant.id,
        restaurant.slug,
        restaurant.name,
        businessStatus,
        restaurant.subscriptionTier,
        restaurant.subscriptionStatus,
        restaurant.isActive,
      ],
    );

    const [businessRows] = await connection.execute(
      "SELECT id FROM businesses WHERE legacyRestaurantId = ? LIMIT 1",
      [restaurant.id],
    );
    const businessId = businessRows[0].id;
    migratedBusinesses += 1;

    await connection.execute(
      `INSERT INTO business_profiles
        (businessId, displayName, shortDescription, email, phone, whatsapp, address, logoUrl, heroImageUrl, primaryColor, accentColor, fontFamily, locale, socialLinks, seoTitle, seoDescription, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'fr', ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         displayName = VALUES(displayName), shortDescription = VALUES(shortDescription),
         email = VALUES(email), phone = VALUES(phone), whatsapp = VALUES(whatsapp), address = VALUES(address),
         logoUrl = VALUES(logoUrl), heroImageUrl = VALUES(heroImageUrl), primaryColor = VALUES(primaryColor),
         accentColor = VALUES(accentColor), fontFamily = VALUES(fontFamily), seoTitle = VALUES(seoTitle),
         seoDescription = VALUES(seoDescription), updatedAt = NOW()`,
      [
        businessId,
        restaurant.name,
        restaurant.description,
        restaurant.email,
        restaurant.phone,
        restaurant.whatsapp,
        restaurant.address,
        restaurant.logoUrl,
        restaurant.heroImageUrl,
        restaurant.primaryColor,
        restaurant.accentColor,
        restaurant.fontFamily,
        JSON.stringify({}),
        restaurant.name,
        restaurant.description,
      ],
    );

    if (restaurant.ownerId) {
      await connection.execute(
        `INSERT IGNORE INTO business_members
          (businessId, principalType, principalId, role, status, joinedAt, createdAt, updatedAt)
         VALUES (?, 'restaurant_owner', ?, 'owner', 'active', NOW(), NOW(), NOW())`,
        [businessId, restaurant.ownerId],
      );
    }

    await connection.execute(
      `INSERT INTO catalogs
        (businessId, legacyRestaurantId, slug, type, name, description, status, isPrimary, displayOrder, source, createdAt, updatedAt)
       VALUES (?, ?, 'menu', 'menu', 'Menu', ?, ?, 1, 0, 'legacy_migration', NOW(), NOW())
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), name = VALUES(name), description = VALUES(description), status = VALUES(status), updatedAt = NOW()`,
      [businessId, restaurant.id, restaurant.description, businessStatus === "published" ? "published" : "draft"],
    );

    const [catalogRows] = await connection.execute(
      "SELECT id FROM catalogs WHERE businessId = ? AND slug = 'menu' LIMIT 1",
      [businessId],
    );
    const catalogId = catalogRows[0].id;

    const [categories] = await connection.execute(
      "SELECT * FROM menuCategories WHERE restaurantId = ? ORDER BY displayOrder ASC, id ASC",
      [restaurant.id],
    );
    const collectionIdByLegacyCategory = new Map();

    for (const category of categories) {
      const collectionSlug = `${slugify(category.name)}-${category.id}`;
      await connection.execute(
        `INSERT INTO catalog_collections
          (catalogId, legacyMenuCategoryId, slug, name, description, imageUrl, displayOrder, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           id = LAST_INSERT_ID(id), catalogId = VALUES(catalogId), slug = VALUES(slug), name = VALUES(name),
           description = VALUES(description), imageUrl = VALUES(imageUrl), displayOrder = VALUES(displayOrder),
           status = VALUES(status), updatedAt = NOW()`,
        [
          catalogId,
          category.id,
          collectionSlug,
          category.name,
          category.description,
          category.imageUrl,
          category.displayOrder,
          category.isActive ? "active" : "hidden",
        ],
      );
      const [collectionRows] = await connection.execute(
        "SELECT id FROM catalog_collections WHERE legacyMenuCategoryId = ? LIMIT 1",
        [category.id],
      );
      collectionIdByLegacyCategory.set(category.id, collectionRows[0].id);
      migratedCollections += 1;
    }

    const [items] = await connection.execute(
      "SELECT * FROM menuItems WHERE restaurantId = ? ORDER BY displayOrder ASC, id ASC",
      [restaurant.id],
    );

    for (const item of items) {
      const attributes = {
        dietary: {
          vegetarian: Boolean(item.isVegetarian),
          vegan: Boolean(item.isVegan),
          glutenFree: Boolean(item.isGlutenFree),
        },
        allergens: toJson(item.allergens, []),
        ingredients: item.ingredients || null,
        nutritionalInfo: toJson(item.nutritionalInfo, null),
      };

      await connection.execute(
        `INSERT INTO catalog_items
          (catalogId, collectionId, legacyMenuItemId, itemType, name, description, priceType, price, currency, imageUrl, attributes, displayOrder, status, isFeatured, createdAt, updatedAt)
         VALUES (?, ?, ?, 'product', ?, ?, 'fixed', ?, 'EUR', ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           catalogId = VALUES(catalogId), collectionId = VALUES(collectionId), name = VALUES(name),
           description = VALUES(description), priceType = VALUES(priceType), price = VALUES(price), currency = VALUES(currency),
           imageUrl = VALUES(imageUrl), attributes = VALUES(attributes), displayOrder = VALUES(displayOrder),
           status = VALUES(status), isFeatured = VALUES(isFeatured), updatedAt = NOW()`,
        [
          catalogId,
          collectionIdByLegacyCategory.get(item.categoryId) || null,
          item.id,
          item.name,
          item.description,
          item.price,
          item.imageUrl,
          JSON.stringify(attributes),
          item.displayOrder,
          item.isActive ? "active" : "hidden",
          item.isFeatured,
        ],
      );
      migratedItems += 1;
    }
  }

  console.log(JSON.stringify({ migratedBusinesses, migratedCollections, migratedItems }, null, 2));
} finally {
  await connection.end();
}
