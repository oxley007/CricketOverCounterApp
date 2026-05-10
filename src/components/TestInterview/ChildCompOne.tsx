import React from "react";
import { Text, View, TouchableOpacity } from "react-native";

interface ChildOneProps {
  body: string;
  id: number;
  handlePress: (id: number) => void;
}

export default function ChildOne({ body, id, handlePress }: ChildOneProps) {
  return (
    <View>
      <TouchableOpacity onPress={() => handlePress(id)}>
        <Text>Tap me!</Text>
      </TouchableOpacity>
      <Text>{body}</Text>
    </View>
  );
}
