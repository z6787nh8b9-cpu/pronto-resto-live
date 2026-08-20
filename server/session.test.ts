/**
 * Session Management Tests
 * Tests for MySQL session store, admin login, and session persistence
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { getDb } from './db';
import { adminAccounts } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Import app for testing
let app: any;

beforeAll(async () => {
  // Dynamically import app to ensure it's initialized
  const { app: serverApp } = await import('./_core/index');
  app = serverApp;
  
  // Create test admin account
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const testEmail = 'test.session@pronto.admin';
  const testPassword = 'TestSession123!';
  
  // Delete existing test admin if exists
  await db.delete(adminAccounts).where(eq(adminAccounts.email, testEmail));
  
  // Create new test admin
  const passwordHash = await bcrypt.hash(testPassword, 10);
  await db.insert(adminAccounts).values({
    email: testEmail,
    passwordHash,
    name: 'Test Session Admin',
    createdAt: new Date(),
  });
  
  console.log('[Test Setup] Test admin created:', testEmail);
});

afterAll(async () => {
  // Cleanup: delete test admin
  const db = await getDb();
  if (db) {
    await db.delete(adminAccounts).where(eq(adminAccounts.email, 'test.session@pronto.admin'));
  }
  
  console.log('[Test Cleanup] Test admin deleted');
});

describe('Session Management', () => {
  it('should create session on admin login', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send('email=test.session@pronto.admin&password=TestSession123!')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Host', 'pronto.test')
      .set('Origin', 'http://pronto.test');
    
    expect(response.status).toBe(302); // Redirect to /admin
    expect(response.headers.location).toBe('/admin');
    expect(response.headers['set-cookie']).toBeDefined();
    
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('pronto.sid');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });
  
  it('should persist session across requests', async () => {
    // First request: login
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send('email=test.session@pronto.admin&password=TestSession123!')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Host', 'pronto.test')
      .set('Origin', 'http://pronto.test');
    
    expect(loginResponse.status).toBe(302);
    
    const cookie = loginResponse.headers['set-cookie'][0];
    
    // Second request: access protected tRPC route
    const meResponse = await request(app)
      .get('/api/trpc/adminAuth.me')
      .set('Cookie', cookie);
    
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.result.data.json).toMatchObject({
      email: 'test.session@pronto.admin',
      name: 'Test Session Admin',
    });
  });

  it('invalidates an existing Super Admin session when its authentication version changes', async () => {
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send('email=test.session@pronto.admin&password=TestSession123!')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Host', 'pronto.test')
      .set('Origin', 'http://pronto.test');
    const cookie = loginResponse.headers['set-cookie'][0];
    const db = await getDb();
    const [admin] = await db!.select().from(adminAccounts).where(eq(adminAccounts.email, 'test.session@pronto.admin')).limit(1);
    await db!.update(adminAccounts).set({ authVersion: admin.authVersion + 1 }).where(eq(adminAccounts.id, admin.id));

    const meResponse = await request(app)
      .get('/api/trpc/adminAuth.me')
      .set('Cookie', cookie);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.result.data.json).toBeNull();
  });

  it('should reject requests without session', async () => {
    const response = await request(app)
      .get('/api/trpc/adminAuth.me');
    
    expect(response.status).toBe(200);
    expect(response.body.result.data.json).toBeNull(); // No admin logged in
  });
  
  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send('email=test.session@pronto.admin&password=WrongPassword!')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Host', 'pronto.test')
      .set('Origin', 'http://pronto.test');
    
    expect(response.status).toBe(401); // Unauthorized
    expect(response.headers['set-cookie']).toBeUndefined(); // No cookie set
  });

  it('rejects a cross-origin login attempt before credential processing', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send('email=test.session@pronto.admin&password=TestSession123!')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Host', 'pronto.test')
      .set('Origin', 'https://attacker.example');

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ error: 'Origine de requête non autorisée.' });
  });
});

describe('Rate Limiting', () => {
  it('should block after 5 failed login attempts', async () => {
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/admin/login')
        .send('email=test.session@pronto.admin&password=WrongPassword!')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .set('Host', 'pronto.test')
        .set('Origin', 'http://pronto.test');
    }
    
    // 6th attempt should be blocked
    const response = await request(app)
      .post('/api/admin/login')
      .send('email=test.session@pronto.admin&password=WrongPassword!')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Host', 'pronto.test')
      .set('Origin', 'http://pronto.test');
    
    expect(response.status).toBe(429); // Too Many Requests
    expect(response.body.error).toContain('Trop de tentatives');
  }, 30000); // Increase timeout for rate limiting test
});
