// src/components/Scorebook/SelectBattersModal.tsx
// Wrapper that resolves team → players and passes them to SelectPlayersModal (backward-compatible API).
"use client";

import { useMemo } from "react";
import { useTeamStore } from "../../state/teamStore";
import AddPlayerFooter from "./AddPlayerFooter";
import SelectPlayersModal from "./SelectPlayersModal";

type SelectBattersModalProps = {
  visible: boolean;
  onClose: () => void;
  teamId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

export default function SelectBattersModal({
  visible,
  onClose,
  teamId,
  selectedIds,
  onSelectionChange,
}: SelectBattersModalProps) {
  const teams = useTeamStore((s) => s.teams);
  const team = useMemo(
    () => teams.find((t) => t.id === teamId) ?? null,
    [teams, teamId],
  );
  const players = team?.players ?? [];

  return (
    <SelectPlayersModal
      visible={visible}
      onClose={onClose}
      title="Select Opening Batters"
      players={players}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      selectionMode="multiple"
      maxSelection={2}
      renderFooter={
        team ? () => <AddPlayerFooter teamId={team.id} /> : undefined
      }
    />
  );
}
