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

type Package = {
  identifier: string;
  product: { priceString: string; title?: string; description?: string };
};

type Tier = "coach" | "supporter";
type Props = {
  visible: boolean;
  onClose: () => void;
  tier?: Tier; // undefined = show all
};

//type Props = { visible: boolean; onClose: () => void };

// ...imports remain the same

export default function SubscriptionModal({ visible, onClose, tier }: Props) {
  const Wrapper = Platform.OS === "android" ? SafeAreaView : View;

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<any>({});
  const selectedMode = useStartModalStore((state) => state.selectedMode);
  const setLivePro = useLiveStore((s) => s.setLivePro);

  const setProUnlocked = useMatchStore((state) => state.setProUnlocked);
  const setProUnlockedScorebook = useMatchStore(
    (state) => state.setProUnlockedScorebook,
  );

  const getCustomerInfoWithRetry = async (retries = 3) => {
    try {
      return await getCustomerInfo();
    } catch (e: any) {
      if (retries > 0 && e?.message?.includes("ingested")) {
        await new Promise((r) => setTimeout(r, 1500));
        return getCustomerInfoWithRetry(retries - 1);
      }
      throw e;
    }
  };

  const fetchOfferings = async () => {
    setLoading(true);

    if (isRevenueCatAvailable()) {
      try {
        const offerings: any = await getOfferings();

        const currentOffering = offerings?.current;
        const allPackages = currentOffering?.availablePackages || [];

        const PACKAGE_MAP = {
          coach: [
            "pro_monthly_live",
            "pro_season_live",
            "4dot6_scorebook_lifetime_upgrade_live",
          ],
          supporter: [
            "pro_monthly_live_supporter",
            "pro_season_live_supporter",
            "4dot6_scorebook_lifetime_upgrade_live_supporter",
          ],
        };

        let filteredPackages = allPackages;

        // 1. Filter by tier first
        if (tier === "supporter") {
          filteredPackages = filteredPackages.filter((pkg: any) =>
            PACKAGE_MAP.supporter.includes(pkg.product.identifier),
          );
        } else if (tier === "coach") {
          filteredPackages = filteredPackages.filter((pkg: any) =>
            PACKAGE_MAP.coach.includes(pkg.product.identifier),
          );
        }

        // 2. Then apply mode filter on TOP
        if (selectedMode === "scorebook") {
          filteredPackages = filteredPackages.filter(
            (pkg: any) =>
              pkg.product.identifier.includes("scorebook") ||
              pkg.product.identifier === "4DOT6BYCPRO" ||
              pkg.product.identifier === "4dot6bycplayerstats_android",
          );
        }

        if (tier !== "supporter" && tier !== "coach") {
          filteredPackages = filteredPackages.filter(
            (pkg: any) =>
              !PACKAGE_MAP.supporter.includes(pkg.product.identifier),
          );
        }

        setPackages(filteredPackages);
      } catch (err) {
        console.error("Failed to fetch offerings:", err);
        setPackages([]);
      }

      // 👇 separate block
      try {
        const customerInfo = await getCustomerInfoWithRetry();

        const activeEntitlements = customerInfo?.entitlements.active || {};

        setEntitlements(activeEntitlements);
        setProUnlocked(activeEntitlements["pro"]?.isActive ?? false);
        setProUnlockedScorebook(
          activeEntitlements["scorebook_pro"]?.isActive ?? false,
        );
        setLivePro(activeEntitlements["live_pro"]?.isActive ?? false);
      } catch (err) {
        console.warn("Failed to fetch customer info:", err);
        // ✅ do nothing — keep existing state
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
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!visible) return;

    if (isRevenueCatAvailable()) {
      configureRevenueCat();
    }

    fetchOfferings();
  }, [visible]);

  // Only listen while the modal is open — otherwise every RC callback updates
  // matchStore and re-renders any screen using broad useMatchStore() subscriptions.
  useEffect(() => {
    if (!visible) return;
    if (!isRevenueCatAvailable()) return;

    const listener = addCustomerInfoUpdateListener(async (customerInfo) => {
      const active = customerInfo.entitlements.active || {};
      console.log("🔔 Customer info update:", active);

      const isLiveProActive = active["live_pro"]?.isActive ?? false;
      const isBallActive = active["pro"]?.isActive ?? false;
      const isScorebookActive = active["scorebook_pro"]?.isActive ?? false;

      setProUnlocked(isBallActive);
      setProUnlockedScorebook(isScorebookActive);
      setLivePro(isLiveProActive);
      setEntitlements(active);

      // Inside the useEffect listener (Step 2)
      try {
        await saveSubscription({
          ballPro: isBallActive,
          scorebookPro: isScorebookActive,
          livePro: isLiveProActive, // 👈 Sync to personal user collection
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

  const handlePurchase = async (pkg: Package) => {
    if (!isRevenueCatAvailable()) {
      alert(`Mock purchase: ${pkg.product.title}`);
      setProUnlocked(true);
      return;
    }

    try {
      setPurchasing(pkg.identifier);

      await purchasePackage(pkg);

      // let listener handle truth OR fetch fresh:
      const customerInfo = await getCustomerInfoWithRetry();
      console.log("💡 Purchased package:", pkg.identifier);
      console.log(
        "📦 customerInfo after purchase:",
        JSON.stringify(customerInfo, null, 2),
      );

      const active = customerInfo?.entitlements.active || {};
      console.log("🔹 active entitlements:", active);

      const isBallActive = active["pro"]?.isActive ?? false;
      const isScorebookActive = active["scorebook_pro"]?.isActive ?? false;
      const isLiveProActive = active["live_pro"]?.isActive ?? false;

      console.log(
        "🎯 isBallActive:",
        isBallActive,
        "isScorebookActive:",
        isScorebookActive,
      );

      setProUnlocked(isBallActive);
      setProUnlockedScorebook(isScorebookActive);
      setLivePro(isLiveProActive);
      setEntitlements(active);

      // Inside handlePurchase success block (Step 3)
      if (isBallActive || isScorebookActive || isLiveProActive) {
        // 👈 Added live pro condition checks
        try {
          await saveSubscription({
            ballPro: isBallActive,
            scorebookPro: isScorebookActive,
            livePro: isLiveProActive,
          });

          // 🚀 ALSO UPDATE THE ACTIVE PUBLIC TEAM HERE
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
          console.warn("Failed to save subscription to Firestore:", e);
        }

        // Handle alert titles...
        if (isLiveProActive) alert("Live Stream Pro activated 🎉");
        else if (isBallActive && !isScorebookActive)
          alert("Ball Counter subscription activated 🎉");
        // ...
        onClose();
      }
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

                {selectedMode === "scorebook" && (
                  <Text style={styles.promoText}>
                    • All Player Stats{"\n"}• All Team Stats{"\n"}• Scorecards
                    from all previous fixtures{"\n"}• Cloud storage of your
                    stats
                    {"\n"}• Live partnership runs and dots{"\n"}• Average &
                    highest partnerships{"\n"}• Total innings dots{"\n"}• Strike
                    rotation %{"\n"}• Ball reminder
                  </Text>
                )}

                {selectedMode !== "scorebook" && (
                  <View>
                    <Text style={styles.promoSubHeading}>Pro Standard</Text>
                    <Text style={styles.promoText}>
                      • Live partnership runs and dots{"\n"}•Previous innings
                      over compare{"\n"}• Average & highest partnerships{"\n"}•
                      Total innings dots{"\n"}• Strike rotation %{"\n"}• Ball
                      reminder
                    </Text>

                    <Text style={[styles.promoSubHeading, { marginTop: 10 }]}>
                      Pro Scorebook
                    </Text>
                    <Text style={styles.promoText}>
                      • Everything in Pro Standard{"\n"}• All Player Stats{"\n"}
                      • All Team Stats{"\n"}• Scorecards from all previous
                      fixtures
                      {"\n"}• Cloud storage of your data
                    </Text>
                  </View>
                )}
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

                      // 🔹 NEW: check subscription dynamically against entitlements
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
                            isRecommended && styles.recommendedPackage,
                          ]}
                        >
                          {isRecommended && (
                            <View style={styles.recommendedBadge}>
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
                              isRecommended && styles.recommendedButton,
                            ]}
                            onPress={() => handlePurchase(pkg)}
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
});
