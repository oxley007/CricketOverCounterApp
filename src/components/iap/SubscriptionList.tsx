import { Modal, View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Dimensions, Platform, Linking } from "react-native";
import { useEffect, useState } from "react";
import {
  configureRevenueCat,
  getOfferings,
  isRevenueCatAvailable,
  purchasePackage,
  getCustomerInfo,
  addCustomerInfoUpdateListener,
  restorePurchases,
} from "../../services/revenuecat";
import { useMatchStore } from "../../state/matchStore";
import { SafeAreaView } from "react-native-safe-area-context";

type Package = { identifier: string; product: { priceString: string; title?: string; description?: string } };

type Props = { visible: boolean; onClose: () => void };

export default function SubscriptionModal({ visible, onClose }: Props) {
  const Wrapper = Platform.OS === "android" ? SafeAreaView : View;

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<any>({});

  const setProUnlocked = useMatchStore((state) => state.setProUnlocked);

  const fetchOfferings = async () => {
    setLoading(true);

    if (isRevenueCatAvailable()) {
      try {
        // Select offering based on platform
        const offerings: any = await getOfferings();
        console.log("Full offerings:", offerings);

        const currentOffering = offerings?.current;

        console.log("Current offering:", currentOffering);
        console.log("Available packages:", currentOffering?.availablePackages);

        setPackages(currentOffering?.availablePackages || []);

        // Get customer info and entitlements
        const customerInfo = await getCustomerInfo();
        const activeEntitlements = customerInfo?.entitlements.active || {};
        setEntitlements(activeEntitlements);
        setProUnlocked(activeEntitlements["pro"]?.isActive ?? false);
      } catch (err) {
        console.error(err);
        setPackages([]);
        setEntitlements({});
        setProUnlocked(false);
      }
    } else {
      // Mock data for testing in Expo Go / simulator
      setPackages([
        {
          identifier: "monthly",
          product: { priceString: "$4.99", title: "Monthly Plan", description: "Mock monthly subscription" },
        },
        {
          identifier: "yearly",
          product: { priceString: "$49.99", title: "Yearly Plan", description: "Mock yearly subscription" },
        },
      ]);
      setEntitlements({});
      setProUnlocked(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!visible) return;

    if (isRevenueCatAvailable()) {
      configureRevenueCat(); // must run first
    }

    fetchOfferings();
  }, [visible]);

  useEffect(() => {
    if (!isRevenueCatAvailable()) return;

    const listener = addCustomerInfoUpdateListener((customerInfo) => {
      setEntitlements(customerInfo.entitlements.active || {});
      setProUnlocked(customerInfo.entitlements.active["pro"]?.isActive ?? false);
    });

    return () => {
      // listener might be a function (RN module) or object with remove()
      if (typeof listener === "function") {
        listener(); // call it to unsubscribe
      } else if (listener?.remove) {
        listener.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Check if "pro" entitlement is active
    const isProActive = entitlements["pro"]?.isActive ?? false;
    setProUnlocked(isProActive);
  }, [entitlements]);

  const handlePurchase = async (pkg: Package) => {
    if (!isRevenueCatAvailable()) {
      alert(`Mock purchase: ${pkg.product.title}`);
      setProUnlocked(true); // mock purchase sets pro
      return;
    }

    try {
      setPurchasing(pkg.identifier);

      const { customerInfo } = await purchasePackage(pkg);

      const isProActive = customerInfo?.entitlements.active["pro"]?.isActive ?? false;
      setEntitlements(customerInfo.entitlements.active);
      setProUnlocked(isProActive); // <-- update store

      if (isProActive) {
        alert("Subscription activated 🎉");
        onClose();
      }
    } catch (err: any) {
      if (!err.userCancelled) alert(err?.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  const { height } = Dimensions.get("window");
  const RECOMMENDED_ID = "pro_season_ball"; // 👈 change if your identifier differs

  return (

  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
  <Wrapper style={{ flex: 1 }}>
    <View style={styles.overlay}>
      <View style={[styles.modal, { maxHeight: height * 0.75 }]}>

        {/* Header */}
        <Text style={styles.title}>Upgrade Your Scoring</Text>
        <Text style={styles.subtitle}>
          Choose a plan that suits your season.
        </Text>

        {/* Value proposition */}
        <View style={styles.promoBox}>
          <Text style={styles.promoTitle}>What you unlock</Text>

          <Text style={styles.promoText}>
            • Live partnership runs and dots{"\n"}
            • Average & highest partnerships{"\n"}
            • Total innings dots{"\n"}
            • Strike rotation %{"\n"}
            • Ball reminder
          </Text>

          {/* Legal links */}
          <View style={styles.promoLegalLinks}>
            <Text style={styles.promoLegalInline}>
              <Text
                style={styles.promoLegalText}
                onPress={() =>
                  Linking.openURL(
                    "https://www.4dot6digital.com/privacy-policy-cricket-ball-counter"
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
                        "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                      )
                    }
                  >
                    Terms of Use
                  </Text>
                </>
              )}
            </Text>
          </View>
        </View>
        
        {/* Legal */}
        <Text style={styles.legal}>
          Subscriptions renew automatically and can be cancelled anytime via your App Store account.
          Apple sends a reminder at least 24 hours before renewal.
        </Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
            <Text>Loading plans…</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {packages.length === 0 ? (
              <Text style={styles.empty}>
                No subscriptions available right now.
              </Text>
            ) : (
              packages.map((pkg) => {
                const isRecommended = pkg.identifier === RECOMMENDED_ID;
                const isSubscribed = entitlements["pro"]?.isActive;

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
                        <Text style={styles.recommendedText}>RECOMMENDED</Text>
                      </View>
                    )}

                    <Text style={styles.pkgTitle}>{pkg.product.title.replace(/\s*\(.*\)$/, "")}</Text>
                    <Text style={styles.price}>{pkg.product.priceString}</Text>

                    {pkg.product.description && (
                      <Text style={styles.description}>
                        {pkg.product.description}
                      </Text>
                    )}

                    <Pressable
                      style={[
                        styles.subscribeButton,
                        isRecommended && styles.recommendedButton,
                        (purchasing === pkg.identifier || isSubscribed) &&
                          styles.disabledButton,
                      ]}
                      onPress={() => handlePurchase(pkg)}
                      disabled={!!purchasing || isSubscribed}
                    >
                      <Text style={styles.subscribeText}>
                        {isSubscribed
                          ? "Subscribed"
                          : purchasing === pkg.identifier
                          ? "Purchasing…"
                          : "Subscribe"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Not now</Text>
        </Pressable>

        <Pressable
          style={styles.restoreButton}
          onPress={async () => {
            if (!isRevenueCatAvailable()) return alert("Restore unavailable");
            try {
              setLoading(true);
              const restoredInfo = await restorePurchases();
              const isProActive = restoredInfo.entitlements.active["pro"]?.isActive ?? false;
              setEntitlements(restoredInfo.entitlements.active);
              setProUnlocked(isProActive);
              alert("Purchases restored successfully");
            } catch {
              alert("Restore failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </Pressable>

      </View>
    </View>
    </Wrapper>
  </Modal>

);
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
    paddingBottom: 20,
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
    color: "#4f7cff",      // optional: make it blue
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


});
