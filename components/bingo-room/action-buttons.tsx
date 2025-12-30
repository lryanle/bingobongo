"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import RoomSettings from "./room-settings";

interface ActionButtonsProps {
  readonly roomId: string;
  readonly isOwner?: boolean;
  readonly onLeave: () => void;
  readonly onDeleteRoom?: () => void;
  readonly onReset?: () => void;
}

export default function ActionButtons({
  roomId,
  isOwner = false,
  onLeave,
  onDeleteRoom,
  onReset,
}: ActionButtonsProps) {
  const router = useRouter();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-reset confirm leave button after 5 seconds
  useEffect(() => {
    if (confirmLeave) {
      const timer = setTimeout(() => {
        setConfirmLeave(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmLeave]);

  const handleLeave = () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    
    onLeave();
    router.push("/");
  };

  const handleDeleteRoom = () => {
    if (onDeleteRoom) {
      onDeleteRoom();
    }
    router.push("/bingo");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleLeave}
          variant={confirmLeave ? "destructive" : "secondary"}
          className={`w-full ${confirmLeave ? "bg-destructive text-white" : ""}`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {confirmLeave ? "Confirm Leave" : "Leave Room"}
        </Button>
        {isOwner && (
          <Button
            onClick={() => setSettingsOpen(true)}
            variant="secondary"
            className="w-full"
          >
            <Settings className="mr-2 h-4 w-4" />
            Room Settings
          </Button>
        )}
        {!isOwner && <div />}
      </div>
      {isOwner && (
        <RoomSettings
          roomId={roomId}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onDelete={handleDeleteRoom}
          onReset={onReset}
        />
      )}
    </>
  );
}

