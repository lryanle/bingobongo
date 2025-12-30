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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, RotateCcw, Plus, Save, Upload, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RoomSettingsProps {
  readonly roomId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDelete: () => void;
  readonly onReset?: () => void;
  readonly initialBingoItems?: string[];
  readonly onBingoItemsUpdate?: (items: string[]) => void;
}

export default function RoomSettings({
  roomId,
  open,
  onOpenChange,
  onDelete,
  onReset,
  initialBingoItems = [],
  onBingoItemsUpdate,
}: RoomSettingsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [bingoItems, setBingoItems] = useState<string[]>(initialBingoItems);
  const [isSaving, setIsSaving] = useState(false);
  const [importText, setImportText] = useState("");

  // Sync bingo items when initial items change
  useEffect(() => {
    setBingoItems(initialBingoItems);
  }, [initialBingoItems]);

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

  const handleAddItem = () => {
    setBingoItems([...bingoItems, ""]);
  };

  const handleUpdateItem = (index: number, value: string) => {
    const updated = [...bingoItems];
    updated[index] = value;
    setBingoItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = bingoItems.filter((_, i) => i !== index);
    setBingoItems(updated);
  };

  const handleSaveItems = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/rooms/${roomId}/bingo-items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bingoItems }),
      });

      if (response.ok) {
        if (onBingoItemsUpdate) {
          onBingoItemsUpdate(bingoItems);
        }
        alert("Bingo items saved successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save bingo items");
      }
    } catch (error) {
      console.error("Error saving bingo items:", error);
      alert("Failed to save bingo items. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = () => {
    const lines = importText.split("\n").map(line => line.trim()).filter(Boolean);
    setBingoItems([...bingoItems, ...lines]);
    setImportText("");
  };

  const handleExport = () => {
    const text = bingoItems.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bingo-items-${roomId}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">Bingo Items</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Manage Bingo Items
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExport}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button
                      onClick={handleSaveItems}
                      variant="default"
                      size="sm"
                      disabled={isSaving}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add, edit, or remove bingo items. The board will randomly select from these items.
                </p>
                
                {/* Import Section */}
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <label htmlFor="import-textarea" className="text-xs font-semibold text-foreground">Import Items</label>
                  <Textarea
                    id="import-textarea"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Enter items, one per line..."
                    className="min-h-[80px] text-sm"
                  />
                  <Button
                    onClick={handleImport}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {bingoItems.map((item, index) => (
                      <div key={`item-${index}-${item}`} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateItem(index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleDeleteItem(index)}
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {bingoItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No items yet. Click "Add Item" to get started.
                    </p>
                  )}
                </div>
                
                <Button
                  onClick={handleAddItem}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
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
            </TabsContent>
          </Tabs>
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

