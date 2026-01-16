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

export function configureRevenueCat() {
  if (!Purchases) return;

  Purchases.configure({
    apiKey:
      Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_RC_IOS_KEY!
        : process.env.EXPO_PUBLIC_RC_ANDROID_KEY!,
  });
}

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
  callback: (customerInfo: any) => void
) {
  if (!Purchases) return { remove: () => {} }; // no-op if not available
  return Purchases.addCustomerInfoUpdateListener(callback);
}

export async function restorePurchases() {
  if (!Purchases) return null;
  return Purchases.restorePurchases();
}
