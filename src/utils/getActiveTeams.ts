import { Fixture } from "../state/fixtureStore";
import { Team } from "../state/teamStore";

export function getActiveTeams(fixtures: Fixture[], teams: Team[]) {
  const map = new Map<string, boolean>();

  fixtures.forEach((f) => {
    const teamId = f.yourTeam?.id;
    if (teamId) map.set(teamId, true);
  });

  return teams.filter((t) => map.has(t.id));
}
