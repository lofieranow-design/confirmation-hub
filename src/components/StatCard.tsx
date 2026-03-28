import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "today" | "week" | "month";
}

const variantClasses = {
  today: "stat-card-today",
  week: "stat-card-week",
  month: "stat-card-month",
};

const iconColors = {
  today: "text-primary",
  week: "text-[hsl(210,60%,50%)]",
  month: "text-[hsl(265,50%,55%)]",
};

export function StatCard({ title, value, icon: Icon, variant }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-6 animate-fade-in ${variantClasses[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className={`h-5 w-5 ${iconColors[variant]}`} />
      </div>
      <p className={`text-4xl font-bold tracking-tight animate-count-up ${iconColors[variant]}`}>
        {value}
      </p>
    </div>
  );
}
