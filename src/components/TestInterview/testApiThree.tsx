//imports
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import ChildCompOne from "./ChildCompOne";

//api
const API_URL = "http://www.tset.com";
//key - move to .env file later
const API_KEY = "abc123";

export default function TestApiThree() {
  const [data, setData] = useState<Post[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  interface Post {
    id: number;
    title: string;
    body: string;
    favourite: boolean;
  }

  const getData = async () => {
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${API_KEY}`,
        },
      });

      if (!response.ok) {
        //setError(true)
        //setErrorMessage('Network issue, please try again later')
        throw new Error("API network issue");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(true);
      setErrorMessage("Network issue, please try again later");
      console.error("api Issue", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  //useEffect to fetch data once on page load
  useEffect(() => {
    getData();
  }, []);

  const filterData = useMemo(() => {
    return data.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data, searchQuery]);

  const handlePress = useCallback((id: number) => {
    console.log("pressed!", id);
  }, []);

  //display error
  if (error) {
    return (
      <View>
        <Text>{errorMessage}</Text>
      </View>
    );
  }

  //display loading
  if (isLoading) {
    return (
      <View>
        <Text>loading, please wait...</Text>
      </View>
    );
  }

  const addFavourite = async ({ item }: { item: Post }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/${item.id}`, {
        method: "PATCH",
        headers: {
          Authorizatoin: `bearer ${API_KEY}`,
          "Content-Type": "applicatoin/json",
        },
        body: JSON.stringify({
          faviourite: true,
        }),
      });

      if (!response.ok) {
        throw new Error("netowrk issue saving to api");
      }

      const updatePost = data.map((p) =>
        p.id === item.id ? { ...p, favourite: true } : p,
      );

      setData(updatePost);
    } catch (err: any) {
      setError(true);
      setErrorMessage("cant save to databse, try again later");
      console.error("unable to patch to API", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  //redentItem
  const renderItem = ({ item }: { item: Post }) => {
    return (
      <View>
        <ChildCompOne id={item.id} body={item.body} handlePress={handlePress} />
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
        placeholder="Enter search..."
        style={styles.searchBar}
      />
      <FlatList
        data={filterData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text>No posts available</Text>}
      />
    </View>
  );
}

//styles
const styles = StyleSheet.create({
  list: { paddingTop: 20 },
  searchBar: { paddingHorizontal: 20 },
});
