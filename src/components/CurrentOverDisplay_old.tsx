import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useMatchStore, BallEvent, WicketEvent } from "../state/matchStore";

const LEGAL_BALLS = 6;
const MAX_CIRCLES = 10;

export const CurrentOverDisplayOld = () => {
  const events = useMatchStore((state) => state.events);

  // Separate legal balls
  const balls = events.filter((e) => e.type === "ball") as BallEvent[];
  const legalBalls = balls.filter((b) => b.countsAsBall);

  const ballsInCurrentOver = legalBalls.length % LEGAL_BALLS || LEGAL_BALLS;
  const isFirstBall = ballsInCurrentOver === 1;

  // Last LEGAL_BALLS for current over
  const lastLegalBalls = legalBalls.slice(-ballsInCurrentOver);

  const circles: (BallEvent | WicketEvent | null)[] = [];
  let legalBallCount = 0;

  // Loop over events from start of current over
  events.forEach((event) => {
    if (events.indexOf(event) < events.indexOf(lastLegalBalls[0])) return;

    if (event.type === "ball") {
      circles.push(event);
      if (event.countsAsBall) legalBallCount++;
    } else if (event.type === "wicket") {
      circles.push(event);

      // Only count as legal ball if the delivery was legal
      if ((event as WicketEvent).countsAsBall) {
        legalBallCount++;
      }
    }
  });

  // Fill empty circles to complete 6 legal balls
  while (legalBallCount < LEGAL_BALLS) {
    circles.push(null);
    legalBallCount++;
  }

  // Cap at MAX_CIRCLES
  if (circles.length > MAX_CIRCLES) {
    const extraCount = circles.length - MAX_CIRCLES;
    circles[MAX_CIRCLES - 1] = { extraCount };
    circles.splice(MAX_CIRCLES);
  }

  // Map circles to JSX
  const circleElements = circles.map((item, index) => {
    if (!item) {
      return (
        <View key={index} style={styles.cell}>
          <View style={styles.unbowledCircle} />
        </View>
      );
    }

    // Determine main circle
    let mainCircleStyle = styles.circle;
    let mainText = "•";
    let mainTextStyle = styles.circleText;

    if (item.type === "wicket") {
      mainCircleStyle = styles.wicketCircle;
      mainText = "W";
      mainTextStyle = styles.wicketText;
    } else if ((item as BallEvent).type === "ball") {
      const ball = item as BallEvent;
      mainText = ball.runs > 0 ? `${ball.runs}` : "•";
      mainCircleStyle =
        ball.isExtra && (ball.extraType === "wide" || ball.extraType === "noball")
          ? styles.extraCircle
          : styles.circle;
    }

    // Build stacked extras
    const extras: string[] = [];
    let extraColor = "#c471ed"; // default purple for extras
    if ((item as BallEvent).isExtra) {
      const ball = item as BallEvent;
      switch (ball.extraType) {
        case "wide":
          extras.push(`Wd${ball.runs ? ` ${ball.runs}` : ""}`);
          extraColor = "#fff"; // white text on black circle
          break;
        case "noball":
          extras.push(`NB${ball.runs ? ` ${ball.runs}` : ""}`);
          extraColor = "#fff";
          break;
        case "bye":
          extras.push(`B${ball.runs ? ` ${ball.runs}` : ""}`);
          extraColor = "#c471ed"; // purple text on white circle
          break;
        case "legbye":
          extras.push(`LB${ball.runs ? ` ${ball.runs}` : ""}`);
          extraColor = "#c471ed";
          break;
      }
    }
    const isExtraOnly = (item as BallEvent).isExtra && item.type !== "wicket";
    const isWicketOnly = item.type === "wicket" && !(item as BallEvent).isExtra;

    return (
      <View key={index} style={styles.cell}>
        <View style={mainCircleStyle}>
          {/* Main text */}
          {isWicketOnly ? (
            <Text style={mainTextStyle}>{mainText}</Text>
          ) : (
            !isExtraOnly && <Text style={mainTextStyle}>{mainText}</Text>
          )}

          {/* Extras */}
          {!isWicketOnly && extras.length > 0 && (
            <View style={{ marginTop: 2, alignItems: "center" }}>
              {extras.map((e, i) => {
                const [code, runs] = e.split(" ");
                // Wicket + Extra
                if (mainText === "W") {
                  return (
                    <Text
                      key={i}
                      style={[
                        styles.circleText,
                        { color: extraColor, fontWeight: "bold" },
                      ]}
                    >
                      {runs ? `${runs} ${code}` : code}
                    </Text>
                  );
                }
                // Extra only
                return (
                  <View key={i} style={{ alignItems: "center" }}>
                    <Text
                      style={[
                        styles.circleText,
                        { color: extraColor, fontWeight: "bold" },
                      ]}
                    >
                      {code}
                    </Text>
                    {runs && (
                      <Text
                        style={[
                          styles.circleText,
                          { color: extraColor, fontWeight: "bold" },
                        ]}
                      >
                        {runs}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  });

  return (
    <View>
      <View style={styles.container}>{circleElements}</View>
      {isFirstBall && <Text style={styles.message}>First ball of over has been bowled!</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", width: "100%", marginVertical: 10, height: 44 },
  cell: { flex: 1, paddingHorizontal: 2 },
  circle: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  unbowledCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#fff",
  },
  wicketCircle: {
    backgroundColor: "#c471ed",
    borderWidth: 3,
    borderColor: "#fff",
    borderRadius: 999,
    width: "100%",
    height: "100%",
    justifyContent: "center",  // <-- center vertically
    alignItems: "center",      // <-- center horizontally
  },
  emptyCircle: { backgroundColor: "#fff" },
  extraCircle: { backgroundColor: "#000", borderWidth: 3, borderColor: "#000", borderRadius: 999, },
  circleText: { color: "#c471ed", fontWeight: "bold", textAlign: "center" },
  wicketText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  message: { marginTop: 8, fontSize: 16, fontWeight: "bold", color: "#ff0", textAlign: "center" },
});
