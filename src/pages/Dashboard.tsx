import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CalendarRange, CalendarCheck, FileSpreadsheet, LogOut, BarChart3, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";
import { AgentLinkCard } from "@/components/AgentLinkCard";
import { SubmissionsTable } from "@/components/SubmissionsTable";
import { ExportModal } from "@/components/ExportModal";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { ConfirmationChart } from "@/components/ConfirmationChart";
import { ArchiveTab } from "@/components/dashboard/ArchiveTab";
import { StatusTab } from "@/components/dashboard/StatusTab";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Submission = Tables<"customer_submissions">;

const PAGE_SIZE = 50;

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
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [chartFrom, setChartFrom] = useState<Date | undefined>(undefined);
  const [chartTo, setChartTo] = useState<Date | undefined>(undefined);
  const [activePeriod, setActivePeriod] = useState<number | null>(null);
  const [periodCounts, setPeriodCounts] = useState<number[]>([0, 0, 0]);
  const [chartSubmissions, setChartSubmissions] = useState<Submission[]>([]);
  const [exportSubmissions, setExportSubmissions] = useState<Submission[] | null>(null);

  const now = useMemo(() => new Date(), []);
  const periods = useMemo(() => get10DayPeriods(now), [now]);
  const hasDateFilter = fromDate || toDate;

  const fetchPage = useCallback(async (pageNum: number) => {
    if (!agent) return;
    setLoadingData(true);
    let query = supabase
      .from("customer_submissions")
      .select("*", { count: "exact" })
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false });
    if (hasDateFilter) {
      if (fromDate) {
        const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        query = query.gte("created_at", start.toISOString());
      }
      if (toDate) {
        const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }
    } else {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query = query.gte("created_at", todayStart.toISOString());
    }
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);
    const { data, count } = await query;
    setSubmissions(data || []);
    setTotalCount(count || 0);
    setLoadingData(false);
  }, [agent, fromDate, toDate, hasDateFilter, now]);

  const fetchPeriodCounts = useCallback(async () => {
    if (!agent) return;
    const counts = await Promise.all(
      periods.map(async (p) => {
        const { count } = await supabase
          .from("customer_submissions")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agent.id)
          .gte("created_at", p.start.toISOString())
          .lte("created_at", p.end.toISOString());
        return count || 0;
      })
    );
    setPeriodCounts(counts);
  }, [agent, periods]);

  const fetchChartData = useCallback(async () => {
    if (!agent || !chartFrom || !chartTo) { setChartSubmissions([]); return; }
    const start = new Date(chartFrom.getFullYear(), chartFrom.getMonth(), chartFrom.getDate());
    const end = new Date(chartTo.getFullYear(), chartTo.getMonth(), chartTo.getDate(), 23, 59, 59, 999);
    let allData: Submission[] = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const { data } = await supabase
        .from("customer_submissions")
        .select("*")
        .eq("agent_id", agent.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .range(offset, offset + batchSize - 1);
      if (!data || data.length === 0) break;
      allData = [...allData, ...data];
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    setChartSubmissions(allData);
  }, [agent, chartFrom, chartTo]);

  const fetchAllForExport = useCallback(async () => {
    if (!agent) return [];
    let allData: Submission[] = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      let query = supabase
        .from("customer_submissions")
        .select("*")
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false });
      if (hasDateFilter) {
        if (fromDate) {
          const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
          query = query.gte("created_at", start.toISOString());
        }
        if (toDate) {
          const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);
          query = query.lte("created_at", end.toISOString());
        }
      } else {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte("created_at", todayStart.toISOString());
      }
      query = query.range(offset, offset + batchSize - 1);
      const { data } = await query;
      if (!data || data.length === 0) break;
      allData = [...allData, ...data];
      if (data.length < batchSize) break;
      offset += batchSize;
    }
    return allData;
  }, [agent, fromDate, toDate, hasDateFilter, now]);

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) { navigate("/admin"); return; }
    if (!agent) { navigate("/login"); return; }
    setPage(0);
    fetchPage(0);
    fetchPeriodCounts();
    const channel = supabase
      .channel("submissions-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "customer_submissions", filter: `agent_id=eq.${agent.id}` }, () => {
        fetchPage(0);
        fetchPeriodCounts();
        setPage(0);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [agent, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!agent || authLoading) return;
    setPage(0);
    fetchPage(0);
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchChartData();
  }, [chartFrom, chartTo, fetchChartData]);

  useEffect(() => {
    fetchPage(page);
  }, [page]);

  const handleExportOpen = async () => {
    setExportOpen(true);
    toast.info("Chargement des données pour l'export...");
    const all = await fetchAllForExport();
    setExportSubmissions(all);
  };

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate("/login");
  }, [signOut, navigate]);

  if (authLoading || (loadingData && submissions.length === 0)) {
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
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background wave-bg">
      <header className="glass sticky top-0 z-10 border-b-0">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">ConfirmaPro</h1>
              <p className="text-sm text-muted-foreground">Tableau de bord</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground hidden sm:block">{agent.name}</span>
            <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl" onClick={handleLogout}>
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
            {periods.map((p, i) => (
              <StatCard
                key={i}
                title={p.label}
                subtitle={`${p.start.getDate()}/${p.start.getMonth() + 1} – ${p.end.getDate()}/${p.end.getMonth() + 1}`}
                value={periodCounts[i]}
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
          <div className="glass-card rounded-2xl p-6 space-y-4">
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

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-secondary/50 p-1">
            <TabsTrigger value="today" className="rounded-xl">Confirmations du jour</TabsTrigger>
            <TabsTrigger value="archives" className="rounded-xl">Archives</TabsTrigger>
            <TabsTrigger value="status" className="rounded-xl">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Confirmations du jour
                  <span className="text-sm font-normal text-muted-foreground ml-2">({totalCount})</span>
                </h2>
                <Button onClick={handleExportOpen} className="gap-2 rounded-xl">
                  <FileSpreadsheet className="h-4 w-4" />
                  Exporter
                </Button>
              </div>
              <SubmissionsTable
                submissions={submissions}
                onDelete={(id) => {
                  setSubmissions((prev) => prev.filter((s) => s.id !== id));
                  setTotalCount((prev) => prev - 1);
                }}
                page={page}
                pageSize={PAGE_SIZE}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} sur {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      Précédent
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archives">
            <ArchiveTab agentId={agent.id} />
          </TabsContent>

          <TabsContent value="status">
            <StatusTab agentId={agent.id} />
          </TabsContent>
        </Tabs>
      </main>

      <ExportModal
        open={exportOpen}
        onOpenChange={(open) => {
          setExportOpen(open);
          if (!open) setExportSubmissions(null);
        }}
        submissions={exportSubmissions || []}
      />
    </div>
  );
}
