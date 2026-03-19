// src/state/teamStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { generateId } from "../utils/generateId";

export type Player = {
  id: string;
  name: string;
  archived?: boolean;
};

export type Team = {
  id: string;
  name: string;
  players: Player[]; // 👈 NEW
};

interface TeamStore {
  teams: Team[];
  addTeam: (name: string) => Team | null;

  addPlayer: (teamId: string, name: string) => Player | null;
  removePlayer: (teamId: string, playerId: string) => void;
  updatePlayerName: (teamId: string, playerId: string, newName: string) => void;
  archivePlayer: (teamId: string, playerId: string, archive: boolean) => void;
  loadTeams: () => Promise<void>;
  clearTeams: () => Promise<void>;
}

const TEAMS_KEY = "@teams";

export const useTeamStore = create<TeamStore>((set, get) => ({
  teams: [],

  // Load teams from storage
  loadTeams: async () => {
    try {
      const json = await AsyncStorage.getItem(TEAMS_KEY);
      if (json) {
        const parsed: Team[] = JSON.parse(json);

        // 🛟 migrate old teams
        const withPlayers = parsed.map((t) => ({
          ...t,
          players: t.players ?? [],
        }));

        set({ teams: withPlayers });
      }
    } catch (err) {
      console.warn("Failed to load teams:", err);
    }
  },

  // Add a new team (returns null if duplicate)
  addTeam: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const existing = get().teams.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) return null;

    const newTeam: Team = {
      id: generateId(),
      name: trimmed,
      players: [],
    };

    const updatedTeams = [...get().teams, newTeam];
    set({ teams: updatedTeams });

    AsyncStorage.setItem(TEAMS_KEY, JSON.stringify(updatedTeams)).catch(
      console.warn,
    );

    return newTeam;
  },

  // Clear all teams
  clearTeams: async () => {
    set({ teams: [] });
    try {
      await AsyncStorage.removeItem(TEAMS_KEY);
    } catch (err) {
      console.warn("Failed to clear teams:", err);
    }
  },

  addPlayer: (teamId, name) => {
    const teams = get().teams;

    const team = teams.find((t) => t.id === teamId);
    if (!team) return null;

    const trimmed = name.trim(); // ✅ trim here
    if (!trimmed) return null;

    const exists = team.players.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return null;

    const newPlayer: Player = {
      id: generateId(),
      name: trimmed, // ✅ use trimmed
    };

    const updatedTeams = teams.map((t) =>
      t.id === teamId ? { ...t, players: [...t.players, newPlayer] } : t,
    );

    set({ teams: updatedTeams });

    AsyncStorage.setItem(TEAMS_KEY, JSON.stringify(updatedTeams)).catch(
      console.warn,
    );

    return newPlayer;
  },

  removePlayer: (teamId, playerId) => {
    const updatedTeams = get().teams.map((t) =>
      t.id === teamId
        ? {
            ...t,
            players: t.players.filter((p) => p.id !== playerId),
          }
        : t,
    );

    set({ teams: updatedTeams });

    AsyncStorage.setItem(TEAMS_KEY, JSON.stringify(updatedTeams)).catch(
      console.warn,
    );
  },

  updatePlayerName: (teamId, playerId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const updatedTeams = get().teams.map((t) =>
      t.id === teamId
        ? {
            ...t,
            players: t.players.map((p) =>
              p.id === playerId ? { ...p, name: trimmed } : p,
            ),
          }
        : t,
    );

    set({ teams: updatedTeams });

    AsyncStorage.setItem(TEAMS_KEY, JSON.stringify(updatedTeams)).catch(
      console.warn,
    );
  },

  archivePlayer: (teamId: string, playerId: string, archive: boolean) => {
    const updatedTeams = get().teams.map((t) =>
      t.id === teamId
        ? {
            ...t,
            players: t.players.map((p) =>
              p.id === playerId ? { ...p, archived: archive } : p,
            ),
          }
        : t,
    );

    set({ teams: updatedTeams });

    AsyncStorage.setItem(TEAMS_KEY, JSON.stringify(updatedTeams)).catch(
      console.warn,
    );
  },
}));
