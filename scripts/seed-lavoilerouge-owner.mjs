import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const passwordHash = await bcrypt.hash('RISELVR2026@', 10);

  // 1. Insert restaurant_owner with email provider
  const [ownerResult] = await conn.execute(
    `INSERT INTO restaurant_owners (email, name, provider, passwordHash, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, 'email', ?, NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE passwordHash = VALUES(passwordHash), name = VALUES(name)`,
    ['restaurant.lavoilerouge@gmail.com', 'La Voile Rouge', passwordHash]
  );

  let ownerId;
  if (ownerResult.insertId > 0) {
    ownerId = ownerResult.insertId;
    console.log('Owner created, ID:', ownerId);
  } else {
    const [existing] = await conn.execute(
      'SELECT id FROM restaurant_owners WHERE email = ?',
      ['restaurant.lavoilerouge@gmail.com']
    );
    ownerId = existing[0].id;
    console.log('Owner already exists, ID:', ownerId);
  }

  // 2. Link owner to restaurant
  const [updateResult] = await conn.execute(
    `UPDATE restaurants SET ownerId = ?, updatedAt = NOW() WHERE slug = 'la-voile-rouge'`,
    [ownerId]
  );
  console.log('Restaurant linked to owner, rows affected:', updateResult.affectedRows);

  console.log('\n✅ La Voile Rouge owner setup complete!');
  console.log('Owner ID:', ownerId);
  console.log('Login: restaurant.lavoilerouge@gmail.com / RISELVR2026@');

} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
