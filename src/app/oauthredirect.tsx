import { ActivityIndicator, View } from "react-native";

export default function OAuthRedirect() {
  // This screen is just a placeholder.
  // Your AuthModal's useEffect will detect the 'success' and close the modal.
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#4285F4" />
    </View>
  );
}
