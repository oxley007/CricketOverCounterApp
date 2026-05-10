//imports
import React, { useState, useEffect, useMemo } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { FlatList, RefreshControl } from "react-native-gesture-handler";
import { TextInput } from "react-native-paper";

//API_URL
const API_URL = "http://api.test.com";
//API_KEY - moce this into .env file for security
const API_KEY = "abc123";

//Types
interface Post {
  id: number;
  title: string;
  body: string;
}

export default function TestApiFour() {
  //state
  const [data, setData] = useState<Post[]>([]);
  const [page, setPage] = useState<number>(1);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  //move into /services file
  const getData = async (pageNumber: number) => {
    try {
      if (pageNumber === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(`${API_URL}?page=${pageNumber}&limit=10`, {
        method: "GET",
        headers: {
          Authorization: `bearer ${API_KEY}`,
          "Content-Type": "Application/JSON",
        },
      });

      if (!response.ok) {
        throw new Error("Network issue");
      }

      const json = await response.json();

      setData((prevData) => {
        if (pageNumber === 1) {
          return json;
        } else {
          return [...prevData, ...json];
        }
      });
      setPage(pageNumber);
    } catch (err: any) {
      setError(true);
      setErrorMessage("Network error, please try again later...");
      console.error("api GET error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getData(1);
  }, []);

  const filterData = useMemo(() => {
    return data.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data, searchQuery]);

  //display error UI
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
        <Text>Loading, please wait...</Text>
      </View>
    );
  }

  const addFavourite = async ({ item }: { item: Post }) => {
    //update api firsy
    setIsLoading(true);
    try {
      const repsonse = await fetch(API_URL, {
        method: "PATCH",
        headers: {
          Authorization: `beaer ${API_KEY}`,
          "Method-Type": "application/JSON",
        },
        body: JSON.stringify({
          favourite: true,
        }),
      });

      if (!repsonse.ok) {
        throw new Error("network issue with post");
      }

      const updateFav = data.map((p) =>
        p.id === item.id ? { ...item, favourite: true } : p,
      );
      setData(updateFav);
    } catch (err: any) {
      //setError(true)
      setErrorMessage("issue updating favourites, try again later");
      console.error("issue posting favourties", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <View>
        <TouchableOpacity onPress={() => addFavourite({ item })} />
        <Text>{item.title}</Text>
        <Text>{item.body}</Text>
      </View>
    );
  };

  return (
    <View>
      <TextInput
        onChangeText={setSearchQuery}
        value={searchQuery}
        placeholder="Search articles..."
        style={styles.searchButton}
      />
      <FlatList
        data={filterData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No posts</Text>}
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
  list: { justifyContent: "center" },
  searchButton: { paddingHorizontal: 20 },
});
