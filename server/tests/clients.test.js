import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';

const TEST_DB = 'mongodb://127.0.0.1:27017/freelancehub_test_clients';
const CSRF = { 'X-Requested-With': 'XMLHttpRequest' };

let userACookie, userBCookie;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Create two test users
  const resA = await request(app)
    .post('/api/v1/auth/register')
    .set(CSRF)
    .send({ name: 'User A', email: 'usera@example.com', password: 'password123' });
  userACookie = resA.headers['set-cookie'];

  const resB = await request(app)
    .post('/api/v1/auth/register')
    .set(CSRF)
    .send({ name: 'User B', email: 'userb@example.com', password: 'password123' });
  userBCookie = resB.headers['set-cookie'];
});

describe('Clients API', () => {
  describe('POST /api/v1/clients', () => {
    it('creates a client for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set(CSRF)
        .set('Cookie', userACookie)
        .send({ name: 'Acme Corp', email: 'acme@corp.com', company: 'Acme' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.client.name).toBe('Acme Corp');
    });

    it('returns 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set(CSRF)
        .send({ name: 'Ghost Corp' });

      expect(res.status).toBe(401);
    });

    it('returns 422 if name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/clients')
        .set(CSRF)
        .set('Cookie', userACookie)
        .send({ email: 'no-name@corp.com' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/v1/clients', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/clients').set(CSRF).set('Cookie', userACookie)
        .send({ name: 'Client One' });
      await request(app).post('/api/v1/clients').set(CSRF).set('Cookie', userACookie)
        .send({ name: 'Client Two' });
      await request(app).post('/api/v1/clients').set(CSRF).set('Cookie', userBCookie)
        .send({ name: 'Client B Only' });
    });

    it('lists only the authenticated user\'s clients', async () => {
      const res = await request(app)
        .get('/api/v1/clients')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.clients).toHaveLength(2);
      expect(res.body.data.clients.every(c => c.name !== 'Client B Only')).toBe(true);
    });

    it('supports pagination', async () => {
      const res = await request(app)
        .get('/api/v1/clients?page=1&limit=1')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.clients).toHaveLength(1);
      expect(res.body.meta.pagination.total).toBe(2);
    });

    it('supports search by name', async () => {
      const res = await request(app)
        .get('/api/v1/clients?search=One')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.clients).toHaveLength(1);
      expect(res.body.data.clients[0].name).toBe('Client One');
    });
  });

  describe('GET /api/v1/clients/:id', () => {
    it('returns a single client for owner', async () => {
      const createRes = await request(app)
        .post('/api/v1/clients')
        .set(CSRF).set('Cookie', userACookie)
        .send({ name: 'My Client' });
      const id = createRes.body.data.client._id;

      const res = await request(app)
        .get(`/api/v1/clients/${id}`)
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.client.name).toBe('My Client');
    });

    it('returns 404 for other user\'s client (data ownership)', async () => {
      const createRes = await request(app)
        .post('/api/v1/clients')
        .set(CSRF).set('Cookie', userACookie)
        .send({ name: 'Owners Client' });
      const id = createRes.body.data.client._id;

      const res = await request(app)
        .get(`/api/v1/clients/${id}`)
        .set('Cookie', userBCookie);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/clients/:id', () => {
    it('updates client details', async () => {
      const createRes = await request(app)
        .post('/api/v1/clients')
        .set(CSRF).set('Cookie', userACookie)
        .send({ name: 'Original Name' });
      const id = createRes.body.data.client._id;

      const res = await request(app)
        .patch(`/api/v1/clients/${id}`)
        .set(CSRF).set('Cookie', userACookie)
        .send({ name: 'Updated Name', company: 'New Corp' });

      expect(res.status).toBe(200);
      expect(res.body.data.client.name).toBe('Updated Name');
      expect(res.body.data.client.company).toBe('New Corp');
    });
  });

  describe('DELETE /api/v1/clients/:id', () => {
    it('hard deletes client with no associations', async () => {
      const createRes = await request(app)
        .post('/api/v1/clients')
        .set(CSRF).set('Cookie', userACookie)
        .send({ name: 'Deletable Client' });
      const id = createRes.body.data.client._id;

      const res = await request(app)
        .delete(`/api/v1/clients/${id}`)
        .set(CSRF).set('Cookie', userACookie);

      expect(res.status).toBe(200);

      // Verify gone
      const getRes = await request(app)
        .get(`/api/v1/clients/${id}`)
        .set('Cookie', userACookie);
      expect(getRes.status).toBe(404);
    });

    it('prevents deletion of other user\'s client', async () => {
      const createRes = await request(app)
        .post('/api/v1/clients')
        .set(CSRF).set('Cookie', userACookie)
        .send({ name: 'Not Your Client' });
      const id = createRes.body.data.client._id;

      const res = await request(app)
        .delete(`/api/v1/clients/${id}`)
        .set(CSRF).set('Cookie', userBCookie);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/clients/:id/archive', () => {
    it('archives a client', async () => {
      const createRes = await request(app)
        .post('/api/v1/clients')
        .set(CSRF).set('Cookie', userACookie)
        .send({ name: 'Archive Me' });
      const id = createRes.body.data.client._id;

      const res = await request(app)
        .patch(`/api/v1/clients/${id}/archive`)
        .set(CSRF).set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.client.archivedAt).toBeTruthy();
    });
  });
});
