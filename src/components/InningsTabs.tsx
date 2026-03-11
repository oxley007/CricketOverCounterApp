import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BowlerScorecard from "./Scorebook/BowlerScorecard";
import Scorecard from "./Scorebook/Scorecard";
import type { Fixture, InningsSnapshot } from "../state/fixtureStore";
import { useMatchStore, type MatchEvent } from "../state/matchStore";

type InningsTabsProps = {
  /** Fixture to show (current or completed). When undefined, shows one tab with live match events. */
  fixture?: Fixture | null;
};

export default function InningsTabs({ fixture }: InningsTabsProps) {
  const liveEvents = useMatchStore((s) => s.events);
  const [activeTab, setActiveTab] = useState(0);

  // Build innings list: from fixture when present, else single tab with live events
  const innings: (InningsSnapshot & { matchEvents?: MatchEvent[] })[] =
    fixture?.innings?.length
      ? [...fixture.innings].sort((a, b) => a.inningsNumber - b.inningsNumber)
      : [{ inningsNumber: 1, matchEvents: liveEvents } as InningsSnapshot & { matchEvents: MatchEvent[] }];

  // Which innings index is "current" (empty matchEvents → use live from matchStore)
  const currentInningsIndex = innings.findIndex(
    (inn) => !inn.matchEvents || inn.matchEvents.length === 0,
  );

  const getEventsForInnings = (index: number): MatchEvent[] => {
    const inn = innings[index];
    if (!inn) return [];
    if (inn.matchEvents && inn.matchEvents.length > 0) return inn.matchEvents;
    if (index === currentInningsIndex) return liveEvents;
    return [];
  };

  const getSnapshotForInnings = (index: number): InningsSnapshot | undefined => {
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
            style={[
              styles.tab,
              activeTab === index && styles.activeTab,
            ]}
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
      <ScrollView style={{ marginTop: 12 }}>
        <Scorecard
          events={events}
          inningsSnapshot={snapshot?.battingEntries?.length ? snapshot : undefined}
        />
        <BowlerScorecard events={events} inningsSnapshot={snapshot} />
      </ScrollView>
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
