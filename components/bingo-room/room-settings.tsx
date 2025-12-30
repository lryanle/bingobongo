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
import { Trash2, RotateCcw, Plus, Save, Upload, Download, XCircle, AlertCircle } from "lucide-react";
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
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [lastSavedItems, setLastSavedItems] = useState<string[]>(initialBingoItems);

  // Sync bingo items when initial items change
  useEffect(() => {
    setBingoItems(initialBingoItems);
    setLastSavedItems(initialBingoItems);
  }, [initialBingoItems]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(bingoItems) !== JSON.stringify(lastSavedItems);

  // Auto-reset confirm delete button after 5 seconds
  useEffect(() => {
    if (confirmDelete) {
      const timer = setTimeout(() => {
        setConfirmDelete(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

  // Auto-reset confirm clear all button after 5 seconds
  useEffect(() => {
    if (confirmClearAll) {
      const timer = setTimeout(() => {
        setConfirmClearAll(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [confirmClearAll]);

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
        setLastSavedItems([...bingoItems]);
        if (onBingoItemsUpdate) {
          onBingoItemsUpdate(bingoItems);
        }
        // Don't use alert, use a more subtle notification
        // The success state will be visible through the UI
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

  const handleClearAll = () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      return;
    }
    setBingoItems([]);
    setConfirmClearAll(false);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = globalThis.confirm(
        "You have unsaved changes to your bingo items. Are you sure you want to close without saving?"
      );
      if (!confirmed) {
        return;
      }
    }
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // If trying to close the dialog
    if (!newOpen && hasUnsavedChanges) {
      const confirmed = globalThis.confirm(
        "You have unsaved changes to your bingo items.\n\n" +
        "Click OK to discard your changes and close.\n" +
        "Click Cancel to stay and save your changes."
      );
      if (!confirmed) {
        // User cancelled, keep dialog open
        return;
      }
      // User confirmed, discard changes and close
      setBingoItems([...lastSavedItems]);
    }
    onOpenChange(newOpen);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="text-2xl font-bold">Room Settings</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Manage your room settings, bingo items, and game options.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="items">Bingo Items</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="space-y-6 mt-0">
              {/* Unsaved Changes Banner */}
              {hasUnsavedChanges && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      You have unsaved changes
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      Don't forget to click "Save Changes" to apply your modifications.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveItems}
                    variant="default"
                    size="sm"
                    disabled={isSaving}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    aria-label="Save bingo items"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Now"}
                  </Button>
                </div>
              )}

              {/* Header Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Manage Bingo Items
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add, edit, or remove bingo items. The board will randomly select from these items when creating a new game.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleExport}
                      variant="outline"
                      size="default"
                      disabled={bingoItems.length === 0}
                      aria-label="Export bingo items to file"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button
                      onClick={handleSaveItems}
                      variant={hasUnsavedChanges ? "default" : "outline"}
                      size="default"
                      disabled={isSaving || !hasUnsavedChanges}
                      aria-label="Save bingo items"
                      className={hasUnsavedChanges ? "bg-primary text-primary-foreground" : ""}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {(() => {
                        if (isSaving) return "Saving...";
                        if (hasUnsavedChanges) return "Save Changes";
                        return "No Changes";
                      })()}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Import Section */}
              <div className="border border-border rounded-lg p-5 bg-muted/30 space-y-3">
                <div>
                  <label htmlFor="import-textarea" className="text-sm font-semibold text-foreground block mb-2">
                    Import Items
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Paste items below, one per line. They will be added to your existing items.
                  </p>
                  <Textarea
                    id="import-textarea"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Enter items, one per line...&#10;Example:&#10;Item 1&#10;Item 2&#10;Item 3"
                    className="min-h-[120px] text-sm font-mono"
                    aria-label="Import bingo items text area"
                  />
                </div>
                <Button
                  onClick={handleImport}
                  variant="outline"
                  size="default"
                  className="w-full"
                  disabled={!importText.trim()}
                  aria-label="Import items from text area"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Items
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    Bingo Items ({bingoItems.length})
                  </h4>
                  <div className="flex gap-2">
                    {bingoItems.length > 0 && (
                      <Button
                        onClick={handleClearAll}
                        variant={confirmClearAll ? "destructive" : "outline"}
                        size="sm"
                        aria-label={confirmClearAll ? "Confirm clear all items" : "Clear all bingo items"}
                        className={confirmClearAll ? "" : "border-destructive/50 text-destructive hover:bg-destructive/10"}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {confirmClearAll ? "Confirm Clear All" : "Clear All"}
                      </Button>
                    )}
                    <Button
                      onClick={handleAddItem}
                      variant="outline"
                      size="sm"
                      aria-label="Add new bingo item"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
                {confirmClearAll && (
                  <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
                    <p className="text-xs text-destructive font-medium">
                      ⚠️ This will remove all {bingoItems.length} items. Click "Confirm Clear All" again to proceed.
                    </p>
                  </div>
                )}
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 border border-border rounded-lg p-4 bg-muted/20">
                  {bingoItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground mb-2">
                        No items yet.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click "Add Item" or use the import section above to get started.
                      </p>
                    </div>
                  ) : (
                    bingoItems.map((item, index) => (
                      <div key={`item-${index}-${item}`} className="flex items-center gap-3 group">
                        <span className="text-xs text-muted-foreground font-mono w-8 shrink-0">
                          {index + 1}.
                        </span>
                        <Input
                          value={item}
                          onChange={(e) => handleUpdateItem(index, e.target.value)}
                          placeholder={`Bingo item ${index + 1}`}
                          className="flex-1"
                          aria-label={`Edit bingo item ${index + 1}`}
                        />
                        <Button
                          onClick={() => handleDeleteItem(index)}
                          variant="ghost"
                          size="icon"
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Delete bingo item ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-0">
              {/* Game Controls Section */}
              <div className="border border-border rounded-lg p-6 bg-muted/30 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Game Controls
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Reset the bingo board to start a new match. This will clear all claimed items, reset the game state, and allow players to start fresh.
                  </p>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isResetting}
                  className="w-full sm:w-auto"
                  aria-label="Reset bingo board"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isResetting ? "Resetting..." : "Reset Board"}
                </Button>
              </div>

              {/* Danger Zone Section */}
              <div className="border-2 border-destructive/50 rounded-lg p-6 bg-destructive/5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Deleting this room will permanently remove it and all associated data, including game history, player records, and bingo items. This action cannot be undone.
                  </p>
                </div>
                <Button
                  onClick={handleDelete}
                  variant={confirmDelete ? "destructive" : "outline"}
                  disabled={isDeleting}
                  className={`w-full sm:w-auto ${confirmDelete ? "" : "border-destructive text-destructive hover:bg-destructive/10"}`}
                  aria-label={confirmDelete ? "Confirm room deletion" : "Delete room"}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {confirmDelete ? "Click Again to Confirm Delete" : "Delete Room"}
                </Button>
                {confirmDelete && (
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ This action is permanent and cannot be undone.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="border-t border-border pt-4 mt-4">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
              <AlertCircle className="h-4 w-4" />
              <span>You have unsaved changes</span>
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full sm:w-auto"
            aria-label="Close room settings"
          >
            {hasUnsavedChanges ? "Close Without Saving" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

