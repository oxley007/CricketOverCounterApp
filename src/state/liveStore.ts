// state/liveStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fixture } from "./fixtureStore";

export type LiveTeam = {
  teamId: string;
  teamCode: string;
  playerIds: string[];
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

  fixtures: Record<string, Fixture>;

  isReadOnly: boolean;

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

  configureLive: (params: {
    teamId: string;
    teamCode: string;
    playerIds: string[];
  }) => void;

  resetLive: () => void;

  setFixture: (teamCode: string, fixture: Fixture) => void;

  setReadOnly: (val: boolean) => void;
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

      fixtures: {},

      isReadOnly: false,

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

      setFixture: (teamCode, fixture) =>
        set((state) => ({
          fixtures: {
            ...state.fixtures,
            [teamCode]: fixture,
          },
        })),

      setReadOnly: (val) => set({ isReadOnly: val }),
    }),
    {
      name: "live-storage", // 🔑 required
      storage: createJSONStorage(() => AsyncStorage), // 🔑 required for RN
    },
  ),
);
