export function getTeamCode(input: string) {
  const cleaned = input.trim().toUpperCase();

  if (cleaned.startsWith("TEAM-")) {
    return cleaned;
  }

  return `TEAM-${cleaned}`;
}
