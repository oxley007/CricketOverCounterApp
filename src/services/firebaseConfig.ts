// services/firebaseConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "@firebase/auth";
import { getFirestore } from "firebase/firestore";

// getReactNativePersistence exists in the React Native build; public .d.ts omits it
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getReactNativePersistence } = require("@firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyDE2G5Skr2kc84fCdSbcVI8pbdrW4Frz4A",
  authDomain: "cricket-scorebok-byc.firebaseapp.com",
  projectId: "cricket-scorebok-byc",
  storageBucket: "cricket-scorebok-byc.firebasestorage.app",
  messagingSenderId: "491833064477",
  appId: "1:491833064477:ios:3e67fe0c4ef0e83b78daf4",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native persistence so login survives app restart/background
const auth =
  getApps().length === 0
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      })
    : getAuth(app);

export { auth };
export const db = getFirestore(app);
export default app;
