import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CalendarRange, CalendarCheck, FileSpreadsheet, LogOut, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { AgentLinkCard } from "@/components/AgentLinkCard";
import { SubmissionsTable } from "@/components/SubmissionsTable";
import { ExportModal } from "@/components/ExportModal";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"customer_submissions">;

export default function Dashboard() {
  const { agent, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [exportOpen, setExportOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) { navigate("/admin"); return; }
    if (!agent) { navigate("/login"); return; }
    setLoadingData(true);
    fetchSubmissions();

    const channel = supabase
      .channel("submissions-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_submissions" }, (payload) => {
        const newSub = payload.new as Submission;
        if (newSub.agent_id === agent.id) {
          setSubmissions(prev => [newSub, ...prev]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agent, authLoading, isAdmin, navigate]);

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from("customer_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
    setLoadingData(false);
  };

  const filteredByDate = submissions.filter(s => {
    const d = new Date(s.created_at);
    if (fromDate) {
      const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      if (d < start) return false;
    }
    if (toDate) {
      const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const getStats = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      today: submissions.filter(s => new Date(s.created_at) >= startOfDay).length,
      week: submissions.filter(s => new Date(s.created_at) >= startOfWeek).length,
      month: submissions.filter(s => new Date(s.created_at) >= startOfMonth).length,
    };
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!agent) return null;

  const stats = getStats();
  const hasDateFilter = fromDate || toDate;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">ConfirmaPro</h1>
            <p className="text-sm text-muted-foreground">Tableau de bord</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => navigate("/archives")}>
              <Archive className="h-4 w-4" />
              Archives
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden" onClick={() => navigate("/archives")}>
              <Archive className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground hidden sm:block">{agent.name}</span>
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Statistiques en direct</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Aujourd'hui" value={stats.today} icon={CalendarDays} variant="today" />
            <StatCard title="Cette semaine" value={stats.week} icon={CalendarRange} variant="week" />
            <StatCard title="Ce mois" value={stats.month} icon={CalendarCheck} variant="month" />
          </div>
        </section>

        <section>
          <AgentLinkCard suffixCode={agent.suffix_code} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-foreground">
              {hasDateFilter ? "Confirmations filtrées" : "Confirmations du jour"}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
              <Button onClick={() => setExportOpen(true)} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>
          <SubmissionsTable
            submissions={hasDateFilter ? filteredByDate : filteredByDate.filter(s => {
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              return new Date(s.created_at) >= start;
            })}
            onDelete={(id) => setSubmissions((prev) => prev.filter((s) => s.id !== id))}
          />
        </section>
      </main>

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} submissions={hasDateFilter ? filteredByDate : filteredByDate.filter(s => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return new Date(s.created_at) >= start;
      })} />
    </div>
  );
}
