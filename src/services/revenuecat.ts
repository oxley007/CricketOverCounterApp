import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases from "react-native-purchases"; // ✅ Safe, modern linter-friendly import

export function isRevenueCatAvailable() {
  // Returns false on web to safely prevent native execution crashes
  return Platform.OS !== "web" && !!Purchases;
}

export function configureRevenueCat() {
  if (!isRevenueCatAvailable()) return;

  // 🚀 Enables detailed underlying native logs from Google Play / RevenueCat
  if (__DEV__) {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  } else {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.INFO);
  }

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

  // 🚀 Debug environment variables on physical devices
  console.log(`[RC Setup] Variant: ${variant}, OS: ${Platform.OS}`);
  console.log(`[RC Setup] Expected API Key exists: ${!!apiKey}`);

  if (!apiKey) {
    console.warn(`⚠️ RevenueCat API Key missing for variant: ${variant}`);
    return; // ✅ Safely wrapped inside configureRevenueCat function scope now
  }

  // 3. Configure with the dynamic key
  Purchases.configure({ apiKey });

  console.log(
    `✅ RevenueCat configured for ${variant} using key: ${apiKey.substring(0, 10)}...`,
  );
}

export async function getOfferings() {
  if (!isRevenueCatAvailable()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    console.log(
      "🎁 Offerings fetched successfully:",
      Object.keys(offerings.all),
    );
    return offerings;
  } catch (error: any) {
    console.error("❌ getOfferings Error details:", {
      code: error.code,
      message: error.message,
      underlyingError: error.underlyingErrorMessage,
    });
    return null;
  }
}

export async function purchasePackage(pkg: any) {
  if (!isRevenueCatAvailable()) return null;
  try {
    console.log(`🛒 Attempting purchase for package: ${pkg.identifier}`);
    const purchaseResult = await Purchases.purchasePackage(pkg);
    console.log("✅ Purchase successful:", purchaseResult);
    return purchaseResult;
  } catch (error: any) {
    console.error("❌ purchasePackage Error details:", {
      code: error.code,
      message: error.message,
      underlyingError: error.underlyingErrorMessage,
      userCancelled: error.userCancelled,
    });
    throw error;
  }
}

export async function getCustomerInfo() {
  if (!isRevenueCatAvailable()) return null;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    console.log("👤 Customer info fetched successfully");
    return customerInfo;
  } catch (error: any) {
    console.error("❌ getCustomerInfo Error:", {
      code: error.code,
      message: error.message,
      underlyingError: error.underlyingErrorMessage,
    });
    return null;
  }
}

export function addCustomerInfoUpdateListener(
  callback: (customerInfo: any) => void,
) {
  if (!isRevenueCatAvailable()) return { remove: () => {} };
  return Purchases.addCustomerInfoUpdateListener(callback);
}

export async function restorePurchases() {
  if (!isRevenueCatAvailable()) return null;
  try {
    console.log("🔄 Requesting purchase restoration...");
    const restoredInfo = await Purchases.restorePurchases();
    console.log(
      "✅ Purchases restored successfully. Active entitlements:",
      Object.keys(restoredInfo.entitlements.active),
    );
    return restoredInfo;
  } catch (error: any) {
    console.error("❌ restorePurchases Error:", {
      code: error.code,
      message: error.message,
      underlyingError: error.underlyingErrorMessage,
    });
    throw error;
  }
}
