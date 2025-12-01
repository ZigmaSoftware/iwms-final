import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function DataCard({ title, children, className, action, compact }: DataCardProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700',
      'backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90',
      compact ? 'p-3' : 'p-4',
      className
    )}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className={cn(
            'font-semibold text-gray-800 dark:text-gray-100',
            compact ? 'text-sm' : 'text-base'
          )}>
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
