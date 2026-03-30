import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DateRangeFilter } from "./DateRangeFilter";
import { BarChart3, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"customer_submissions">;
type Agent = Tables<"agents">;

interface AdminAgentStatsProps {
  agents: Agent[];
}

export function AdminAgentStats({ agents }: AdminAgentStatsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState<Date | undefined>(undefined);
  const [to, setTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchSubmissions();
    const channel = supabase
      .channel("admin-stats-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_submissions" }, (payload) => {
        setSubmissions(prev => [payload.new as Submission, ...prev]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "customer_submissions" }, (payload) => {
        setSubmissions(prev => prev.filter(s => s.id !== (payload.old as any).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from("customer_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  };

  const filtered = submissions.filter(s => {
    const d = new Date(s.created_at);
    if (from) {
      const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      if (d < start) return false;
    }
    if (to) {
      const end = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const agentStats = agents
    .filter(a => a.email !== "admin@ecom.ma")
    .map(agent => ({
      ...agent,
      count: filtered.filter(s => s.agent_id === agent.id).length,
    }))
    .sort((a, b) => b.count - a.count);

  const total = filtered.length;

  if (loading) {
    return <p className="text-muted-foreground text-sm py-4">Chargement des statistiques...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Statistiques par agent</h2>
          <span className="text-sm text-muted-foreground">— {total} confirmation(s)</span>
        </div>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-primary/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Confirmations</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {agentStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Aucun agent.
                  </td>
                </tr>
              ) : agentStats.map(agent => {
                const pct = total > 0 ? Math.round((agent.count / total) * 100) : 0;
                return (
                  <tr key={agent.id} className="hover:bg-primary/3 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{agent.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {agent.suffix_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-bold text-foreground">{agent.count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
