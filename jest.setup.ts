// jest.setup.ts
import "@testing-library/jest-native/extend-expect";
import { jest } from "@jest/globals";
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

// ✅ UPDATE THIS BLOCK: Add getApps and getApp to satisfy your initialization check
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []), // Returns an empty array so length === 0 is true
  getApp: jest.fn(() => ({})),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(() =>
    Promise.resolve({ exists: () => false, data: () => ({}) }),
  ),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
}));

// ✅ ADD THIS: Stop Jest from reading real Firebase Auth files
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: {} })),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null); // Mimics a logged-out state by default
    return jest.fn(); // Returns an unsubscribe function
  }),
}));

jest.mock("@firebase/auth", () => ({
  getReactNativePersistence: jest.fn(() => ({})),
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
}));

jest.mock("react-native/Libraries/Vibration/Vibration", () => ({
  vibrate: jest.fn(),
}));

// jest.setup.ts

// ✅ ADD THIS: Intercepts native React Native alerts
jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));
