// tenants.config.js
module.exports = {
  umpire: {
    name: "Umpire 4dot6 Ball Counter",
    bundleId: "com.4dot6.cricketballandovercounter",
    package: "com.cricketovercounterapp",
    scheme: "com.4dot6.cricketballandovercounter",
    color: "#12c2e9",
    splashColor: "#12c2e9",
    icon: "./assets/images/splash-icon-4dot6.png",
    iosIcon: "./assets/ios-icon.png",
    splash: "./assets/images/splash-icon-4dot6.png",
    googleIos: "./config/umpire/GoogleService-Info.plist",
    googleAndroid: "./config/umpire/google-services.json",
    // --- UI & THEME STRATEGY ---
    branding: {
      shortName: "4dot6",
    },
    modes: [
      {
        id: "ball",
        label: "Ball Counter",
        primary: true,
        logo: "logo_ballCounterCard_trans",
      },
      {
        id: "score",
        label: "Scorebook",
        primary: false,
        logo: "logo_ballCounterCard",
      },
      {
        id: "liveScores",
        label: "Live Scores",
        primary: false,
        logo: "logo_ballCounterCard_trans",
      },
    ],
    theme: {
      headerLogo: "logo_umpire_tight",
      watermark: "cricket",
      modeSelectionBg: "rgba(0,0,0,1)",
      modeHeaderBg: "rgba(0,0,0,1)",
      headerTextColor: "#ffffff",
      backgroundImage: null, // Umpire uses solid black
      logoAspectRatio: 1.8,
      cardBorderColor: "transparent",
      cardBorderWidth: 0,
      cardBg: "#A855F7",
      cardTextColor: "#ffffff",
      ballBg: "#12c2e9",
      ballText: "#ffffff",
      scoreBg: "#ffffff",
      scoreText: "#12c2e9",
      // 👇 ADD THIS
      actionTabs: {
        undoColor: "#c471ed",
        dotColor: "#FFF8F0",
        dotIconColor: "#12c2e9",
        plusColor: "#77dd77",
        labelColor: "#fff",
        dotLabelColor: "#12c2e9",
      },
    },
    features: {
      liveStreaming: false,
      showJuniorPrompt: true, // 4dot6 asks if they should use LittleWicket
      primaryMode: "ball",
    },
  },
  littlewicket: {
    name: "LittleWicket Cricket Scorebook",
    bundleId: "com.fourdootsix.cricketscorebookbyc",
    package: "com.cricketscorebookbyc",
    scheme: "com.fourdootsix.cricketscorebookbyc",
    color: "#2E7D32",
    splashColor: "#ffffff",
    icon: "./assets/images/icon-littlewicket.png",
    iosIcon: "./assets/ios-icon-littlewicket.png",
    splash: "./assets/images/splash-littlewicket.png",
    googleIos: "./config/littlewicket/GoogleService-Info.plist",
    googleAndroid: "./config/littlewicket/google-services.json",
    // --- UI & THEME STRATEGY ---
    branding: {
      shortName: "LittleWicket",
    },
    modes: [
      {
        id: "score",
        label: "Scorebook",
        primary: true,
        logo: "logo_littlewicketCardBall",
      },
      {
        id: "ball",
        label: "Ball Counter",
        primary: false,
        logo: "logo_littlewicketCardBall_trans",
      },
      {
        id: "liveScores",
        label: "Live Scores",
        primary: false,
        logo: "logo_littlewicketCardBall",
      },
    ],
    theme: {
      headerLogo: "logo_littlewicket",
      watermark: "cricket",
      modeSelectionBg: "#0F172A", // Clean white screen background
      modeHeaderBg: "transparent",
      headerTextColor: "#FFFFFF", // Deep charcoal for crisp readability
      backgroundImage: "icon_littlewicket",
      logoAspectRatio: 4.1,

      // Cards: Deep premium forest green with soft background
      cardBg: "#A855F7", // Clean, very light slate grey
      cardBorderColor: "#ffffff", // Soft mid-slate border
      cardBorderWidth: 1.5,
      cardTextColor: "#FFFFFF", // Very dark slate text (perfect contrast)

      // --- Scoring UI Elements (Your Core Slate Shade) ---
      scoreBg: "#00C2F3", // Your chosen core slate grey
      scoreText: "#FFFFFF", // Crisp white text over dark slate
      scoreBorderColor: "#00C2F3", // Ultra-dark slate accent border

      // --- Ball Tracker Elements (Ultra-Light Tinted Slate Shade) ---
      ballBg: "#FFFFFF", // Off-white slate tint (distinguishes it from pure white background)
      ballText: "#004c61", // Core slate grey text inside the ball
      ballBorderColor: "#FFFFFF",

      actionTabs: {
        undoColor: "#e2339c",
        dotColor: "#e9df36",
        dotIconColor: "#666",
        plusColor: "#77dd77",
        labelColor: "#fff",
        dotLabelColor: "#666",
      },
    },

    features: {
      liveStreaming: true,
      showJuniorPrompt: false, // LittleWicket doesn't need to prompt
      primaryMode: "score",
    },
  },
};
