import { useNavigation } from "@react-navigation/native"; // Import navigation
import { signOut } from "firebase/auth";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { auth } from "../../services/firebaseConfig";
import { useAuthStore } from "../../state/authStore";

export default function AccountScreen() {
  const setGuest = useAuthStore((s) => s.setGuest);
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          setGuest(true);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* HEADER / BACK BUTTON */}
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

      {/* USER INFO CARD */}
      <View style={styles.selectorCard}>
        <Text style={styles.sectionHeader}>Logged in as:</Text>
        <Text style={styles.emailText}>
          {auth.currentUser?.email ?? "Unknown User"}
        </Text>
      </View>

      <View style={styles.separator} />

      {/* LOGOUT BUTTON */}
      <Pressable style={styles.modalButton} onPress={handleLogout}>
        <Text style={styles.modalButtonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#12c2e9",
  },
  headerRow: {
    marginTop: 40, // Adjust based on your status bar height
    marginBottom: 10,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#fff",
    textAlign: "center",
    letterSpacing: 1.2,
  },
  selectorCard: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  modalButton: {
    backgroundColor: "#c471ed",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto", // Pushes button to bottom
    marginBottom: 30,
    elevation: 3,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginVertical: 12,
    borderRadius: 2,
  },
});
