import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  saveSubscription,
  updatePublicTeamProStatus,
} from "../../services/firestoreService";
import {
  addCustomerInfoUpdateListener,
  configureRevenueCat,
  getCustomerInfo,
  getOfferings,
  isRevenueCatAvailable,
  purchasePackage,
} from "../../services/revenuecat";
import { useMatchStore } from "../../state/matchStore";
import { useStartModalStore } from "../../state/startModalStore";
import { useLiveStore } from "../../state/liveStore";
import { useIsLiveViewer } from "@/src/hooks/useIsLiveViewer";

type Package = {
  identifier: string;
  product: { priceString: string; title?: string; description?: string };
};

type Tier = "coach" | "supporter";
type Props = {
  visible: boolean;
  onClose: () => void;
  tier?: Tier; // undefined = show all
  isFromLiveConfig?: boolean;
};

//type Props = { visible: boolean; onClose: () => void };

// ...imports remain the same

export default function SubscriptionModal({
  visible,
  onClose,
  tier,
  isFromLiveConfig,
}: Props) {
  const Wrapper = Platform.OS === "android" ? SafeAreaView : View;

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<any>({});
  const selectedMode = useStartModalStore((state) => state.selectedMode);
  const setLivePro = useLiveStore((s) => s.setLivePro);
  const setLiveProViewer = useLiveStore((s) => s.setLiveProViewer);

  const setProUnlocked = useMatchStore((state) => state.setProUnlocked);
  const setProUnlockedScorebook = useMatchStore(
    (state) => state.setProUnlockedScorebook,
  );

  const isLiveViewer = useIsLiveViewer();

  const getCustomerInfoWithRetry = async (retries = 3): Promise<any> => {
    const info = await getCustomerInfo();

    if (info) {
      return info;
    }

    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return getCustomerInfoWithRetry(retries - 1);
    }

    return null;
  };

  /*
  useEffect(() => {
    if (!visible) return;

    if (isRevenueCatAvailable()) {
      configureRevenueCat();
    }

    fetchOfferings();
  }, [visible, isLiveViewer]); // 🚀 Re-fetches clean data if the viewer status updates dynamically
  */

  useEffect(() => {
    if (!visible) return;

    // 1. Completely remove configureRevenueCat() from here

    // 2. Fetch fresh offerings safely
    fetchOfferings();
  }, [visible, isLiveViewer]);

  // Only listen while the modal is open — otherwise every RC callback updates
  // matchStore and re-renders any screen using broad useMatchStore() subscriptions.
  useEffect(() => {
    if (!visible) return;
    if (!isRevenueCatAvailable()) return;

    const listener = addCustomerInfoUpdateListener(async (customerInfo) => {
      const active = customerInfo.entitlements.active || {};
      console.log("🔔 Customer info update:", active);

      const isBallActive = active["pro"]?.isActive ?? false;
      const isScorebookActive = active["scorebook_pro"]?.isActive ?? false;
      const isLiveProActive = active["live_pro"]?.isActive ?? false;

      // 🚀 Calculate viewer premium tier
      const isSupporterActive = Object.values(active).some((ent: any) =>
        [
          "pro_monthly_live_supporter",
          "pro_season_live_supporter",
          "4dot6_scorebook_lifetime_upgrade_live_supporter",
        ].some((id) => ent.productIdentifier?.includes(id)),
      );

      setProUnlocked(isBallActive);
      setProUnlockedScorebook(isScorebookActive);
      setLivePro(isLiveProActive);
      setLiveProViewer(isSupporterActive); // 🚀 Set the viewer state independently
      setEntitlements(active);

      // Inside the useEffect listener (Step 2)
      try {
        await saveSubscription({
          ballPro: isBallActive,
          scorebookPro: isScorebookActive,
          livePro: isLiveProActive, // 👈 Sync to personal user collection
          liveProViewer: isSupporterActive,
        });

        // 🚀 ALSO UPDATE THE ACTIVE PUBLIC TEAM IF ONE IS ACTIVE
        // 🚀 UPDATE ALL ACTIVE LIVE TEAMS
        const currentLiveState = useLiveStore.getState();
        const activeTeams = currentLiveState.teams || [];

        if (activeTeams.length > 0) {
          // Loop through every team configured in this live session
          await Promise.all(
            activeTeams.map((liveTeam) =>
              updatePublicTeamProStatus(liveTeam.teamId, isLiveProActive),
            ),
          );
        }
      } catch (e) {
        console.warn("Failed to sync subscription to Firestore:", e);
      }
    });

    return () => {
      if (typeof listener === "function") listener();
      else if (listener?.remove) listener.remove();
    };
  }, [visible, setProUnlocked, setProUnlockedScorebook]);

  const fetchOfferings = async () => {
    setLoading(true);

    console.log("=== 🟢 CURRENT STATE MODE IS ===", `"${selectedMode}"`);

    if (isRevenueCatAvailable()) {
      try {
        const offerings: any = await getOfferings();

        console.log(
          "=== 🔴 RAW OFFERINGS ROOT OBJECT ===",
          JSON.stringify(offerings, null, 2),
        );
        console.log(
          "=== 🔴 ALL AVAILABLE OFFERINGS ===",
          Object.keys(offerings?.all || {}),
        );
        console.log(
          "=== 🔴 CURRENT OFFERING NAME ===",
          offerings?.current?.identifier,
        );
        console.log(
          "=== 🔴 RAW UNFILTERED PACKAGES COUNT ===",
          offerings?.current?.availablePackages?.length || 0,
        );

        const currentOffering = offerings?.current;
        const allPackages = currentOffering?.availablePackages || [];

        // 1. Platform Map Definition
        const PACKAGE_MAP = Platform.select({
          ios: {
            coach: ["rc_monthly_live", "rc_season_live", "rc_lifetime_live"],
            supporter: [
              "rc_monthly_live_supporter",
              "rc_season_live_supporter",
              "rc_lifetime_live_supporter",
            ],
          },
          android: {
            coach: ["rc_monthly_live", "rc_season_live", "rc_lifetime_live"],
            supporter: [
              "rc_monthly_live_supporter",
              "rc_season_live_supporter",
              "rc_lifetime_live_supporter",
            ],
          },
          default: { coach: [], supporter: [] },
        });

        // 🔍 DEEP STRUCTURAL DIAGNOSTIC LOG
        console.log(
          "================ REVENUECAT DEEP IOS LOG ================",
        );
        allPackages.forEach((pkg: any, idx: number) => {
          console.log(`📦 [Package #${idx + 1}]`);
          console.log(`   -> Root pkg.identifier (RC Name):`, pkg.identifier);
          console.log(`   -> Root pkg.packageType:`, pkg.packageType);
          console.log(`   -> pkg.product object available?:`, !!pkg.product);
          if (pkg.product) {
            console.log(
              `   -> pkg.product.identifier (Apple ID):`,
              pkg.product.identifier,
            );
            console.log(
              `   -> pkg.product.productId (Alternative):`,
              pkg.product.productId,
            );
          }
        });
        console.log(
          "=========================================================",
        );

        // Helper match function placed safely inside try block
        const isPackageMatch = (pkg: any, targetArray: string[]) => {
          const rcPackageId = pkg.identifier;
          const storeProductId = pkg.product?.identifier;
          return (
            targetArray.includes(rcPackageId) ||
            (storeProductId && targetArray.includes(storeProductId))
          );
        };

        let filteredPackages = allPackages.filter((pkg: any) => {
          const id = (
            pkg.product?.identifier ||
            pkg.product?.productId ||
            pkg.identifier ||
            ""
          ).toLowerCase();

          // 1. SCENARIO A: User is viewing a live stream as a spectator
          if (isLiveViewer) {
            return isPackageMatch(pkg, PACKAGE_MAP.supporter);
          }

          // 2. SCENARIO B: Explicitly opened from the live config page
          if (isFromLiveConfig) {
            return isPackageMatch(pkg, PACKAGE_MAP.coach);
          }

          // 3. SCENARIO C: Fallback standard scoring
          const isLiveOption = isPackageMatch(pkg, PACKAGE_MAP.coach);
          let isContextOption = false;

          if (selectedMode === "scorebook") {
            isContextOption =
              id.includes("scorebook") ||
              id === "4dot6bycpro" ||
              id === "4dot6bycplayerstats_android";
          } else {
            isContextOption =
              id.includes("ball") ||
              id.includes("pro_monthly") ||
              id.includes("pro_season") ||
              id.includes("lifetime") ||
              id.includes("upgrade") ||
              (!id.includes("scorebook") && !id.includes("live"));
          }

          // 🛑 FORCE EXCLUSION: Prevent supporter live packages leaking onto scoring screens
          const isSupporterPackage = isPackageMatch(pkg, PACKAGE_MAP.supporter);
          if (isSupporterPackage) {
            return false;
          }

          return isLiveOption || isContextOption;
        });

        setPackages(filteredPackages);

        // 🚀 FETCH CURRENT ENTITLEMENTS WHEN COMPONENT MOUNTS
        const customerInfo = await getCustomerInfoWithRetry();
        const activeEntitlements = customerInfo?.entitlements.active || {};

        setEntitlements(activeEntitlements);

        const isBallActive = Object.keys(activeEntitlements).some(
          (k) => k.includes("pro") && !k.includes("live"),
        );
        const isScorebookActive = Object.keys(activeEntitlements).some((k) =>
          k.includes("scorebook_pro"),
        );
        const isLiveProActive = Object.keys(activeEntitlements).some((k) =>
          k.includes("live_pro"),
        );

        setProUnlocked(isBallActive);
        setProUnlockedScorebook(isScorebookActive);
        setLivePro(isLiveProActive);

        const isSupporterActive = Object.values(activeEntitlements).some(
          (ent: any) =>
            [
              "pro_monthly_live_supporter",
              "pro_season_live_supporter",
              "4dot6_scorebook_lifetime_upgrade_live_supporter",
            ].some((id) => ent.productIdentifier?.includes(id)),
        );
        setLiveProViewer(isSupporterActive);
      } catch (err) {
        console.error("Failed to fetch offerings:", err);
        setPackages([]);
      }
    } else {
      setPackages([
        {
          identifier: "monthly",
          product: {
            priceString: "$4.99",
            title: "Monthly Plan",
            description: "Mock monthly subscription",
          },
        },
        {
          identifier: "yearly",
          product: {
            priceString: "$49.99",
            title: "Yearly Plan",
            description: "Mock yearly subscription",
          },
        },
      ]);
      setEntitlements({});
      setProUnlocked(false);
      setProUnlockedScorebook(false);
      setLivePro(false);
      setLiveProViewer(false);
    }

    setLoading(false);
  };

  const handlePurchase = async (pkg: Package) => {
    if (!isRevenueCatAvailable()) {
      alert(`Mock purchase: ${pkg.product.title}`);
      setProUnlocked(true);
      return;
    }

    try {
      setPurchasing(pkg.identifier);
      await purchasePackage(pkg);

      const customerInfo = await getCustomerInfoWithRetry();
      const active = customerInfo?.entitlements.active || {};

      const isBallActive = Object.keys(active).some(
        (k) => k.includes("pro") && !k.includes("live"),
      );
      const isScorebookActive = Object.keys(active).some((k) =>
        k.includes("scorebook_pro"),
      );
      const isLiveProActive = Object.keys(active).some((k) =>
        k.includes("live_pro"),
      );

      const isSupporterActive = Object.values(active).some((ent: any) =>
        [
          "pro_monthly_live_supporter",
          "pro_season_live_supporter",
          "4dot6_scorebook_lifetime_upgrade_live_supporter",
          "pro_monthly_live_supporter_lw",
          "pro_season_live_supporter_lw",
          "4dot6_scorebook_lifetime_upgrade_live_supporter_lw",
        ].some((id) => ent.productIdentifier?.includes(id)),
      );

      setProUnlocked(isBallActive);
      setProUnlockedScorebook(isScorebookActive);
      setLivePro(isLiveProActive);
      setLiveProViewer(isSupporterActive);
      setEntitlements(active);

      if (
        isBallActive ||
        isScorebookActive ||
        isLiveProActive ||
        isSupporterActive
      ) {
        try {
          await saveSubscription({
            ballPro: isBallActive,
            scorebookPro: isScorebookActive,
            livePro: isLiveProActive,
            liveProViewer: isSupporterActive,
          });

          const currentLiveState = useLiveStore.getState();
          const activeTeams = currentLiveState.teams || [];

          if (activeTeams.length > 0) {
            await Promise.all(
              activeTeams.map((liveTeam) =>
                updatePublicTeamProStatus(liveTeam.teamId, isLiveProActive),
              ),
            );
          }
        } catch (e) {
          console.warn("Failed to save subscription to Firestore:", e);
        }
      }

      if (isLiveProActive || isSupporterActive)
        alert("Live Stream Pro activated 🎉");
      else if (isBallActive && !isScorebookActive)
        alert("Ball Counter subscription activated 🎉");

      onClose();
    } catch (err: any) {
      console.error("❌ Purchase error:", err);
      if (!err.userCancelled) alert(err?.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  const { height } = Dimensions.get("window");
  const RECOMMENDED_ID = "pro_season_ball"; // 👈 change if your identifier differs

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {/* 1. Remove justify-end here to allow full-screen overlay */}
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* 2. ScrollView fills the screen, container content expands */}

            <View style={styles.modal}>
              {/* Header */}
              <Text style={styles.title}>Upgrade Your Scoring</Text>
              <Text style={styles.subtitle}>
                Choose a plan that suits your season.
              </Text>

              {/* Value proposition */}
              <View style={styles.promoBox}>
                <Text style={styles.promoTitle}>What you unlock</Text>

                {/* 🟢 BALL COUNTER / STANDARD PRO SECTION */}
                {selectedMode !== "scorebook" && (
                  <View
                    style={[styles.promoFeatureCard, styles.borderStandard]}
                  >
                    <Text style={[styles.promoSubHeading, styles.textStandard]}>
                      Pro Standard
                    </Text>
                    <Text style={styles.promoText}>
                      • Live partnership runs and dots{"\n"}• Previous innings
                      over compare{"\n"}• Average & highest partnerships{"\n"}•
                      Total innings dots{"\n"}• Strike rotation %{"\n"}• Ball
                      reminder
                    </Text>
                  </View>
                )}

                {/* 🔵 SCOREBOOK PRO SECTION */}
                <View style={[styles.promoFeatureCard, styles.borderScorebook]}>
                  <Text style={[styles.promoSubHeading, styles.textScorebook]}>
                    Pro Scorebook
                  </Text>
                  {selectedMode === "scorebook" ? (
                    <Text style={styles.promoText}>
                      • All Player Stats{"\n"}• All Team Stats{"\n"}• Scorecards
                      from all previous fixtures{"\n"}• Cloud storage of your
                      stats{"\n"}• Live partnership runs and dots{"\n"}• Average
                      & highest partnerships{"\n"}• Total innings dots{"\n"}•
                      Strike rotation %{"\n"}• Ball reminder
                    </Text>
                  ) : (
                    <Text style={styles.promoText}>
                      • Everything in Pro Standard{"\n"}• All Player Stats{"\n"}
                      • All Team Stats{"\n"}• Scorecards from all previous
                      fixtures{"\n"}• Cloud storage of your data
                    </Text>
                  )}
                </View>

                {/* 🟣 LIVE SCORES SECTION */}
                <View style={[styles.promoFeatureCard, styles.borderLive]}>
                  <Text style={[styles.promoSubHeading, styles.textLive]}>
                    Pro Live Scores
                  </Text>
                  <Text style={styles.promoText}>
                    • Everything in Pro Scorebook{"\n"}• Stream ball-by-ball
                    live scores to any device{"\n"}• All supporters get Pro
                    access for free to view live scores{"\n"}• Live partnership
                    runs, dots, and strike rotation %{"\n"}• Instant sync across
                    player and team stats for supporters to view
                  </Text>
                </View>
              </View>

              {/* Legal links */}
              <View style={styles.promoLegalLinks}>
                <Text style={styles.promoLegalInline}>
                  <Text
                    style={styles.promoLegalText}
                    onPress={() =>
                      Linking.openURL(
                        "https://www.4dot6digital.com/privacy-policy-cricket-ball-counter",
                      )
                    }
                  >
                    Privacy Policy
                  </Text>
                  {Platform.OS === "ios" && (
                    <>
                      <Text style={styles.promoLegalSeparator}> | </Text>
                      <Text
                        style={styles.promoLegalText}
                        onPress={() =>
                          Linking.openURL(
                            "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/",
                          )
                        }
                      >
                        Terms of Use
                      </Text>
                    </>
                  )}
                </Text>
              </View>

              <Text style={styles.legal}>
                Subscriptions renew automatically and can be cancelled anytime
                via your App Store account. Apple sends a reminder at least 24
                hours before renewal.
              </Text>

              {/* Show active entitlements */}
              {Object.keys(entitlements).length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  {entitlements["pro"]?.isActive && (
                    <Text style={{ fontSize: 13, color: "#4f7cff" }}>
                      ✅ Ball Counter Pro active
                    </Text>
                  )}
                  {entitlements["scorebook_pro"]?.isActive && (
                    <Text style={{ fontSize: 13, color: "#4f7cff" }}>
                      ✅ Scorebook Pro active
                    </Text>
                  )}
                </View>
              )}

              {loading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" />
                  <Text>Loading plans…</Text>
                </View>
              ) : (
                <View>
                  {packages.length === 0 ? (
                    <Text style={styles.empty}>
                      No subscriptions available right now.
                    </Text>
                  ) : (
                    packages.map((pkg) => {
                      const isRecommended = pkg.identifier === RECOMMENDED_ID;
                      const id = (
                        pkg.product?.identifier ||
                        pkg.product?.productId ||
                        pkg.identifier ||
                        ""
                      ).toLowerCase();

                      // Determine Tier Type for colouring
                      const isLivePkg = id.includes("live");
                      const isScorebookPkg =
                        id.includes("scorebook") ||
                        id === "4dot6bycpro" ||
                        id === "4dot6bycplayerstats_android";

                      // Assign matching styles based on type
                      const tierPackageStyle = isLivePkg
                        ? styles.packageLive
                        : isScorebookPkg
                          ? styles.packageScorebook
                          : styles.packageStandard;

                      const tierButtonStyle = isLivePkg
                        ? styles.buttonLive
                        : isScorebookPkg
                          ? styles.buttonScorebook
                          : styles.buttonStandard;

                      const isSubscribed = Object.values(entitlements).some(
                        (ent: any) => {
                          if (!ent.isActive) return false;
                          return ent.productIdentifier === pkg.identifier;
                        },
                      );

                      return (
                        <View
                          key={pkg.identifier}
                          style={[
                            styles.package,
                            tierPackageStyle, // 👈 Adds tier specific border colour
                            isRecommended && styles.recommendedPackage,
                          ]}
                        >
                          {isRecommended && (
                            <View
                              style={[
                                styles.recommendedBadge,
                                isLivePkg && { backgroundColor: "#8e24aa" },
                                isScorebookPkg && {
                                  backgroundColor: "#4f7cff",
                                },
                              ]}
                            >
                              <Text style={styles.recommendedText}>
                                RECOMMENDED
                              </Text>
                            </View>
                          )}

                          <Text style={styles.pkgTitle}>
                            {pkg.product.title.replace(/\s*\(.*\)$/, "")}
                          </Text>
                          <Text style={styles.price}>
                            {pkg.product.priceString}
                          </Text>

                          {pkg.product.description && (
                            <Text style={styles.description}>
                              {pkg.product.description}
                            </Text>
                          )}

                          <Pressable
                            style={[
                              styles.subscribeButton,
                              tierButtonStyle, // 👈 Colours the action button to match the theme
                              isSubscribed && styles.disabledButton,
                            ]}
                            onPress={() => handlePurchase(pkg)}
                            disabled={isSubscribed}
                          >
                            <Text style={styles.subscribeText}>
                              {isSubscribed ? "Subscribed" : "Subscribe"}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>Not now</Text>
              </Pressable>

              <Pressable
                style={styles.restoreButton}
                onPress={async () => {
                  /* restore logic */
                }}
              >
                <Text style={styles.restoreText}>Restore Purchases</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, // Full screen
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    // Removed height restrictions
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 14,
  },

  promoBox: {
    backgroundColor: "#f1f6ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  promoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },

  promoText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },

  legal: {
    fontSize: 11,
    color: "#777",
    textAlign: "center",
    marginBottom: 10,
  },

  loading: {
    padding: 30,
    alignItems: "center",
  },

  scrollContent: {
    flexGrow: 1, // Allows content to be smaller or larger than screen
    justifyContent: "flex-end", // Pushes content to bottom, but allows scrolling up
  },

  empty: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },

  package: {
    position: "relative",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },

  recommendedPackage: {
    borderColor: "#4f7cff",
    backgroundColor: "#f6f9ff",
  },

  recommendedBadge: {
    position: "absolute",
    top: -10,
    right: 12,
    backgroundColor: "#4f7cff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  recommendedText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  pkgTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  price: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },

  description: {
    fontSize: 12,
    color: "#555",
    marginBottom: 10,
  },

  subscribeButton: {
    backgroundColor: "#77dd77",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  recommendedButton: {
    backgroundColor: "#4f7cff",
  },

  subscribeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  disabledButton: {
    backgroundColor: "#aaa",
  },

  closeButton: {
    marginTop: 10,
    alignItems: "center",
  },

  closeText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 15,
  },

  restoreButton: {
    marginTop: 10,
    alignItems: "center", // centers the button horizontally
  },

  restoreText: {
    color: "#4f7cff", // optional: make it blue
    fontWeight: "600",
    fontSize: 15,
    textDecorationLine: "underline", // adds underline
  },
  promoLegalLinks: {
    marginTop: 12,
    alignItems: "center",
  },

  promoLegalInline: {
    fontSize: 13,
    color: "#666",
  },

  promoLegalText: {
    color: "#666",
    textDecorationLine: "underline",
  },

  promoLegalSeparator: {
    color: "#666",
  },
  promoSubHeading: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 6,
  },
  // Feature Cards Layout
  promoFeatureCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4, // Bold left side line
  },

  // Colour Themes for Text & Borders
  borderStandard: { borderLeftColor: "#2e7d32" },
  textStandard: { color: "#2e7d32" },
  packageStandard: { borderColor: "#2e7d32", borderWidth: 1.5 },
  buttonStandard: { backgroundColor: "#2e7d32" },

  borderScorebook: { borderLeftColor: "#4f7cff" },
  textScorebook: { color: "#4f7cff" },
  packageScorebook: { borderColor: "#4f7cff", borderWidth: 1.5 },
  buttonScorebook: { backgroundColor: "#4f7cff" },

  borderLive: { borderLeftColor: "#8e24aa" },
  textLive: { color: "#8e24aa" },
  packageLive: { borderColor: "#8e24aa", borderWidth: 1.5 },
  buttonLive: { backgroundColor: "#8e24aa" },
});
