import "dotenv/config";

export default ({ config }) => {
  const isUmpire = process.env.APP_VARIANT === "umpire";

  return {
    ...config,
    // --- Dynamic Identity ---
    name: isUmpire
      ? "4dot6 Umpire Ball Counter"
      : "LittleWicket Cricket Scorebook",
    slug: "cricket-umpire-ball-counter",
    version: "5.3.2",

    // --- Shared Logic ---
    orientation: "portrait",
    icon: isUmpire
      ? "./assets/images/splash-icon-4dot6.png"
      : "./assets/images/icon-littlewicket.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    expoRouter: {
      source: "src/app",
    },

    ios: {
      supportsTablet: false,
      bundleIdentifier: isUmpire
        ? "com.4dot6.cricketballandovercounter"
        : "com.fourdootsix.cricketscorebookbyc",
      googleServicesFile: isUmpire
        ? "./config/umpire/GoogleService-Info.plist"
        : "./config/littlewicket/GoogleService-Info.plist",
      buildNumber: "5.3.2",
      icon: isUmpire
        ? "./assets/ios-icon.png"
        : "./assets/ios-icon-littlewicket.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              isUmpire
                ? "com.4dot6.cricketballandovercounter"
                : "com.fourdootsix.cricketscorebookbyc",
            ],
          },
        ],
      },
      entitlements: {
        "com.apple.developer.applesignin": ["Default"],
      },
    },

    android: {
      package: isUmpire
        ? "com.cricketovercounterapp"
        : "com.cricketscorebookbyc",
      googleServicesFile: isUmpire
        ? "./config/umpire/google-services.json"
        : "./config/littlewicket/google-services.json",
      versionCode: 54,
      adaptiveIcon: {
        backgroundColor: isUmpire ? "#12c2e9" : "#2E7D32", // Unique colors per app
        foregroundImage: isUmpire
          ? "./assets/ios-icon.png"
          : "./assets/ios-icon-littlewicket.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: "VIEW",
          data: {
            scheme: isUmpire
              ? "com.cricketovercounterapp"
              : "com.cricketscorebookbyc",
          },
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: isUmpire
            ? "./assets/images/splash-icon-4dot6.png"
            : "./assets/images/splash-littlewicket.png",
          resizeMode: "cover",
          backgroundColor: isUmpire ? "#12c2e9" : "#ffffff",
          dark: {
            backgroundColor: isUmpire ? "#12c2e9" : "#ffffff",
          },
        },
      ],
      "expo-secure-store",
    ],

    extra: {
      variant: process.env.APP_VARIANT, // Allows you to check inside your React code
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
