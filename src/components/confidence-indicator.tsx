import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  score: number; // 0 to 1
  className?: string;
}

export function ConfidenceIndicator({ score, className }: ConfidenceIndicatorProps) {
  let colorClass = "bg-red-500";
  if (score >= 0.9) colorClass = "bg-green-500";
  else if (score >= 0.7) colorClass = "bg-yellow-500";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-800">
        <div
          className={cn("h-full rounded-full", colorClass)}
          style={{ width: `${Math.max(0, Math.min(100, score * 100))}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}