import { useNavigation } from "expo-router/react-navigation";
import { deleteUser, onAuthStateChanged, signOut, User } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AuthModal from "../../components/AuthModal";
import { auth, db } from "../../services/firebaseConfig";
import { useAuthStore } from "../../state/authStore";
import { wipeAllStores } from "../../state/wipeAllStores";
import Svg, { Path, LinearGradient, Stop } from "react-native-svg";
//import { LinearGradient } from "expo-linear-gradient";

export default function AccountScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isReauthForDeletion, setIsReauthForDeletion] = useState(false);

  const setGuest = useAuthStore((s) => s.setGuest);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const getUserDisplayLabel = () => {
    if (!currentUser) return "Guest Mode";
    return (
      currentUser.email ||
      currentUser.displayName ||
      `User: ${currentUser.uid.slice(0, 8)}`
    );
  };

  const performGlobalWipe = () => {
    try {
      wipeAllStores();
      useAuthStore.getState().setGuest(true);
    } catch (e) {
      console.error("Failed to wipe stores:", e);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await signOut(auth);
            performGlobalWipe();
          } catch (e) {
            console.error("Logout failed:", e);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  /**
   * 🔥 Logic moved here so it can be re-run after AuthModal success
   */
  const executeDeletion = async (user: User) => {
    setIsLoading(true);
    try {
      // 1. Clear Firestore
      await deleteDoc(doc(db, "users", user.uid));
      // 2. Delete Auth Account
      await deleteUser(user);

      performGlobalWipe();
      Alert.alert("Deleted", "Your account has been removed.");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        // Instead of a plain alert, we offer to open the Login modal
        Alert.alert(
          "Verification Required",
          "For security, please log in again to confirm account deletion.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Log In",
              onPress: () => {
                setIsReauthForDeletion(true);
                setAuthVisible(true);
              }, // Triggers the modal
            },
          ],
        );
      } else {
        Alert.alert("Error", "Could not delete account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;

    Alert.alert(
      "Delete Account",
      "This will permanently delete your profile and all saved cloud data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => executeDeletion(currentUser),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <View style={styles.headerContainer}>
        {/* Back Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressedActive,
          ]}
        >
          <Svg width="18" height="18" viewBox="0 -960 960 960" fill="#7fdaff">
            <Path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
          </Svg>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        {/* Centered Title */}
        <Text style={styles.titleText}>Account</Text>
      </View>

      {/* Account Details / Glass Card */}
      <View style={styles.glassCard}>
        <View style={styles.cardHeader}>
          <View style={styles.statusInfo}>
            <Text style={styles.labelCaps}>
              {currentUser ? "LOGGED IN AS" : "STATUS"}
            </Text>

            <View style={styles.statusRow}>
              {/* Pulse Indicator (visible when not logged in) */}
              {!currentUser && <View style={styles.pulseDot} />}
              <Text style={styles.headlineMd}>
                {currentUser ? getUserDisplayLabel() : "Guest Mode"}
              </Text>
            </View>
          </View>

          {/* Profile Icon Container */}
          <View style={styles.iconContainer}>
            <Svg width="28" height="28" viewBox="0 -960 960 960" fill="#7fdaff">
              <Path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-240v-32q0-34 17.5-62.5T226-378q62-31 126-46.5T480-440q64 0 128 15.5T734-378q31 15 48.5 43.5T800-272v32H160Z" />
            </Svg>
          </View>
        </View>

        {/* Separator and Description Section */}
        <View style={styles.cardBody}>
          <Text style={styles.bodyText}>
            {currentUser
              ? "Your data is secured and syncing normally across all your registered devices."
              : "You are currently scoring matches locally. To preserve your match history and access advanced statistics across devices, please sign in."}
          </Text>
        </View>
      </View>

      {/* Grid for Features/Info */}
      <View style={styles.grid}>
        {/* Cloud Sync Feature */}
        <View style={styles.gridItem}>
          <Svg width="24" height="24" viewBox="0 -960 960 960" fill="#ddb7ff">
            <Path d="M260-160q-91 0-155.5-63T40-377q0-78 47-139t123-74q25-83 95.5-136.5T472-780q111 0 191 74t87 184q70 9 120 59.5T920-342q0 73-51.5 124.5T744-160H260Z" />
          </Svg>
          <Text style={styles.gridLabel}>CLOUD SYNC</Text>
        </View>

        {/* Live Stats Feature */}
        <View style={styles.gridItem}>
          <Svg width="24" height="24" viewBox="0 -960 960 960" fill="#7fdaff">
            <Path d="M160-200v-320h160v320H160Zm240 0v-560h160v560H400Zm240 0v-400h160v400H640Z" />
          </Svg>
          <Text style={styles.gridLabel}>LIVE STATS</Text>
        </View>
      </View>

      <View style={styles.bottomActionContainer}>
        {currentUser ? (
          // Logged In Controls Block
          <View style={styles.buttonStack}>
            {/* Logout Trigger Card */}
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.secondaryActionButton,
                pressed && styles.buttonPressedActive,
              ]}
            >
              <Svg
                width="24"
                height="24"
                viewBox="0 -960 960 960"
                fill="#dae2fd"
              >
                <Path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
              </Svg>
              <Text style={styles.actionButtonText}>Logout</Text>
            </Pressable>

            {/* Simplified Solid Delete Account Button */}
            <Pressable
              onPress={handleDeleteAccount}
              style={({ pressed }) => [
                styles.dangerActionButton,
                pressed && styles.buttonPressedActive,
              ]}
            >
              <View style={styles.innerButtonContent}>
                <Text style={styles.dangerButtonIconText}>✕</Text>
                <Text style={styles.dangerButtonText}>Delete Account</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          // Guest Block Layout (Matches HTML specification directly)
          <View style={styles.fullWidthLayout}>
            <View style={styles.textGroup}>
              <Text style={styles.bodyText}>
                Sign in to sync your data to the cloud.
              </Text>
              {/* Soft decorative visual node element */}
              <View style={styles.dividerNode} />
            </View>

            {/* Gradient Visual Action Panel */}

            <Pressable
              onPress={() => setAuthVisible(true)}
              style={({ pressed }) => [
                styles.flatLoginButton,
                pressed && styles.buttonPressedActiveLogin,
              ]}
            >
              <View style={styles.innerButtonContent}>
                {/* Simple unicode character or text fallback instead of SVG icon */}
                <Text style={styles.buttonIconText}>➔</Text>
                <Text style={styles.gradientButtonText}>Login / Sign Up</Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      {/* ✅ Pass onSuccess to complete the deletion flow */}
      <AuthModal
        visible={authVisible}
        onClose={() => {
          setAuthVisible(false);
          setIsReauthForDeletion(false);
        }}
        onSuccess={() => {
          if (isReauthForDeletion && auth.currentUser) {
            executeDeletion(auth.currentUser);
            setIsReauthForDeletion(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0b1326" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: { marginTop: 40, marginBottom: 10 },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#fff",
    textAlign: "center",
  },
  selectorCard: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  emailText: { fontSize: 18, fontWeight: "700", color: "#333" },
  guestInfoText: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
    opacity: 0.9,
  },
  modalButton: {
    backgroundColor: "#c471ed",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteBtnExtra: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fff",
    marginTop: 10,
  },
  modalButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginVertical: 12,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 24, // Matches py-stack-lg
    backgroundColor: "#0b1326", // Matches theme background
  },
  backButton: {
    position: "absolute",
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4, // Matches gap-1
    paddingHorizontal: 12, // Matches px-3
    paddingVertical: 6, // Matches py-1.5
    borderRadius: 8, // Matches rounded-lg
    backgroundColor: "rgba(34, 42, 61, 0.5)", // Matches bg-surface-container-high/50
    borderWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.3)", // Matches border border-outline-variant/30
  },
  backButtonText: {
    fontFamily: "Plus Jakarta Sans", // Matches font-headline-md
    fontSize: 14, // Matches text-[14px]
    fontWeight: "600",
    color: "#7fdaff", // Matches text-primary
  },
  titleText: {
    fontFamily: "Plus Jakarta Sans", // Matches font-headline-lg-mobile
    fontSize: 24, // Matches text-headline-lg-mobile
    fontWeight: "700",
    color: "#dae2fd", // Matches text-on-surface
    textAlign: "center",
  },
  settingsButton: {
    position: "absolute",
    right: 0,
    width: 32, // Matches w-8
    height: 32, // Matches h-8
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16, // Matches rounded-full
    backgroundColor: "rgba(45, 52, 73, 0.3)", // Matches bg-surface-variant/30
  },
  buttonPressedActive: {
    opacity: 0.8, // Matches micro-interaction script
    transform: [{ scale: 0.95 }],
  },

  glassCard: {
    backgroundColor: "rgba(19, 27, 46, 0.7)", // Matches .glass-card background
    borderRadius: 12, // Matches rounded-xl
    padding: 24, // Matches p-6
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)", // Matches .glass-card border
    // Neon glow replication via shadow style
    shadowColor: "#7fdaff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
  },
  statusInfo: {
    flex: 1,
  },
  labelCaps: {
    fontFamily: "Geist", // Matches font-label-caps
    fontSize: 12, // Matches text-label-caps
    fontWeight: "600",
    color: "#bcc8cf", // Matches text-on-surface-variant
    opacity: 0.7, // Matches opacity-70
    letterSpacing: 0.96, // Matches letterSpacing: "0.08em"
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Matches gap-2
  },
  pulseDot: {
    width: 10, // Matches w-2.5
    height: 10, // Matches h-2.5
    borderRadius: 5,
    backgroundColor: "#ffb4ab", // Matches bg-error
  },
  pulseActive: {
    opacity: 0.8, // Fallback visual representation for web-animation-pulse
  },
  headlineMd: {
    fontFamily: "Plus Jakarta Sans", // Matches font-headline-md
    fontSize: 20, // Matches text-headline-md
    fontWeight: "600",
    color: "#dae2fd", // Matches text-on-surface
  },
  iconContainer: {
    width: 48, // Matches w-12
    height: 48, // Matches h-12
    borderRadius: 24, // Matches rounded-full
    backgroundColor: "#2d3449", // Matches bg-surface-container-highest
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    marginTop: 24, // Matches mt-6
    paddingTop: 24, // Matches pt-6
    borderTopWidth: 1,
    borderTopColor: "rgba(61, 73, 78, 0.2)", // Matches border-t border-outline-variant/20
  },
  bodyText: {
    fontFamily: "Hanken Grotesk", // Matches font-body-md
    fontSize: 16, // Matches text-body-md
    fontWeight: "400",
    color: "#bcc8cf", // Matches text-on-surface-variant
    lineHeight: 24, // Matches leading-relaxed / line-height token
  },
  grid: {
    flexDirection: "row",
    gap: 16, // Matches gap-4
    marginTop: 24, // Matches separation spacing
  },
  gridItem: {
    flex: 1,
    backgroundColor: "rgba(19, 27, 46, 0.7)", // Matches .glass-card background
    borderRadius: 12, // Matches rounded-xl
    padding: 16, // Matches p-4
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8, // Matches gap-2
  },
  gridLabel: {
    fontFamily: "Geist", // Matches font-label-caps
    fontSize: 10, // Matches text-[10px]
    fontWeight: "600",
    color: "#bcc8cf", // Matches text-on-surface-variant
    letterSpacing: 0.8,
  },
  fullWidthLayout: {
    width: "100%",
    alignItems: "center",
    gap: 24, // Matches gap-6
  },
  textGroup: {
    alignItems: "center",
    gap: 8, // Matches gap-2
  },
  bodyText: {
    fontFamily: "Hanken Grotesk", // Matches font-body-md
    fontSize: 16, // Matches text-body-md
    color: "rgba(188, 200, 207, 0.8)", // Matches text-on-surface-variant/80
    textAlign: "center",
  },
  dividerNode: {
    width: 48, // Matches w-12
    height: 2, // Matches h-0.5
    backgroundColor: "rgba(61, 73, 78, 0.3)", // Matches bg-outline-variant/30
    borderRadius: 9999, // Matches rounded-full
  },
  gradientButtonFrame: {
    width: "100%",
    height: 56, // Matches h-14
    borderRadius: 12, // Matches rounded-xl
    overflow: "hidden", // Contain gradient within rounded boundaries safely
    // Shadow system matching surface container tokens
    shadowColor: "#6f00be",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonStack: {
    width: "100%",
    gap: 12,
  },
  secondaryActionButton: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2d3449", // Matches surface-variant theme token
    borderWidth: 1,
    borderColor: "rgba(134, 147, 153, 0.2)",
  },
  actionButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "600",
    color: "#dae2fd", // Matches text-on-surface
  },
  dangerActionButton: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#93000a", // Matches error-container token
  },
  dangerButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "600",
    color: "#ffb4ab", // Matches text-error
  },
  bottomActionContainer: {
    marginTop: "auto", // Matches mt-auto
    paddingTop: 48, // Matches pt-12
    paddingBottom: 32, // Matches pb-8
    alignItems: "center",
    width: "100%",
  },
  flatLoginButton: {
    width: "100%",
    height: 56, // Matches h-14
    borderRadius: 12, // Matches rounded-xl
    backgroundColor: "#6f00be", // Uses the baseline brand color token from the theme
    justifyContent: "center",
    alignItems: "center",
    // Clean cross-platform shadow configuration
    shadowColor: "#6f00be",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  innerButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonIconText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
  },
  gradientButtonText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  buttonPressedActiveLogin: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  dangerButtonIconText: {
    fontSize: 16,
    color: "#ffb4ab", // Matches your error text token color
    fontWeight: "600",
  },
});
