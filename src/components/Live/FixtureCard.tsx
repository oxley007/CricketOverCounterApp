import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import ResumeButton from "./LiveGameButton";

type Props = {
  fixture: any;
};

export default function FixtureCard({ fixture }: Props) {
  // Define isLive logic from data parameters to prevent runtime crashes
  const isLive = !fixture.completed;

  return (
    <View style={styles.card}>
      {/* Upper Layout Block */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          {isLive && (
            <View style={styles.statusIndicatorRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>Live / In Progress</Text>
            </View>
          )}
          {!isLive && (
            <View style={styles.statusIndicatorRow}>
              <Text style={[styles.statusText, styles.completedText]}>
                Completed
              </Text>
            </View>
          )}
          <Text style={styles.title}>
            {fixture.yourTeam?.name || "Home Team"} vs{" "}
            {fixture.oppositionTeam?.name || "Away Team"}
          </Text>
        </View>

        {/* Feature Tier Badge */}
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      </View>

      {/* Meta Statistics Segment */}
      <View style={styles.metaContainer}>
        {/* Season & Overs Row */}
        <View style={styles.metaRow}>
          <Text style={styles.iconText}>event</Text>
          <Text style={styles.metaText}>
            Season {fixture.season} • Total Overs {fixture.overs}
          </Text>
        </View>

        {/* Timestamp Row */}
        <View style={styles.metaRow}>
          <Text style={styles.iconText}>schedule</Text>
          <Text style={styles.metaText}>
            {new Date(fixture.date).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Primary Action Button (Using imported ResumeButton for active matches) */}
      {isLive ? (
        <ResumeButton teamId={fixture.yourTeam?.id} />
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.completedActionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => {
            /* Handle viewing historical complete stats */
          }}
        >
          <Text style={[styles.buttonIconText, styles.completedButtonText]}>
            scoreboard
          </Text>
          <Text style={[styles.actionButtonText, styles.completedButtonText]}>
            View Match Summary
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#131b2e", // bg-surface-container-low
    borderWidth: 1,
    borderColor: "rgba(61, 73, 78, 0.3)", // border-outline-variant/30
    borderRadius: 24, // rounded-2xl
    padding: 24, // p-6
    marginBottom: 16,
    marginTop: 16,

    // Web shadow-md translation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16, // mb-4
  },
  titleColumn: {
    flexDirection: "column",
    flex: 1,
    paddingRight: 12,
  },
  statusIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // mb-1
  },
  pulseDot: {
    width: 8, // w-2
    height: 8, // h-2
    borderRadius: 4, // rounded-full
    backgroundColor: "#7fdaff", // bg-primary
    marginRight: 8, // gap-2
  },
  statusText: {
    fontFamily: "Geist", // font-label-caps
    fontSize: 12, // text-label-caps
    fontWeight: "600",
    letterSpacing: 0.96, // 0.08em
    color: "#7fdaff", // text-primary
  },
  completedText: {
    color: "#bcc8cf", // fallback muted grey text for finished fixtures
  },
  title: {
    fontFamily: "Plus Jakarta Sans", // font-headline-md
    fontSize: 20, // text-headline-md
    fontWeight: "600",
    color: "#dae2fd", // text-on-surface
    lineHeight: 28,
  },
  proBadge: {
    backgroundColor: "#2d3449", // bg-surface-variant
    paddingHorizontal: 8, // px-2
    paddingVertical: 4, // py-1
    borderRadius: 4, // rounded
  },
  proBadgeText: {
    fontFamily: "Geist", // font-mono-stats
    fontSize: 10, // text-[10px]
    fontWeight: "500",
    color: "#bcc8cf", // text-on-surface-variant
    textTransform: "uppercase", // uppercase
  },
  metaContainer: {
    marginBottom: 24, // mb-6 (space-y-1 implemented with flex box margins below)
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // space-y-1 element spacing
  },
  iconText: {
    fontFamily: "Material Symbols Outlined",
    fontSize: 18, // text-[18px]
    color: "#bcc8cf", // text-on-surface-variant
    marginRight: 8, // gap-2
  },
  metaText: {
    fontFamily: "Hanken Grotesk", // font-body-md
    fontSize: 16, // text-body-md
    fontWeight: "400",
    color: "#bcc8cf", // text-on-surface-variant
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00c2f3", // bg-primary-container
    paddingVertical: 16, // py-4
    borderRadius: 12, // rounded-xl

    // Neon glow style implementation using shadow mappings
    shadowColor: "#00c2f3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completedActionButton: {
    backgroundColor: "#2d3449", // surface variant fallback for closed games
    shadowColor: "transparent",
    elevation: 0,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.98 }], // active:scale-95 transition mimic
    opacity: 0.9,
  },
  buttonIconText: {
    fontFamily: "Material Symbols Outlined",
    fontSize: 20,
    color: "#004c61", // text-on-primary-container
    marginRight: 12, // gap-3
  },
  completedButtonText: {
    color: "#dae2fd", // crisp on-surface clarity for completed summaries
  },
  actionButtonText: {
    fontFamily: "Plus Jakarta Sans", // font-headline-md
    fontSize: 20, // text-headline-md
    fontWeight: "600",
    color: "#004c61", // text-on-primary-container
  },
});
