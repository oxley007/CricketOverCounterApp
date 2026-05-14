import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMatchStore } from "../state/matchStore";

export default function BallCounterFixtureCard({
  fixture,
  isFreeFixture,
  onUpgradePress,
}: any) {
  //const innings = Object.values(fixture.innings || {});

  const wideIsExtraBall = useMatchStore((s) => s.wideIsExtraBall);

  const wideExtraBallThreshold = useMatchStore((s) => s.wideExtraBallThreshold);

  const subscriptions = useMatchStore((s) => s.proUnlocked);
  const hasAnyPro = subscriptions?.ballPro || subscriptions?.scorebookPro;

  const yourTeam = fixture.yourTeam?.name ?? "Your Team";
  const oppTeam = fixture.oppositionTeam?.name ?? "Opponent";

  const date = fixture.date
    ? new Date(fixture.date).toLocaleDateString()
    : "Unknown date";

  const getOversDisplay = (events: any[]) => {
    let totalLegalBalls = 0;
    let widesThisOver = 0;

    for (let x = 0; x < events.length; x++) {
      const e = events[x];

      if (!e) continue;

      const isWide = e.extraType === "wide";

      const wideCountsAsLegal =
        wideExtraBallThreshold > 0
          ? widesThisOver >= wideExtraBallThreshold
          : !wideIsExtraBall;

      const countsAsLegal = e.countsAsBall || (isWide && wideCountsAsLegal);

      if (countsAsLegal) {
        totalLegalBalls++;

        if (totalLegalBalls % 6 === 0) {
          widesThisOver = 0;
        }
      }

      if (isWide) {
        widesThisOver++;
      }
    }

    const completedOvers = Math.floor(totalLegalBalls / 6);
    const ballsIntoOver = totalLegalBalls % 6;

    return ballsIntoOver === 0 && totalLegalBalls > 0
      ? `${completedOvers}.0`
      : `${completedOvers}.${ballsIntoOver}`;
  };

  const result = fixture.result;

  let resultText = "No result";

  if (result) {
    if (result.type === "abandoned") {
      resultText = "Match abandoned";
    } else if (result.isDraw) {
      resultText = result.margin ?? "Match drawn";
    } else if (result.winnerTeamId) {
      const winnerName =
        result.winnerTeamId === fixture.yourTeam.id ? yourTeam : oppTeam;

      resultText = `${winnerName} ${result.margin?.toLowerCase()}`;
    }
  }

  const sortedInnings = Object.values(fixture.innings || {})
    .filter((i: any) => !i.isPlaceholder)
    .sort((a: any, b: any) => {
      // inningsNumber is the ONLY reliable ordering inside a match
      return (a.inningsNumber ?? 0) - (b.inningsNumber ?? 0);
    });

  const inningsSummary = sortedInnings.map((i: any) => {
    const battingTeamName =
      i.battingTeamId === fixture.yourTeam?.id ? yourTeam : oppTeam;

    const overs = getOversDisplay(i.matchEvents || []);

    return `${battingTeamName} ${i.totalRuns}/${i.totalWickets} (${overs})`;
  });

  return (
    <View style={styles.card}>
      <Text style={styles.date}>{date}</Text>

      <Text style={styles.opponent}>vs {oppTeam}</Text>

      {hasAnyPro || isFreeFixture ? (
        <>
          <View style={styles.scoreBlock}>
            {inningsSummary.map((line: string, i: number) => (
              <Text key={i} style={styles.scoreLine}>
                {line}
              </Text>
            ))}
          </View>

          <Text style={styles.result}>{resultText}</Text>
        </>
      ) : (
        <Pressable style={styles.upgradeButton} onPress={onUpgradePress}>
          <Text style={styles.upgradeButtonText}>
            Upgrade to Pro to see innings scores and result
          </Text>
        </Pressable>
      )}

      <Text style={styles.ballCounterLabel}>Ball Counter Match</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    opacity: 0.9,
  },

  date: {
    fontSize: 14,
    color: "#666",
  },

  opponent: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 8,
  },

  scoreBlock: {
    marginBottom: 8,
  },

  scoreLine: {
    fontSize: 16,
    marginBottom: 2,
  },

  ballCounterLabel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  result: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
  },
  upgradeButton: {
    backgroundColor: "#c471ed",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },

  upgradeButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
});
