// jest.setup.ts
import "@testing-library/jest-native/extend-expect";
import { jest } from "@jest/globals";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));
