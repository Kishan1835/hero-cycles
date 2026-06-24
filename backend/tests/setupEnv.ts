process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/hero_cycles_test';
process.env.JWT_SECRET = 'test-secret-key-for-jest-only-not-for-production-use';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '4001';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '1000';
