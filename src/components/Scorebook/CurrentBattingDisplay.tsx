// src/components/Scorebook/CurrentBattingDisplay.tsx
"use client";
import { useMemo } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../../state/gameStore";
import { useMatchStore } from "../../state/matchStore";
import { useTeamStore } from "../../state/teamStore";
import { useFixtureStore } from "../../state/fixtureStore";
import { useIsLiveViewer } from "../../hooks/useIsLiveViewer";

export default function CurrentBattingDisplay() {
  const isLiveViewer = useIsLiveViewer();
  const battingTeamId = useGameStore((s) => s.currentGame?.battingTeamId);
  const allTeams = useTeamStore((s) => s.teams);
  const currentFixture = useFixtureStore((s) => s.currentFixture);

  // Get ball count to determine if we should show yet
  const legalBallsBowled = useMatchStore(
    (s) => s.events.filter((e) => e.countsAsBall).length,
  );

  // Determine the display name
  const teamName = useMemo(() => {
    //if (!currentFixture?.battingTeamId) return "Unknown Team";

    // 1. If viewing live, check the currentFixture object

    /*
    console.log(
      JSON.stringify(currentFixture.yourTeam?.id),
      " currentFixture.yourTeam?.id check here",
    );
    console.log(JSON.stringify(battingTeamId), " battingTeamId check here");
    console.log(
      JSON.stringify(currentFixture.battingTeamId),
      " currentFixture.battingTeamId check here",
    );

    console.log(
      JSON.stringify(currentFixture?.oppositionTeam?.id),
      " currentFixture.oppositionTeam?.id check here",
    );
    */

    if (isLiveViewer && currentFixture) {
      if (currentFixture.yourTeam?.id === currentFixture.battingTeamId) {
        return currentFixture.yourTeam.name;
      }
      if (currentFixture.oppositionTeam?.id === currentFixture.battingTeamId) {
        return currentFixture.oppositionTeam.name;
      }
    }

    // 2. Fallback to local team store (for Scorers)
    const team = allTeams.find((t) => t.id === battingTeamId);
    return team?.name || "Unknown Team";
  }, [isLiveViewer, battingTeamId, currentFixture, allTeams]);

  console.log(battingTeamId, "battingTeamId is what? now");

  // Hide if no team is active or no play has started
  if (!battingTeamId || legalBallsBowled === 0) {
    return null;
  }

  /*
  console.log(JSON.stringify(currentFixture), "i need to see this info.");
  console.log(
    JSON.stringify(currentFixture.bowlingTeamId),
    "i need to see this info bowlingTeamId.",
  );
  console.log(
    JSON.stringify(currentFixture.battingTeamId),
    "i need to see this info battingTeamId.",
  );
  */

  return (
    <View style={styles.badgeContainer}>
      {/* Web matching check_circle styling */}
      <MaterialIcons
        name="check-circle"
        size={14}
        color="#7fdaff" // text-primary color variable
        style={styles.iconShift}
      />
      <Text style={styles.bodyText}>
        Batting: <Text style={styles.boldTeamName}>{teamName}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // gap-2 (8px)
    backgroundColor: "#222a3d", // bg-surface-container-high
    paddingVertical: 8, // py-2
    paddingHorizontal: 16, // px-4
    borderRadius: 9999, // rounded-full
    borderWidth: 1,
    borderColor: "#3d494e", // border-outline-variant
    alignSelf: "center",
  },
  iconShift: {
    marginTop: 1,
  },
  bodyText: {
    fontFamily: "Hanken Grotesk", // body-md font variable definition
    fontSize: 16, // text-body-md
    fontWeight: "400",
    color: "#bcc8cf", // text-on-surface-variant
  },
  boldTeamName: {
    fontWeight: "700", // strong bold highlight
    color: "#dae2fd", // text-on-surface color variable
  },
});
