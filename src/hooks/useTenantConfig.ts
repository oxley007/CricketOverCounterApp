import Constants from "expo-constants";

export const useTenantConfig = () => {
  const config = Constants.expoConfig?.extra?.tenantConfig;

  if (!config) {
    // This helps you catch configuration errors early during dev
    throw new Error("Tenant config not found in expo-constants");
  }

  return config;
};
