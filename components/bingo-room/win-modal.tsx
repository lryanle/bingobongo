"use client";

import { useState, useEffect } from "react";
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
  scheduledAt?: string;
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
  scheduledAt,
  onVote,
  onInstantRestart,
  onChangeGameMode,
  hasVoted,
}: WinModalProps) {
  const [localCountdown, setLocalCountdown] = useState<number | undefined>(countdown);

  // Update countdown from props
  useEffect(() => {
    setLocalCountdown(countdown);
  }, [countdown]);

  // Calculate countdown from scheduled time if available
  useEffect(() => {
    if (scheduledAt && !countdown) {
      const updateCountdown = () => {
        const now = Date.now();
        const scheduled = new Date(scheduledAt).getTime();
        const remaining = Math.max(0, Math.ceil((scheduled - now) / 1000));
        setLocalCountdown(remaining);
      };
      
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [scheduledAt, countdown]);

  // Client-side countdown if we have an initial countdown
  useEffect(() => {
    if (localCountdown !== undefined && localCountdown > 0 && !scheduledAt) {
      const interval = setInterval(() => {
        setLocalCountdown((prev) => {
          if (prev === undefined || prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [scheduledAt]); // Only depend on scheduledAt - localCountdown updates inside the interval don't need to trigger re-runs

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

            {localCountdown !== undefined && localCountdown > 0 && (
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">
                  Restarting in {localCountdown} second{localCountdown !== 1 ? 's' : ''}...
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
                disabled={localCountdown !== undefined && localCountdown <= 5}
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

