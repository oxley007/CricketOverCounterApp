import Constants from "expo-constants";
import { Platform } from "react-native";

let Purchases: any = null;

try {
  Purchases = require("react-native-purchases").default; // ✅ load native module
} catch {
  // Expo Go / web — native module unavailable
}

export function isRevenueCatAvailable() {
  return !!Purchases;
}

// ... (keep your imports and Purchases setup)

export function configureRevenueCat() {
  if (!Purchases) return;

  // 1. Get the variant exactly how you do in your StartModeModal
  const variant = Constants.expoConfig?.extra?.variant;
  const isLittleWicket = variant === "littlewicket";

  // 2. Pick the correct keys based on that variant
  const iosKey = isLittleWicket
    ? process.env.EXPO_PUBLIC_LW_RC_IOS_KEY
    : process.env.EXPO_PUBLIC_RC_IOS_KEY;

  const androidKey = isLittleWicket
    ? process.env.EXPO_PUBLIC_LW_RC_ANDROID_KEY
    : process.env.EXPO_PUBLIC_RC_ANDROID_KEY;

  const apiKey = Platform.OS === "ios" ? iosKey : androidKey;

  if (!apiKey) {
    console.warn(`⚠️ RevenueCat API Key missing for variant: ${variant}`);
    return;
  }

  // 3. Configure with the dynamic key
  Purchases.configure({ apiKey });

  console.log(
    `✅ RevenueCat configured for ${variant} using key: ${apiKey.substring(0, 10)}...`,
  );
}

// ... (rest of your functions)

export async function getOfferings() {
  if (!Purchases) return null;
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: any) {
  if (!Purchases) return null;
  return Purchases.purchasePackage(pkg);
}

export async function getCustomerInfo() {
  if (!Purchases) return null;
  return Purchases.getCustomerInfo();
}

export function addCustomerInfoUpdateListener(
  callback: (customerInfo: any) => void,
) {
  if (!Purchases) return { remove: () => {} }; // no-op if not available
  return Purchases.addCustomerInfoUpdateListener(callback);
}

export async function restorePurchases() {
  if (!Purchases) return null;
  return Purchases.restorePurchases();
}
