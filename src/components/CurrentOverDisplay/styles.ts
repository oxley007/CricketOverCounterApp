import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    marginVertical: 10,
    height: 44,
  },
  cell: {
    // ✅ Fills up the custom sized scaling wrapper completely
    width: "100%",
    height: "100%",
  },
  circle: {
    // ✅ Reverted back to 100% to follow the parent's dynamic scale size calculation rules
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2d3449",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#3d494e",
  },
  unbowledCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#7fdaff",
  },
  wicketCircle: {
    backgroundColor: "#93000a",
    borderWidth: 1,
    borderColor: "#3d494e",
    borderRadius: 999,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  extraCircle: {
    backgroundColor: "#6900b3",
    borderWidth: 3,
    borderColor: "#6900b3",
    borderRadius: 999,
    width: "100%",
    height: "100%",
  },
  circleText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14, // Slightly smaller base to handle downscaled circles safely
    textAlign: "center",
  },
  wicketText: {
    color: "#ffdad6",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff0",
    textAlign: "center",
  },
});
