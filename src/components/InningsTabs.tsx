import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Pressable,
} from "react-native";

import type { Fixture, InningsSnapshot } from "../state/fixtureStore";
import { useMatchStore, type MatchEvent } from "../state/matchStore";
import BowlerScorecard from "./Scorebook/BowlerScorecard";
import Scorecard from "./Scorebook/Scorecard";

type InningsTabsProps = {
  /** Fixture to show (current or completed). When undefined, shows one tab with live match events. */
  fixture?: Fixture | null;
};

export default function InningsTabs({ fixture }: InningsTabsProps) {
  const liveEvents = useMatchStore((s) => s.events);
  const [activeTab, setActiveTab] = useState(0);

  //console.log("---- DEBUG INNINGS ----");
  //console.log("fixture.innings:", JSON.stringify(fixture?.innings, null, 2));
  //console.log("fixture.innings.length:", fixture?.innings?.length);
  //console.log("liveEvents.length:", liveEvents?.length);

  // Build innings list: from fixture when present, else single tab with live events
  const inningsArray: InningsSnapshot[] = fixture?.innings
    ? Array.isArray(fixture.innings)
      ? fixture.innings
      : Object.values(fixture.innings)
    : [];

  const innings: (InningsSnapshot & { matchEvents?: MatchEvent[] })[] =
    inningsArray.length
      ? inningsArray.sort((a, b) => a.inningsNumber - b.inningsNumber)
      : [
          {
            inningsNumber: 1,
            matchEvents: liveEvents,
          } as any,
        ];

  //console.log("final innings array:", JSON.stringify(innings, null, 2));
  //console.log("innings.length:", innings.length);

  // Which innings index is "current" (empty matchEvents → use live from matchStore)
  const currentInningsIndex = innings.findIndex((inn) => inn.isPlaceholder);

  console.log("currentInningsIndex:", currentInningsIndex);

  const getEventsForInnings = (index: number): MatchEvent[] => {
    const inn = innings[index];
    if (!inn) return [];

    // ✅ Current innings → always use live events
    if (inn.isPlaceholder) return liveEvents;

    // ✅ Completed innings → use snapshot
    if (inn.matchEvents?.length) return inn.matchEvents;

    return [];
  };

  const getSnapshotForInnings = (
    index: number,
  ): InningsSnapshot | undefined => {
    const inn = innings[index];
    if (!inn || !inn.battingTeamId) return undefined;
    return inn as InningsSnapshot;
  };

  const events = getEventsForInnings(activeTab);
  const snapshot = getSnapshotForInnings(activeTab);

  return (
    <View style={styles.container}>
      {/* Tabs Container */}
      <View style={styles.tabsContainer}>
        {innings.map((inn, index) => {
          const isActive = activeTab === index;
          return (
            <Pressable
              key={`${inn.inningsNumber}-${index}`}
              style={[
                styles.tab,
                isActive ? styles.activeTab : styles.inactiveTab,
              ]}
              onPress={() => setActiveTab(index)}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.activeTabText : styles.inactiveTabText,
                ]}
              >
                Innings {inn.inningsNumber ?? index + 1}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Scorecards */}
      <FlatList
        data={[]}
        renderItem={null}
        style={styles.list}
        ListHeaderComponent={
          <>
            <Scorecard
              events={events}
              inningsSnapshot={
                snapshot?.battingEntries?.length ? snapshot : undefined
              }
            />
            <BowlerScorecard events={events} inningsSnapshot={snapshot} />
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  tabsContainer: {
    flexDirection: "row",
    alignSelf: "flex-start", // Mimics inline-flex behaviour
    padding: 4, // Maps to p-1 (1 * 4px)
    borderRadius: 12, // Maps to rounded-xl (0.75rem = 12px)
    // Glass Card styles from your CSS configuration
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
  },
  tab: {
    paddingHorizontal: 16, // Maps to px-4 (4 * 4px = 16px)
    paddingVertical: 8, // Maps to py-2 (2 * 4px = 8px)
    borderRadius: 8, // Maps to rounded-lg (0.5rem = 8px)
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#00c2f3", // Maps to bg-primary-container
    // Simple native shadow configuration mapping to shadow-sm
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontFamily: "Geist", // Maps to font-label-caps
    fontSize: 12, // Maps to text-label-caps
    lineHeight: 16,
    letterSpacing: 0.96, // 12px * 0.08em
    fontWeight: "600",
    textTransform: "uppercase", // Maps to uppercase
  },
  activeTabText: {
    color: "#004c61", // Maps to text-on-primary-container
  },
  inactiveTabText: {
    color: "#bcc8cf", // Maps to text-on-surface-variant
  },
  list: {
    marginTop: 12,
  },
});
