import React from "react";
import { View, Text } from "react-native";
import { BallEvent, WicketEvent } from "../../state/matchStore";
import { getExtrasDisplay } from "../../utils/extrasUtils";
import { styles } from "./styles";

type Props = {
  item: BallEvent | WicketEvent | null;
};

export const BallCircle = ({ item }: Props) => {
  if (!item || "extraCount" in item) {
    return (
      <View style={styles.cell}>
        <View style={styles.unbowledCircle} />
      </View>
    );
  }

  const isExtra = item.isExtra === true;
  const isWicket = item.type === "wicket";
  const isNegativeWicket = item.type === "ball" && item.runs < 0;

  // ---- Base display ----
  let mainText = "•";
  let circleStyle = styles.circle;
  let textStyle = styles.circleText;

  // 🟥 Real wicket
  if (isWicket) {
    mainText = "W";
    circleStyle = styles.wicketCircle;
    textStyle = styles.wicketText;
  }

  // 🔻 Negative wicket (runs penalty)
  if (isNegativeWicket) {
    mainText = `${item.runs}`; // e.g. -5
    textStyle = styles.negativeText;
    // Skip circle completely
    circleStyle = null;
  }

  // 🟩 Normal ball
  if (item.type === "ball" && !isWicket && !isNegativeWicket) {
    mainText = item.runs !== 0 ? `${item.runs}` : "•";
  }

  // 🟨 Extras styling (ball OR wicket)
  if (isExtra && (item.extraType === "wide" || item.extraType === "noBall")) {
    circleStyle = styles.extraCircle;
  }

  const isExtraOnly = isExtra && !isWicket && !isNegativeWicket;
  const isWicketWithExtra = isWicket && isExtra;

  const extrasInfo = isExtra
    ? getExtrasDisplay(item as BallEvent)
    : { extras: [], color: "", isExtraOnly: false };

    return (
      <View style={styles.cell}>
      {isNegativeWicket ? (
        <View
          style={[
            styles.circle, // keeps sizing, alignment, borderRadius
            {
              backgroundColor: "#ff6b6b", // red/pink for negative runs
              borderWidth: 2,
              borderColor: "#fff"
            },
          ]}
        >
          <Text style={textStyle}>{mainText}</Text>
        </View>
      ) : (
        <View style={circleStyle}>
          {(!isExtraOnly || isWicketWithExtra) && (
            <Text style={textStyle}>{mainText}</Text>
          )}

          {extrasInfo.extras.length > 0 && (
            <View style={{ marginTop: 2, alignItems: "center" }}>
              {extrasInfo.extras.map((e, i) => {
                const [code, runs] = e.split(" ");

                if (isWicketWithExtra) {
                  return (
                    <Text
                      key={i}
                      style={[
                        styles.circleText,
                        { color: extrasInfo.color, fontWeight: "bold" },
                      ]}
                    >
                      {runs ? `${runs} ${code}` : code}
                    </Text>
                  );
                }

                return (
                  <View key={i} style={{ alignItems: "center" }}>
                    <Text
                      style={[
                        styles.circleText,
                        { color: extrasInfo.color, fontWeight: "bold" },
                      ]}
                    >
                      {code}
                    </Text>
                    {runs && (
                      <Text
                        style={[
                          styles.circleText,
                          { color: extrasInfo.color, fontWeight: "bold" },
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
      )}
      </View>
    );
};
