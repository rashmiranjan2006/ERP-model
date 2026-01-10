import { Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SlotType = "theory" | "lab" | "free" | "conflict";

export interface SlotData {
  id: string;
  type: SlotType;
  subject?: string;
  subjectCode?: string;
  faculty?: string;
  room?: string;
  isLocked?: boolean;
  aiReason?: string;
  duration?: number; // in slots (for lab sessions spanning multiple periods)
}

interface SlotCardProps {
  slot: SlotData;
  compact?: boolean;
  onClick?: () => void;
}

export function SlotCard({ slot, compact = false, onClick }: SlotCardProps) {
  if (slot.type === "free") {
    return (
      <div
        className="slot-card slot-free flex items-center justify-center min-h-[60px]"
        onClick={onClick}
      >
        <span className="text-xs text-muted-foreground">Free</span>
      </div>
    );
  }

  const slotStyles = {
    theory: "slot-theory",
    lab: "slot-lab",
    conflict: "slot-conflict",
    free: "slot-free",
  };

  const textStyles = {
    theory: "text-slot-theory",
    lab: "text-slot-lab",
    conflict: "text-slot-conflict",
    free: "text-muted-foreground",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn("slot-card", slotStyles[slot.type])}
          onClick={onClick}
          style={slot.duration && slot.duration > 1 ? { gridRow: `span ${slot.duration}` } : undefined}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold truncate", textStyles[slot.type])}>
                {slot.subjectCode || slot.subject}
              </p>
              {!compact && slot.subject && slot.subjectCode && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {slot.subject}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {slot.type === "conflict" && (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
              )}
              {slot.isLocked && (
                <Lock className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
          {!compact && (
            <div className="mt-2 space-y-0.5">
              {slot.faculty && (
                <p className="text-xs text-muted-foreground truncate">
                  {slot.faculty}
                </p>
              )}
              {slot.room && (
                <p className="text-xs text-muted-foreground/70 truncate">
                  {slot.room}
                </p>
              )}
            </div>
          )}
          {slot.type === "lab" && (
            <div className="absolute top-1 right-1">
              <span className="text-[10px] font-medium text-slot-lab bg-slot-lab/10 px-1.5 py-0.5 rounded">
                LAB
              </span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-2">
          <div>
            <p className="font-semibold">{slot.subject}</p>
            <p className="text-sm text-muted-foreground">{slot.subjectCode}</p>
          </div>
          {slot.faculty && (
            <p className="text-sm">
              <span className="text-muted-foreground">Faculty:</span> {slot.faculty}
            </p>
          )}
          {slot.room && (
            <p className="text-sm">
              <span className="text-muted-foreground">Room:</span> {slot.room}
            </p>
          )}
          {slot.aiReason && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">AI Decision:</span> {slot.aiReason}
              </p>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
