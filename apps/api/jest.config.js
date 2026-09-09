/** Jest config for @nalanda/api.
 *
 * Uses ts-jest against a real (temp, per-test-file) SQLite database that's
 * migrated fresh via drizzle's migrator in test/setup.ts — these are thin
 * integration tests against the actual schema/service code, not mocks, so
 * they catch real wiring mistakes (bad column names, broken sort clauses,
 * etc.) rather than just re-asserting whatever the mocks were told to return.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  setupFiles: ["<rootDir>/test/setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
};
