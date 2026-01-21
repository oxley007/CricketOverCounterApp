// app/(drawer)/_layout.tsx
import { StyleSheet, View, Image, Platform } from "react-native";
import { Drawer } from "expo-router/drawer";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function DrawerLayout() {
  return Platform.OS === "android" ? (
    <SafeAreaProvider>
      <View style={{ flex: 1, padding: 0 }}>
        <DrawerContent />
      </View>
    </SafeAreaProvider>
  ) : (
    <View style={{ flex: 1 }}>
      <DrawerContent />
    </View>
  );
}

function DrawerContent() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerTitle: () => (
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/4dot6logo-transparent-old.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        ),
        headerLeft: () => <DrawerToggleButton />,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "#12c2e9",
          shadowOpacity: 0,
          shadowColor: "transparent",
          elevation: 0,
        },
        drawerActiveTintColor: "#FF7043",
        drawerInactiveTintColor: "#333",
      }}
      defaultStatus="closed"
      useLegacyImplementation
      headerMode="screen"
      unstable_settings={{
        initialRouteName: "index",
        hideDevTools: true,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="upgrade"
        options={{
          title: "Upgrade to Pro",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    alignItems: "center", // centers the logo horizontally
    justifyContent: "center",
  },
  logo: {
    width: 120,  // adjust size as needed
    height: 40,
  },
});
