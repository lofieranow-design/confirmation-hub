import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, eachDayOfInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"customer_submissions">;

interface ConfirmationChartProps {
  submissions: Submission[];
  from: Date;
  to: Date;
}

export function ConfirmationChart({ submissions, from, to }: ConfirmationChartProps) {
  const data = useMemo(() => {
    const days = eachDayOfInterval({ start: from, end: to });
    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 59, 59, 999);
      const count = submissions.filter(s => {
        const d = new Date(s.created_at);
        return d >= dayStart && d <= dayEnd;
      }).length;
      return {
        date: format(day, "dd MMM", { locale: fr }),
        confirmations: count,
      };
    });
  }, [submissions, from, to]);

  const total = data.reduce((sum, d) => sum + d.confirmations, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-bold text-foreground">{total}</span> confirmation(s)
        </p>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Bar dataKey="confirmations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
