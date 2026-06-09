import { Link } from "expo-router";
import {
  StyleSheet,
  Text as ThemedText,
  View as ThemedView,
} from "react-native";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Replaced type="title" with an explicit style property */}
      <ThemedText style={styles.title}>This is a modal</ThemedText>

      <Link href="/" dismissTo style={styles.link}>
        {/* Replaced type="link" with an explicit style property */}
        <ThemedText style={styles.linkText}>Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff", // Clear fallback background color
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000", // Clear dark text contrast color
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: "#2e78b7", // Clean standard interactive hyperlink blue
  },
});
