// app/scorebook/indexScorebook.tsx
import React from "react";
import { View, Text } from "react-native";
import GameSetupModal from "../../../components/Scorebook/GameSetupModal";

export default function ScorebookIndex() {
  return (
    <View style={{ flex: 1 }}>
      <GameSetupModal />
    </View>
  );
}
