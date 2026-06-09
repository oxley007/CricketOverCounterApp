import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { FlatList } from "react-native-gesture-handler";

const API_URL = "http:testapi.com";

interface Post {
  id: number;
  title: string;
  body: string;
}

//interface Post

export default function TestApiTwo() {
  //state
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Post[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getData = async () => {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        setErrorMessage("Network issue");
        throw new Error("network isse from API");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setErrorMessage("error please try again later");
      setError(true);
      console.error("error in getDate", err);
    } finally {
      setIsLoading(false);
    }
  };

  //useEffect
  useEffect(() => {
    getData();
  }, []);

  const filterData = useMemo(() => {
    const filteredData = data.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return filteredData;
  }, [data, searchQuery]);

  if (error) {
    return <Text>{errorMessage}</Text>;
  }

  if (isLoading) {
    return <Text>loading, please wait...</Text>;
  }

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <View>
        <Text>{item.title}</Text>
        <Text>{item.body}</Text>
      </View>
    );
  };

  //return
  return (
    <View>
      <TextInput
        placeholder="Search posts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.input}
      />
      <FlatList
        data={filterData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text>no posts available</Text>}
      />
    </View>
  );
}

//styles
const styles = StyleSheet.create({
  list: { paddingBottom: 20, paddingTop: 20 },
  input: { paddingBottom: 20, paddingTop: 20 },
});
