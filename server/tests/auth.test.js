import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';

// Use local MongoDB for tests (mongodb-memory-server too slow to download)
const TEST_DB = 'mongodb://127.0.0.1:27017/freelancehub_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

afterAll(async () => {
  // Drop test database after tests
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

const CSRF = { 'X-Requested-With': 'XMLHttpRequest' };

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('creates a user and sets auth cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF)
        .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.startsWith('authToken='))).toBe(true);
    });

    it('returns 409 when email is already taken', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF)
        .send({ name: 'Alice', email: 'dupe@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF)
        .send({ name: 'Alice2', email: 'dupe@example.com', password: 'password456' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('returns 422 for invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF)
        .send({ name: '', email: 'not-an-email', password: '123' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF)
        .send({ name: 'Bob', email: 'bob@example.com', password: 'mypassword123' });
    });

    it('succeeds with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set(CSRF)
        .send({ email: 'bob@example.com', password: 'mypassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('bob@example.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set(CSRF)
        .send({ email: 'bob@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set(CSRF)
        .send({ email: 'nobody@example.com', password: 'anything' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('clears the auth cookie', async () => {
      // Register and get cookie
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF)
        .send({ name: 'Carol', email: 'carol@example.com', password: 'password123' });

      const cookie = regRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set(CSRF)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      // Cookie should be cleared (empty or expired)
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        expect(setCookie.some(c => c.includes('authToken=;') || c.includes('authToken=,')
          || c.includes('Max-Age=0') || c.includes('Expires=Thu, 01 Jan 1970'))).toBe(true);
      }
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns user when authenticated', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .set(CSRF)
        .send({ name: 'Dave', email: 'dave@example.com', password: 'password123' });

      const cookie = regRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('dave@example.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Security', () => {
    it('blocks POST without X-Requested-With header', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Eve', email: 'eve@example.com', password: 'password123' });
      expect(res.status).toBe(403);
    });
  });
});
