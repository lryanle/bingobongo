"use client";

import { Button } from "@/components/ui/button";
import { X, RotateCcw, Settings, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WinModalProps {
  open: boolean;
  onClose: () => void;
  winningTeam: {
    index: number;
    name: string;
    color: string;
  };
  isOwner: boolean;
  currentUserId?: string;
  playerCount: number;
  votes: number;
  countdown?: number;
  onVote: () => void;
  onInstantRestart: () => void;
  onChangeGameMode: () => void;
  hasVoted: boolean;
}

export default function WinModal({
  open,
  onClose,
  winningTeam,
  isOwner,
  currentUserId,
  playerCount,
  votes,
  countdown,
  onVote,
  onInstantRestart,
  onChangeGameMode,
  hasVoted,
}: WinModalProps) {
  // Use server countdown directly, don't maintain local state
  // The server broadcasts countdown updates every second

  const majority = Math.ceil(playerCount / 2);
  const voteProgress = playerCount > 0 ? (votes / playerCount) * 100 : 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="relative bg-card border-2 rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

          {/* Win announcement */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div
                className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-white mb-4"
                style={{ backgroundColor: winningTeam.color }}
              >
                🎉
              </div>
            </div>
            <h1
              className="text-5xl font-bold mb-2"
              style={{ color: winningTeam.color }}
            >
              {winningTeam.name} Wins!
            </h1>
            <p className="text-xl text-muted-foreground">Congratulations on achieving bingo!</p>
          </div>

          {/* Voting section */}
          <div className="border-t border-b border-border py-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Restart Round</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {votes} / {majority} votes needed ({playerCount} players)
              </span>
            </div>
            
            <Progress value={voteProgress} className="mb-4" />
            
            {!hasVoted && (
              <Button
                onClick={onVote}
                className="w-full"
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Vote to Restart Round
              </Button>
            )}
            
            {hasVoted && (
              <div className="text-center text-sm text-muted-foreground">
                You have voted to restart
              </div>
            )}

            {countdown !== undefined && countdown > 0 && (
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">
                  Restarting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </div>
            )}
          </div>

          {/* Host controls */}
          {isOwner && (
            <div className="space-y-3">
              <Button
                onClick={onInstantRestart}
                className="w-full"
                variant="default"
                disabled={countdown !== undefined && countdown <= 5}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Instant Restart (5s countdown)
              </Button>
              <Button
                onClick={onChangeGameMode}
                className="w-full"
                variant="outline"
              >
                <Settings className="mr-2 h-4 w-4" />
                Change Game Mode
              </Button>
            </div>
          )}
        </div>
    </div>
  );
}

