// services/firebaseConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
