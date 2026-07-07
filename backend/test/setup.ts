// Ensure required environment variables exist before config/env.ts is imported
// by any test module. dotenv (called inside env.ts) does not override values
// that are already set here, so these deterministic test secrets win.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/test";
