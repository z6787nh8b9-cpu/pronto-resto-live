import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get admin
  const [rows] = await conn.execute('SELECT * FROM admin_accounts WHERE email = ?', ['marcan.p@icloud.com']);
  const admin = rows[0];
  
  if (!admin) {
    console.log('Admin not found');
    return;
  }
  
  console.log('Admin found:', admin.email);
  console.log('Password hash:', admin.passwordHash);
  
  // Test password
  const isValid = await bcrypt.compare('WeWeWe08@', admin.passwordHash);
  console.log('Password valid:', isValid ? 'YES' : 'NO');
  
  await conn.end();
})();
