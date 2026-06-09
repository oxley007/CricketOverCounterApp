export function getTeamCode(input: string) {
  const cleaned = input.trim().toUpperCase();

  if (cleaned.startsWith("TEAM-")) {
    return cleaned;
  }

  return `TEAM-${cleaned}`;
}

export function getPlayerCode(input: string) {
  if (!input) return "";
  const cleaned = input.trim().toUpperCase();
  if (cleaned.startsWith("P-")) {
    return cleaned;
  }
  return `P-${cleaned}`;
}
