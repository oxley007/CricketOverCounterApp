import { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet, Alert } from "react-native";
import {
  configureRevenueCat,
  getOfferings,
  isRevenueCatAvailable,
  purchasePackage,
  getCustomerInfo,
} from "../services/revenuecat";

type Package = {
  identifier: string;
  product: {
    priceString: string;
    title?: string;
    description?: string;
  };
};

export default function DebugRevenueCat() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [available, setAvailable] = useState(isRevenueCatAvailable());
  const [customerInfo, setCustomerInfo] = useState<any>(null);

  const fetchOfferings = async () => {
    if (!isRevenueCatAvailable()) {
      // fallback for Expo Go
      const mockPackages: Package[] = [
        {
          identifier: "monthly",
          product: { priceString: "$4.99", title: "Monthly Plan", description: "Test monthly subscription" },
        },
        {
          identifier: "yearly",
          product: { priceString: "$49.99", title: "Yearly Plan", description: "Test yearly subscription" },
        },
      ];
      setPackages(mockPackages);
      return;
    }

    try {
      const offerings: any = await getOfferings();
      const pkgs: Package[] = offerings?.current?.availablePackages || [];
      setPackages(pkgs);

      // log for debugging
      console.log("Real offerings:", offerings);
    } catch (err) {
      console.error("Error fetching offerings:", err);
    }
  };

  const handlePurchase = async (pkg: any) => {
    try {
      const purchase = await purchasePackage(pkg);
      console.log("Purchase result:", purchase);

      const info = await getCustomerInfo();
      setCustomerInfo(info);

      Alert.alert("Purchase success", JSON.stringify(info, null, 2));
    } catch (err: any) {
      console.error("Purchase error:", err);
      Alert.alert("Purchase error", err.message || "Unknown error");
    }
  };

  useEffect(() => {
    // configure RevenueCat once
    configureRevenueCat();
    setAvailable(isRevenueCatAvailable());

    // fetch offerings
    fetchOfferings();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RevenueCat available: {String(available)}</Text>
      <Button title="Refresh Offerings" onPress={fetchOfferings} />

      <FlatList
        data={packages}
        keyExtractor={(item) => item.identifier}
        renderItem={({ item }) => (
          <View style={styles.package}>
            <Text style={styles.pkgTitle}>
              {item.product.title} ({item.identifier})
            </Text>
            <Text>{item.product.priceString}</Text>
            {item.product.description ? <Text>{item.product.description}</Text> : null}
            {isRevenueCatAvailable() && (
              <Button title="Purchase" onPress={() => handlePurchase(item)} />
            )}
          </View>
        )}
      />

      {customerInfo && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "700" }}>Customer Info:</Text>
          <Text>{JSON.stringify(customerInfo, null, 2)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  package: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 5,
    borderRadius: 8,
  },
  pkgTitle: { fontWeight: "600" },
});
