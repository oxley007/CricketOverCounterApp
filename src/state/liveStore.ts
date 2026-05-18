// state/liveStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fixture } from "./fixtureStore";
import type { Team } from "./teamStore";

export type LiveTeam = {
  teamId: string;
  teamCode: string;
  playerIds: string[];
};

export type LiveViewTeam = {
  teamId: string;
  teamName: string;
  players: {
    id: string;
    name: string;
    archived?: boolean;
  }[];
};

type LiveState = {
  liveConfigured: boolean;
  livePro: boolean;

  teams: LiveTeam[];

  // 👇 you are still using these → they MUST be in the type
  teamCode: string | null;
  teamId: string | null;
  playerIds: string[];

  teamCodesSupporter: string[];
  supporterTeamNames: Record<string, string>;

  playerCodesSupporter: string[];
  supporterPlayerNames: Record<string, string>;

  fixtures: Record<string, Fixture>;

  isReadOnly: boolean;

  liveViewTeams: Team[];

  setLiveConfigured: (value: boolean) => void;
  setLivePro: (value: boolean) => void;

  setTeamCode: (code: string) => void;
  setTeamId: (id: string) => void;
  setPlayerIds: (ids: string[]) => void;

  // ✅ FIXED (no implementation here)
  setTeams: (teams: LiveTeam[]) => void;
  addTeam: (team: LiveTeam) => void;

  addSupporterTeam: (teamCode: string) => void;
  removeSupporterTeam: (teamCode: string) => void;

  updateSupporterTeamName: (teamCode: string, name: string) => void;

  addSupporterPlayer: (playerId: string) => void;
  removeSupporterPlayer: (playerId: string) => void;
  updateSupporterPlayerName: (playerId: string, name: string) => void;

  configureLive: (params: {
    teamId: string;
    teamCode: string;
    playerIds: string[];
  }) => void;

  resetLive: () => void;

  setFixture: (teamCode: string, fixture: Fixture) => void;

  setReadOnly: (val: boolean) => void;

  setLiveViewTeams: (teams: Team[]) => void;
};

export const useLiveStore = create<LiveState>()(
  persist(
    (set) => ({
      liveConfigured: false,
      livePro: false,

      teams: [],

      teamCode: null,
      teamId: null,
      playerIds: [],

      teamCodesSupporter: [],
      supporterTeamNames: {},

      playerCodesSupporter: [],
      supporterPlayerNames: {},

      fixtures: {},

      isReadOnly: false,

      liveViewTeams: [],

      setLiveConfigured: (value) => set({ liveConfigured: value }),
      setLivePro: (value) => set({ livePro: value }),

      setTeamCode: (code) => set({ teamCode: code }),
      setTeamId: (id) => set({ teamId: id }),
      setPlayerIds: (ids) => set({ playerIds: ids }),

      setTeams: (teams) => set({ teams }),

      addTeam: (team) =>
        set((state) => ({
          teams: [...state.teams, team],
        })),

      configureLive: ({ teamId, teamCode, playerIds }) =>
        set({
          liveConfigured: true,
          teamId,
          teamCode,
          playerIds,
        }),

      resetLive: () =>
        set({
          liveConfigured: false,
          livePro: false,
          teams: [],
          liveViewTeams: [],
          teamCode: null,
          teamId: null,
          playerIds: [],
          fixtures: {},
        }),

      addSupporterTeam: (teamCode) =>
        set((state) => {
          // prevent duplicates
          if (state.teamCodesSupporter.includes(teamCode)) {
            return state;
          }

          return {
            teamCodesSupporter: [...state.teamCodesSupporter, teamCode],
          };
        }),

      removeSupporterTeam: (teamCode) =>
        set((state) => ({
          teamCodesSupporter: state.teamCodesSupporter.filter(
            (code) => code !== teamCode,
          ),
        })),

      updateSupporterTeamName: (teamCode, name) =>
        set((state) => ({
          supporterTeamNames: {
            ...state.supporterTeamNames,
            [teamCode]: name,
          },
        })),

      addSupporterPlayer: (playerId) =>
        set((state) => {
          if (state.playerCodesSupporter.includes(playerId)) return state;
          return {
            playerCodesSupporter: [...state.playerCodesSupporter, playerId],
          };
        }),
      removeSupporterPlayer: (playerId) =>
        set((state) => ({
          playerCodesSupporter: state.playerCodesSupporter.filter(
            (id) => id !== playerId,
          ),
        })),
      updateSupporterPlayerName: (playerId, name) =>
        set((state) => ({
          supporterPlayerNames: {
            ...state.supporterPlayerNames,
            [playerId]: name,
          },
        })),

      setFixture: (teamCode, fixture) =>
        set((state) => ({
          fixtures: {
            ...state.fixtures,
            [teamCode]: fixture,
          },
        })),

      setReadOnly: (val) => set({ isReadOnly: val }),

      setLiveViewTeams: (teams) => set({ liveViewTeams: teams }),
    }),
    {
      name: "live-storage", // 🔑 required
      storage: createJSONStorage(() => AsyncStorage), // 🔑 required for RN
    },
  ),
);
