//imports
import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { FlatList, RefreshControl } from "react-native-gesture-handler";
import { TextInput } from "react-native-paper";

//api_url
const API_URL = "https://api.test.com";
//api_key (usually in .env)
const API_KEY = "abc123";

interface Post {
  id: number;
  title: string;
  body: string;
}

export default function TestApiFive() {
  const [data, setData] = useState([]);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const getData = async (pageNumber: number) => {
    try {
      //set loading to true
      if (pageNumber === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(`${API_URL}?page=${pageNumber}&limit=10`, {
        method: "GET",
        headers: {
          Athorization: `bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      //handle erra in data
      if (!response.ok) {
        throw new Error("network not availabel");
      }

      //get json data
      const json = await response.json();

      //setDate()
      setData((prevData) => {
        if (pageNumber === 1) {
          return json;
        } else {
          return [...prevData, ...json];
        }
      });
      setPage(pageNumber);
    } catch (err: any) {
      console.error("get posts api error", err.message);
      setError(true);
      setErrorMessage("Netowrk error, ples etry agian latert");
      //Sentry.captureException(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  //useEffect to call API
  useEffect(() => {
    getData(1);
  }, []);

  //error UI
  if (error) {
    return (
      <View>
        <Text>{errorMessage}</Text>
      </View>
    );
  }

  //loading UI
  if (isLoading) {
    return (
      <View>
        <Text>Loading Posts, please wait....</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <View>
        <TextInput
          onChangeText={setSearchQuery}
          value={searchQuery}
          placeholder="Enter title"
          numberOfLines={10}
        />
        <Text>{item.title}</Text>
        <Text>{item.body}</Text>
      </View>
    );
  };

  return (
    <View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text>no posts</Text>}
        contentContainerStyle={styles.list}
        onEndReached={() => getData(page + 1)}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingMore}
            onRefresh={() => getData(1)}
          />
        }
      />
    </View>
  );
}

//styles
const styles = StyleSheet.create({
  list: { padding: 20 },
});
