"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";

interface RoomSettingsProps {
  readonly roomId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDelete: () => void;
  readonly onReset?: () => void;
}

export default function RoomSettings({
  roomId,
  open,
  onOpenChange,
  onDelete,
  onReset,
}: RoomSettingsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Auto-reset confirm delete button after 5 seconds
  useEffect(() => {
    if (confirmDelete) {
      const timer = setTimeout(() => {
        setConfirmDelete(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}/reset`, {
        method: "POST",
      });

      if (response.ok) {
        if (onReset) {
          onReset();
        }
        onOpenChange(false);
      } else {
        console.error("Failed to reset board");
        alert("Failed to reset board. Please try again.");
      }
    } catch (error) {
      console.error("Error resetting board:", error);
      alert("Failed to reset board. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete();
      } else {
        console.error("Failed to delete room");
        setIsDeleting(false);
        setConfirmDelete(false);
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Room Settings</DialogTitle>
          <DialogDescription>
            Manage your room settings and options.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="border-b border-border pb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Game Controls
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Reset the bingo board to start a new match. This will clear all claimed items and reset the game state.
              </p>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isResetting}
                className="w-full sm:w-auto"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isResetting ? "Resetting..." : "Reset Board"}
              </Button>
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting this room will permanently remove it and all associated data.
                This action cannot be undone.
              </p>
              <Button
                onClick={handleDelete}
                variant={confirmDelete ? "destructive" : "outline"}
                disabled={isDeleting}
                className={`w-full sm:w-auto ${confirmDelete ? "bg-destructive text-white hover:bg-destructive/90" : "border-destructive text-destructive hover:bg-destructive/10"}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {confirmDelete ? "Confirm Delete" : "Delete Room"}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

