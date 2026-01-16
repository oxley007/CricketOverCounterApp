// app/(drawer)/_layout.tsx
import { StyleSheet, View, Image, Platform } from "react-native";
import { Drawer } from "expo-router/drawer";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function DrawerLayout() {
  const Wrapper = Platform.OS === "android" ? SafeAreaProvider : View;

  return (
    <Wrapper style={{ flex: 1 }}> {/* SafeAreaProvider only on Android */}
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
            backgroundColor: "#12c2e9", // header BG
            shadowOpacity: 0,            // remove iOS shadow
            shadowColor: "transparent",  // ensure no iOS shadow color
            elevation: 0,                // remove Android shadow
          },
          drawerActiveTintColor: "#FF7043",
          drawerInactiveTintColor: "#333",
        }}
        defaultStatus="closed"
        useLegacyImplementation={true}
        headerMode="screen"
        unstable_settings={{
          initialRouteName: "index",
          hideDevTools: true,
        }}
      >
        {/* Screens in the drawer */}
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
    </Wrapper>
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
