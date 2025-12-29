"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface RoomLinkProps {
  readonly roomId: string;
}

export default function RoomLink({ roomId }: RoomLinkProps) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // Hidden by default
  const { toast } = useToast();
  
  const roomUrl = globalThis.window
    ? `${globalThis.window.location.origin}/bingo/${roomId}`
    : `https://bingo.example.com/bongo?id=${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Room link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const displayUrl = isVisible ? roomUrl : "*".repeat(roomUrl.length);

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => setIsVisible(!isVisible)}
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
      >
        {isVisible ? (
          <Eye className="h-4 w-4 text-foreground" />
        ) : (
          <EyeOff className="h-4 w-4 text-foreground" />
        )}
      </Button>
      <input
        type="text"
        value={displayUrl}
        readOnly
        className="flex-1 bg-background text-foreground text-sm px-2 py-1 rounded border border-border font-mono"
      />
      <Button
        onClick={handleCopy}
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-foreground" />
        )}
      </Button>
    </div>
  );
}

