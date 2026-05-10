import React, { useEffect, useState, useMemo } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
// Note: Stick to 'react-native' for FlatList/TouchableOpacity to avoid gesture bugs
import { ActivityIndicator, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

interface Post {
  id: number;
  title: string;
  body: string;
  isRead: boolean;
}

const API_URL = "https://typicode.com";

export default function ApiApp() {
  const [data, setData] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | false>(false); // Can be false or a string message
  const [searchQuery, setSearchQuery] = useState("");

  const getPosts = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("Something went wrong with the network");
      }
      const json = await response.json();
      // Map through the initial data to ensure 'isRead' exists on all items
      const initialData = json.map((item: any) => ({ ...item, isRead: false }));
      setData(initialData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  const filterData = useMemo(() => {
    return data.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data, searchQuery]);

  const handlePress = (id: number) => {
    // FIX: Use '===' for comparison
    const selectedPost = data.find((p) => p.id === id);
    alert(`you are reading ${selectedPost?.title}`);

    // FIX: map to update state correctly
    const updateData = data.map((p) =>
      p.id === id ? { ...p, isRead: true } : p,
    );
    setData(updateData);
  };

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <TouchableOpacity
        onPress={() => handlePress(item.id)}
        style={styles.card}
      >
        <View>
          {/* Added bold for title so it looks professional */}
          <Text style={{ fontWeight: "bold" }}>
            {item.title} {item.isRead ? "(Read)" : ""}
          </Text>
          {/* FIX: Use {item.body} to show the variable content */}
          <Text>{item.body}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Please wait</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        {/* No ActivityIndicator here, just the error message */}
        <Text style={{ color: "red" }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* FIX: onChangeText={setSearchQuery} uses curly braces */}
      <TextInput
        placeholder="Search posts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
      />
      <FlatList
        data={filterData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.centerText}>No posts found.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 20 },
  searchBar: { margin: 10 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerText: { textAlign: "center", marginTop: 20 },
  card: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "white",
  },
});
