"use client";

import { Button } from "@/components/ui/button";

interface TeamSelectionProps {
  readonly teams: Array<{ name: string; color: string }>;
  readonly selectedTeam?: number;
  readonly onTeamSelect: (teamIndex: number) => void;
  readonly disabled?: boolean;
}

export default function TeamSelection({
  teams,
  selectedTeam,
  onTeamSelect,
  disabled = false,
}: TeamSelectionProps) {
  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-white text-lg font-semibold">Team Selection</h3>
        <p className="text-neutral-400 text-sm">No teams available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-foreground text-lg font-semibold">Team Selection</h3>
      <div className="flex flex-col gap-2">
        {teams.map((team, index) => {
          const isSelected = selectedTeam === index;
          const textColor = getContrastColor(team.color);
          
          return (
            <Button
              key={`${team.name}-${team.color}`}
              onClick={() => !disabled && onTeamSelect(index)}
              disabled={disabled}
              className="w-full justify-start transition-all"
              style={{
                backgroundColor: isSelected ? team.color : `${team.color}80`,
                color: textColor,
                border: isSelected ? `2px solid ${team.color}` : "1px solid transparent",
              }}
            >
              {team.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to determine if text should be black or white based on background
function getContrastColor(hexColor: string): string {
  const r = Number.parseInt(hexColor.slice(1, 3), 16);
  const g = Number.parseInt(hexColor.slice(3, 5), 16);
  const b = Number.parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

