import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CalendarRange, CalendarCheck, FileSpreadsheet, LogOut, Archive, BarChart3, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { AgentLinkCard } from "@/components/AgentLinkCard";
import { SubmissionsTable } from "@/components/SubmissionsTable";
import { ExportModal } from "@/components/ExportModal";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { ConfirmationChart } from "@/components/ConfirmationChart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"customer_submissions">;

function get10DayPeriods(now: Date) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return [
    { label: "1 – 10", start: new Date(year, month, 1), end: new Date(year, month, 10, 23, 59, 59, 999) },
    { label: "11 – 20", start: new Date(year, month, 11), end: new Date(year, month, 20, 23, 59, 59, 999) },
    { label: `21 – ${lastDay}`, start: new Date(year, month, 21), end: new Date(year, month, lastDay, 23, 59, 59, 999) },
  ];
}

export default function Dashboard() {
  const { agent, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [exportOpen, setExportOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [chartFrom, setChartFrom] = useState<Date | undefined>(undefined);
  const [chartTo, setChartTo] = useState<Date | undefined>(undefined);
  const [activePeriod, setActivePeriod] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) { navigate("/admin"); return; }
    if (!agent) { navigate("/login"); return; }
    setLoadingData(true);
    fetchSubmissions();

    const channel = supabase
      .channel("submissions-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_submissions", filter: `agent_id=eq.${agent.id}` }, (payload) => {
        setSubmissions(prev => [payload.new as Submission, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [agent, authLoading, isAdmin, navigate]);

  const fetchSubmissions = async () => {
    if (!agent) return;
    const { data } = await supabase
      .from("customer_submissions")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
    setLoadingData(false);
  };

  const hasDateFilter = fromDate || toDate;

  const filteredByDate = useMemo(() => submissions.filter(s => {
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
  }), [submissions, fromDate, toDate]);

  const now = useMemo(() => new Date(), []);
  const periods = useMemo(() => get10DayPeriods(now), [now]);

  const periodStats = useMemo(() => periods.map(p => ({
    ...p,
    count: submissions.filter(s => {
      const d = new Date(s.created_at);
      return d >= p.start && d <= p.end;
    }).length,
  })), [periods, submissions]);

  const chartSubmissions = useMemo(() => submissions.filter(s => {
    if (!chartFrom || !chartTo) return false;
    const d = new Date(s.created_at);
    const start = new Date(chartFrom.getFullYear(), chartFrom.getMonth(), chartFrom.getDate());
    const end = new Date(chartTo.getFullYear(), chartTo.getMonth(), chartTo.getDate(), 23, 59, 59, 999);
    return d >= start && d <= end;
  }), [submissions, chartFrom, chartTo]);

  const todaySubmissions = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return filteredByDate.filter(s => new Date(s.created_at) >= start);
  }, [filteredByDate, now]);

  const displayedSubmissions = hasDateFilter ? filteredByDate : todaySubmissions;

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate("/login");
  }, [signOut, navigate]);

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!agent) return null;

  const periodIcons = [CalendarDays, CalendarRange, CalendarCheck] as const;
  const periodVariants = ["period1", "period2", "period3"] as const;
  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">ConfirmaPro</h1>
            <p className="text-sm text-muted-foreground">Tableau de bord</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => navigate("/order-status")}>
              <ClipboardList className="h-4 w-4" />
              Status
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden" onClick={() => navigate("/order-status")}>
              <ClipboardList className="h-4 w-4" />
            </Button>
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
          <h2 className="text-lg font-semibold text-foreground mb-1">Statistiques en direct</h2>
          <p className="text-sm text-muted-foreground mb-4 capitalize">{monthName}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {periodStats.map((p, i) => (
              <StatCard
                key={i}
                title={p.label}
                subtitle={`${p.start.getDate()}/${p.start.getMonth() + 1} – ${p.end.getDate()}/${p.end.getMonth() + 1}`}
                value={p.count}
                icon={periodIcons[i]}
                variant={periodVariants[i]}
                active={activePeriod === i}
                onClick={() => {
                  setActivePeriod(i);
                  setChartFrom(p.start);
                  setChartTo(p.end);
                }}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Analyse par période</h2>
          </div>
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <DateRangeFilter from={chartFrom} to={chartTo} onFromChange={(d) => { setChartFrom(d); setActivePeriod(null); }} onToChange={(d) => { setChartTo(d); setActivePeriod(null); }} />
            {chartFrom && chartTo ? (
              <ConfirmationChart submissions={chartSubmissions} from={chartFrom} to={chartTo} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sélectionnez une date de début et de fin pour afficher le graphique.
              </p>
            )}
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
            submissions={displayedSubmissions}
            onDelete={(id) => setSubmissions((prev) => prev.filter((s) => s.id !== id))}
          />
        </section>
      </main>

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} submissions={displayedSubmissions} />
    </div>
  );
}
