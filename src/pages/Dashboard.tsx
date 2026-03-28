import { useState } from "react";
import { CalendarDays, CalendarRange, CalendarCheck, FileSpreadsheet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { AgentLinkCard } from "@/components/AgentLinkCard";
import { SubmissionsTable } from "@/components/SubmissionsTable";
import { ExportModal } from "@/components/ExportModal";
import { mockAgent, mockSubmissions, getStatsFromSubmissions } from "@/lib/mock-data";

export default function Dashboard() {
  const [exportOpen, setExportOpen] = useState(false);

  const agent = mockAgent;
  const submissions = mockSubmissions;
  const stats = getStatsFromSubmissions(submissions);

  const todaySubmissions = submissions.filter(s => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return new Date(s.created_at) >= start;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">ConfirmaPro</h1>
            <p className="text-sm text-muted-foreground">Tableau de bord</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground hidden sm:block">{agent.name}</span>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Statistiques en direct</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Aujourd'hui" value={stats.today} icon={CalendarDays} variant="today" />
            <StatCard title="Cette semaine" value={stats.week} icon={CalendarRange} variant="week" />
            <StatCard title="Ce mois" value={stats.month} icon={CalendarCheck} variant="month" />
          </div>
        </section>

        {/* Agent Link */}
        <section>
          <AgentLinkCard suffixCode={agent.suffix_code} />
        </section>

        {/* Today's Submissions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Confirmations du jour</h2>
            <Button onClick={() => setExportOpen(true)} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exporter Excel
            </Button>
          </div>
          <SubmissionsTable submissions={todaySubmissions} />
        </section>
      </main>

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        submissions={todaySubmissions}
      />
    </div>
  );
}
