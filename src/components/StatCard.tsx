import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: "period1" | "period2" | "period3";
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
}

const variantClasses = {
  period1: "stat-card-today",
  period2: "stat-card-week",
  period3: "stat-card-month",
};

const iconColors = {
  period1: "text-primary",
  period2: "text-[hsl(210,60%,50%)]",
  period3: "text-[hsl(265,50%,55%)]",
};

export function StatCard({ title, value, icon: Icon, variant, subtitle }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-6 animate-fade-in ${variantClasses[variant]}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
        </div>
        <Icon className={`h-5 w-5 ${iconColors[variant]}`} />
      </div>
      <p className={`text-4xl font-bold tracking-tight animate-count-up ${iconColors[variant]}`}>
        {value}
      </p>
    </div>
  );
}
