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

export function StatCard({ title, value, icon: Icon, variant, subtitle, onClick, active }: StatCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-6 animate-fade-in transition-all duration-300 ${variantClasses[variant]} ${onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10" : ""} ${active ? "ring-2 ring-primary shadow-lg shadow-primary/15" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {subtitle && <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <p className="text-4xl font-bold tracking-tight animate-count-up text-primary">
        {value}
      </p>
    </div>
  );
}
