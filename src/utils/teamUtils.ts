// src/utils/teamUtils.ts
import { Fixture } from "../state/fixtureStore";

export function getInningsTeamNames(
  fixture: Fixture | undefined,
  currentBattingId: string | undefined,
) {
  if (!fixture || !currentBattingId) {
    return { battingTeamName: "Unknown", bowlingTeamName: "Unknown" };
  }

  const isYourTeamBatting = fixture.yourTeam.id === currentBattingId;

  return {
    battingTeamName: isYourTeamBatting
      ? fixture.yourTeam.name
      : fixture.oppositionTeam.name,
    bowlingTeamName: isYourTeamBatting
      ? fixture.oppositionTeam.name
      : fixture.yourTeam.name,
  };
}
