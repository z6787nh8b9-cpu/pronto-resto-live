import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const seedOwnerEmail = process.env.LAVOILE_ROUGE_SEED_EMAIL;
const seedOwnerPassword = process.env.LAVOILE_ROUGE_SEED_PASSWORD;

if (!seedOwnerEmail || !seedOwnerPassword) {
  throw new Error('LAVOILE_ROUGE_SEED_EMAIL et LAVOILE_ROUGE_SEED_PASSWORD sont requis pour exécuter ce script.');
}

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const passwordHash = await bcrypt.hash(seedOwnerPassword, 10);

  // 1. Insert restaurant_owner with email provider
  const [ownerResult] = await conn.execute(
    `INSERT INTO restaurant_owners (email, name, provider, passwordHash, createdAt, updatedAt, lastSignedIn)
     VALUES (?, ?, 'email', ?, NOW(), NOW(), NOW())
     ON DUPLICATE KEY UPDATE passwordHash = VALUES(passwordHash), name = VALUES(name)`,
    [seedOwnerEmail, 'La Voile Rouge', passwordHash]
  );

  let ownerId;
  if (ownerResult.insertId > 0) {
    ownerId = ownerResult.insertId;
    console.log('Owner created, ID:', ownerId);
  } else {
    const [existing] = await conn.execute(
      'SELECT id FROM restaurant_owners WHERE email = ?',
      [seedOwnerEmail]
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
  console.log('Login owner:', seedOwnerEmail);

} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
