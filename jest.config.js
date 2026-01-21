/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo", // Expo preset for React Native + Expo projects

  // Support TypeScript
  /*
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  */

  // Ignore transforming most node_modules except React Native / Expo modules
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?@?react-native|expo|expo-secure-store|jest-expo)"
  ],

  // File extensions Jest will process
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Map any static assets to a mock
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },

  // Setup file for global mocks, e.g., mocking SecureStore
  setupFiles: ["<rootDir>/jest.setup.ts"],

  testPathIgnorePatterns: [
    "/node_modules/",
    "/build/",
  ],

  testEnvironment: "node",

  // Optional: clear mocks between tests
  clearMocks: true,
};
