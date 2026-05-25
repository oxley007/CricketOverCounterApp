import { getTeamCode, getPlayerCode } from "../liveHelpers";

describe("Team and Player Code Formatters", () => {
  // ----------------------------------------------------------------
  // Test Set 1: getTeamCode
  // ----------------------------------------------------------------
  describe("getTeamCode", () => {
    it("adds the TEAM- prefix if it is missing and forces uppercase", () => {
      const result = getTeamCode("strikers");
      expect(result).toBe("TEAM-STRIKERS");
    });

    it("retains the existing prefix if the input already starts with TEAM-", () => {
      const result = getTeamCode("TEAM-STRIKERS");
      expect(result).toBe("TEAM-STRIKERS");
    });

    it("cleans up accidental trailing and leading whitespace cleanly", () => {
      const result = getTeamCode("  team-strikers  ");
      expect(result).toBe("TEAM-STRIKERS");
    });
  });

  // ----------------------------------------------------------------
  // Test Set 2: getPlayerCode
  // ----------------------------------------------------------------
  describe("getPlayerCode", () => {
    it("adds the P- prefix if it is missing and forces uppercase", () => {
      const result = getPlayerCode("smith");
      expect(result).toBe("P-SMITH");
    });

    it("retains the prefix if the input already starts with P-", () => {
      const result = getPlayerCode("P-SMITH");
      expect(result).toBe("P-SMITH");
    });

    it("returns an empty string immediately if the input is falsy", () => {
      const result = getPlayerCode("");
      expect(result).toBe("");
    });

    it("handles lowercase prefix inputs correctly by converting them first", () => {
      const result = getPlayerCode("p-smith");
      expect(result).toBe("P-SMITH");
    });
  });
});
