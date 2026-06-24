import request from 'supertest';
import { createApp } from '../../src/app';
import { signToken } from '../../src/utils/jwt';

// Mock Prisma at the lowest level so integration tests don't need a
// real database — they verify routing, middleware, and validation
// wiring, not persistence (that's covered by unit tests on services
// plus a real DB in CI, see docs/TESTING.md).
jest.mock('../../src/config/prisma', () => ({
  prisma: {
    part: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    user: { findUnique: jest.fn() },
  },
}));

describe('Integration: route protection', () => {
  const app = createApp();

  it('GET /api/parts without a token returns 401', async () => {
    const res = await request(app).get('/api/parts');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UnauthorizedError');
  });

  it('GET /api/parts with a malformed Authorization header returns 401', async () => {
    const res = await request(app).get('/api/parts').set('Authorization', 'NotBearer abc');
    expect(res.status).toBe(401);
  });

  it('GET /api/parts with a valid token succeeds', async () => {
    const token = signToken({ userId: 'u1', email: 'sales@herocycles.com', role: 'SALESPERSON' });
    const res = await request(app).get('/api/parts').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('POST /api/parts as SALESPERSON is forbidden (403) — only PRICING_MANAGER/ADMIN can create parts', async () => {
    const token = signToken({ userId: 'u1', email: 'sales@herocycles.com', role: 'SALESPERSON' });
    const res = await request(app)
      .post('/api/parts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Part', category: 'TYRE', sku: 'T-1', initialCost: 100 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ForbiddenError');
  });

  it('POST /api/auth/login with invalid body shape returns 422', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ValidationError');
  });

  it('GET /unknown-route returns 404 with a clear message', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });

  it('GET /health returns 200 without authentication', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
