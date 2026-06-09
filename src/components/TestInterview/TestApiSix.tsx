//imports

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

//API_URL
const API_KEY = "https://api.test.com";
//API_KEY
const API_URL = "abc123";

interface Post {
  id: number;
  title: string;
  body: string;
  favourite: boolean;
}

export default function TestApiSix() {
  const [data, setData] = useState<Post[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingRefresh, setIsLoadingRefresh] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  const getData = async (pageNumber: number) => {
    try {
      if (pageNumber === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingRefresh(true);
      }

      const response = await fetch(`${API_URL}?page=${pageNumber}&limit=10`, {
        method: "GET",
        headers: {
          authorization: `bearer ${API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error("netowerk issue getting api posts");
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
      setErrorMessage("Unable to get posts, please try agian later...");
      //senty.sendError(err.message)
      console.error("get api for post not working", err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingRefresh(false);
    }
  };

  //useEffect
  useEffect(() => {
    getData(1);
  }, []);

  //error
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
        <ActivityIndicator />
        <Text>Loading, please wait....</Text>
      </View>
    );
  }

  const addFavourite = async ({ item }: { item: Post }) => {
    const response = await fetch(`${API_KEY}/post/${item.id}`, {
      method: "PATCH",
      headers: {
        authorization: `bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        favourite: true,
      }),
    });

    if (!response.ok) {
      throw new Error("cant patch favourite to API");
    }

    const json = await response.json();

    const updatedData = data.map((p) =>
      p.id === item.id ? { ...json, favourite: true } : p,
    );

    setData(updatedData);
  };

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <View>
        <TouchableOpacity onPress={() => addFavourite({ item })} />
        {item.favourite && <Text>Favourite!</Text>}
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
            refreshing={isLoadingRefresh}
            onRefresh={() => getData(1)}
          />
        }
      />
    </View>
  );
}

//styles
const styles = StyleSheet.create({
  list: { paddingTop: 20 },
});
