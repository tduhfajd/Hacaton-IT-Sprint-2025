import 'dotenv/config';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'smart_assistant_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Global test setup
beforeAll(async () => {
  // Setup test database connection
});

afterAll(async () => {
  // Cleanup test database
});

beforeEach(() => {
  // Reset test data
});

afterEach(() => {
  // Cleanup after each test
});