import { signOut } from "firebase/auth";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { auth } from "../../services/firebaseConfig";
import { useAuthStore } from "../../state/authStore";

export default function AccountScreen() {
  const setGuest = useAuthStore((s) => s.setGuest);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          setGuest(true); // ✅ mark user as guest after logout
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>

      <Text style={styles.email}>
        Logged in as: {auth.currentUser?.email ?? "Unknown"}
      </Text>

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  email: {
    marginBottom: 20,
  },
});
