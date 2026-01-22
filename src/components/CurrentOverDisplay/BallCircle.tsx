import React from "react";
import { View, Text } from "react-native";
import { BallEvent, WicketEvent } from "../../state/matchStore";
import { getExtrasDisplay } from "../../utils/extrasUtils";
import { styles } from "./styles";

type Props = {
  item: BallEvent | WicketEvent | null;
};

export const BallCircle = ({ item }: Props) => {
  if (!item) {
    return (
      <View style={styles.cell}>
        <View style={styles.unbowledCircle} testID="unbowled-circle" />
      </View>
    );
  }

  // Overflow extras summary circle
  if ("extraCount" in item) {
    return (
      <View style={styles.cell}>
        <View
          style={[
            styles.circle,
            styles.extraCircle,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text
            style={[styles.circleText, { fontWeight: "bold", fontSize: 16 }]}
          >
            Ex
          </Text>
          <Text
            style={[styles.circleText, { fontWeight: "bold", fontSize: 16 }]}
          >
            {item.extraCount}
          </Text>
        </View>
      </View>
    );
  }

  // Skip non-ball wickets (like End Partnership)
  // ✅ Only skip true non-delivery wickets
  if (
    item.type === "wicket" &&
    !item.countsAsBall &&
    !item.isExtra
  ) {
    return null;
  }

  const isExtra = item.isExtra === true;
  const isWicket = item.type === "wicket";
  const isNegativeWicket = item.type === "ball" && item.runs < 0;
  const isExtraBall = isExtra && (item.extraType === "wide" || item.extraType === "noBall");
  const isExtraOnly = isExtra && !isWicket && !isNegativeWicket;

  // ---- Base display ----
  let mainText = "•";
  let textStyle = styles.circleText;

  // Determine circle style
  let circleStyle: any = { ...styles.circle };

  if (isWicket) {
    circleStyle = { ...styles.wicketCircle };

    // Wicket + extra: add black border
    if (isExtraBall) {
      circleStyle = {
        ...circleStyle,
        borderColor: "#000",
        borderWidth: 2,
      };
    }

    textStyle = styles.wicketText;
    mainText = "W";
  } else if (isNegativeWicket) {
    circleStyle = {
      backgroundColor: "#ff6b6b",
      borderWidth: 2,
      borderColor: "#fff",
      borderRadius: 999,
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    };
    mainText = `${item.runs}`;
    textStyle = styles.negativeText;
  } else if (!isWicket && isExtraBall) {
    circleStyle = { ...styles.extraCircle };
    textStyle = { ...textStyle, color: "#c471ed" }; // purple for normal extras
    mainText = ""; // don't show the main dot for extras-only
  } else if (item.type === "ball") {
    mainText = item.runs !== 0 ? `${item.runs}` : "•";
  }

  // Subtext for wicket + runs/extra
  let subText = "";
  if (isWicket) {
    if (item.runs > 0) subText += `+${item.runs}`;
    if (isExtraBall) subText += `${subText ? " " : ""}${item.extraType === "wide" ? "Wd" : "Nb"}`;
  }

  // Extras for normal balls
  const extrasInfo = isExtra && !isWicket
    ? getExtrasDisplay(item as BallEvent)
    : { extras: [], color: "", isExtraOnly: false };

  return (
    <View style={styles.cell}>
      <View style={circleStyle} testID="ball-circle">
        {/* Main circle text */}
        {!isExtraOnly && <Text style={textStyle}>{mainText}</Text>}

        {/* Subtext: runs + extras for wicket */}
        {subText !== "" && (
          <Text
            style={[
              styles.circleText,
              { fontSize: 12, fontWeight: "bold", color: "#000" },
            ]}
          >
            {subText}
          </Text>
        )}

        {/* Regular extras for normal balls */}
        {!isWicket && extrasInfo.extras.length > 0 && (
          <View style={{ marginTop: 2, alignItems: "center" }}>
            {extrasInfo.extras.map((e, i) => {
              const [code, runs] = e.split(" ");
              return (
                <View key={i} style={{ alignItems: "center" }}>
                  <Text
                    style={[styles.circleText, { color: "#c471ed", fontWeight: "bold" }]} testID={`ball-extra-code-${i}`}>
                    {code}
                  </Text>
                  {runs && (
                    <Text
                      style={[styles.circleText, { color: "#c471ed", fontWeight: "bold" }]} testID={`ball-extra-runs-${i}`}testID={`ball-extra-runs-${i}`}>
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
};
