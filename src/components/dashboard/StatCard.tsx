import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "success" | "warning" | "accent";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "bg-muted/50 text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl transition-transform group-hover:scale-105",
            variantStyles[variant]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend.positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            <span>{trend.positive ? "+" : ""}{trend.value}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-semibold text-foreground tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
