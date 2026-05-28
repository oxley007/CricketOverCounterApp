require("dotenv/config");
const TENANTS = require("./tenants.config.js");

export default ({ config }) => {
  const variant = process.env.APP_VARIANT || "littlewicket";
  const tenant = TENANTS[variant];

  // Safety check: if variant is wrong, the build should fail early with a clear message
  if (!tenant) {
    throw new Error(`Invalid APP_VARIANT: ${variant}. Check tenants.config.js`);
  }

  return {
    ...config,
    name: tenant.name,
    slug: "cricket-umpire-ball-counter",
    version: "5.3.6",
    icon: tenant.icon,
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    expoRouter: {
      source: "src/app",
    },

    ios: {
      bundleIdentifier: tenant.bundleId,
      googleServicesFile: tenant.googleIos,
      supportsTablet: false,
      buildNumber: "5.3.6",
      icon: tenant.iosIcon,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [{ CFBundleURLSchemes: [tenant.scheme] }],
      },
      entitlements: {
        "com.apple.developer.applesignin": ["Default"],
      },
    },

    android: {
      package: tenant.package,
      googleServicesFile: tenant.googleAndroid,
      versionCode: 58,
      adaptiveIcon: {
        backgroundColor: tenant.color,
        foregroundImage: tenant.iosIcon,
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: "VIEW",
          data: { scheme: tenant.package }, // Using package/bundleId for the scheme
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: tenant.splash,
          resizeMode: "contain",
          imageWidth: 288,
          backgroundColor: tenant.splashColor,
          dark: {
            backgroundColor: tenant.splashColor,
          },
        },
      ],
      "expo-secure-store",
      // 👇 ADD THE SENTRY PLUGIN CONFIG HERE
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "cricket-umpire-ball-counter",
          organization: "4dot6",
        },
      ],
    ],

    extra: {
      variant: variant,
      features: tenant.features,
      tenantConfig: tenant,
      eas: {
        projectId: "01f25192-0a2a-4868-a640-b12a9dd6b98d",
      },
    },

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
