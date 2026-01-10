import { Check, Lock, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType = "optimized" | "locked" | "processing" | "conflict" | "pending";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig = {
  optimized: {
    icon: Check,
    label: "Optimized",
    className: "status-optimized",
  },
  locked: {
    icon: Lock,
    label: "Locked",
    className: "status-locked",
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    className: "status-processing",
  },
  conflict: {
    icon: AlertTriangle,
    label: "Conflict",
    className: "status-conflict",
  },
  pending: {
    icon: Loader2,
    label: "Pending",
    className: "status-processing",
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn("status-badge", config.className)}>
      <Icon
        className={cn(
          "w-3.5 h-3.5",
          status === "processing" && "animate-spin"
        )}
      />
      {label || config.label}
    </span>
  );
}
