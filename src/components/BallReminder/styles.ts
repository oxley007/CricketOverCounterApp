import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  compact: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  input: {
    width: 60,
    borderBottomWidth: 1,
    marginHorizontal: 8,
    textAlign: "center",
  },
  suffix: {
    fontSize: 16,
  },
  help: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 6,
  },
});
