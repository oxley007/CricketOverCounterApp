// jest.setup.ts
import "jest-expo";
import { jest } from "@jest/globals";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => null),
  setItemAsync: jest.fn(async (key: string, value: string) => {}),
  deleteItemAsync: jest.fn(async (key: string) => {}),
}));
