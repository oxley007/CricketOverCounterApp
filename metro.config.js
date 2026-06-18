const { getDefaultConfig } = require("expo/metro-config");
const { withSentryConfig } = require("@sentry/react-native/metro");

const config = getDefaultConfig(__dirname);

// ---- SVG SUPPORT ----
config.transformer.babelTransformerPath =
  require.resolve("react-native-svg-transformer");

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);

config.resolver.sourceExts.push("svg");

// ---- SENTRY WRAP ----
// If the serializer is throwing errors, we can safely export the clean config
const isEASBuild = process.env.EAS_BUILD === "true";

module.exports =
  process.env.SENTRY_DISABLE_METRO_SERIALIZER === "true"
    ? config
    : withSentryConfig(config);
