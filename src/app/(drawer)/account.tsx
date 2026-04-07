import { useNavigation } from "@react-navigation/native";
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

      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Account</Text>
      <View style={styles.separator} />

      <View style={styles.selectorCard}>
        <Text style={styles.sectionHeader}>
          {currentUser ? "Logged in as:" : "Status:"}
        </Text>
        <Text style={styles.emailText}>{getUserDisplayLabel()}</Text>
      </View>

      <View style={styles.separator} />

      <View style={{ marginTop: "auto", marginBottom: 40 }}>
        {currentUser ? (
          <>
            <Pressable style={styles.modalButton} onPress={handleLogout}>
              <Text style={styles.modalButtonText}>Logout</Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.deleteBtnExtra]}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.modalButtonText}>Delete Account</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.guestInfoText}>
              Sign in to sync your data to the cloud.
            </Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setAuthVisible(true)}
            >
              <Text style={styles.modalButtonText}>Login / Sign Up</Text>
            </Pressable>
          </>
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
  container: { flex: 1, padding: 16, backgroundColor: "#12c2e9" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: { marginTop: 40, marginBottom: 10 },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  backButtonText: { color: "#fff", fontWeight: "600" },
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
});
