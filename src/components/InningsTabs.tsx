import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
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
    <View style={{ flex: 1, minHeight: 200 }}>
      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {innings.map((inn, index) => (
          <TouchableOpacity
            key={`${inn.inningsNumber}-${index}`}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => setActiveTab(index)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.activeTabText,
              ]}
            >
              Innings {inn.inningsNumber ?? index + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Scorecards */}
      <FlatList
        data={[]} // Keep empty since we are using header/footer for the layout
        renderItem={null}
        style={{ marginTop: 12 }}
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
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#eee",
    marginRight: 6,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#2196F3",
  },
  tabText: {
    fontSize: 14,
  },
  activeTabText: {
    color: "white",
    fontWeight: "600",
  },
});
