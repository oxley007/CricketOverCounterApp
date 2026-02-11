// src/components/Scorebook/BattingTeamSelector.tsx
"use client";

import { Pressable, Text, View } from "react-native";
import type { Team } from "../../state/teamStore";

interface BattingTeamSelectorProps {
  allTeams: Team[];
  selectedBattingTeamId: string | null;
  bowlingTeamId: string | null;
  legalBallsBowled: number;
  onSelectTeam: (battingTeamId: string, bowlingTeamId: string) => void;
  onReset: () => void;
}

export default function BattingTeamSelector({
  allTeams,
  selectedBattingTeamId,
  bowlingTeamId,
  legalBallsBowled,
  onSelectTeam,
  onReset,
}: BattingTeamSelectorProps) {
  // 👇 SHOW TEAM CHOICE
  if (!selectedBattingTeamId) {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontWeight: "600", marginBottom: 6 }}>
          Select Batting Team:
        </Text>

        {allTeams.map((team) => (
          <Pressable
            key={team.id}
            onPress={() => {
              // Automatically set bowling team to the other team
              const otherTeam = allTeams.find((t) => t.id !== team.id);
              onSelectTeam(team.id, otherTeam?.id ?? "");
            }}
            style={{
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#f0f0f0",
              marginBottom: 6,
            }}
          >
            <Text>{team.name}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  // 👇 SHOW SELECTED TEAM
  if (legalBallsBowled === 0) {
    const team = allTeams.find((t) => t.id === selectedBattingTeamId);
    const bowlingTeam = allTeams.find((t) => t.id === bowlingTeamId);

    return (
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
        <Text style={{ fontWeight: "600" }}>{team?.name} batting first</Text>

        <Pressable onPress={onReset} style={{ marginLeft: 8 }}>
          <Text style={{ color: "#666", fontWeight: "600" }}>(change)</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}
