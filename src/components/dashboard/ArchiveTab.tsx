import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileSpreadsheet, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { ExportModal } from "@/components/ExportModal";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Submission = Tables<"customer_submissions">;

interface ArchiveTabProps {
  agentId: string;
}

export function ArchiveTab({ agentId }: ArchiveTabProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [agentId]);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("customer_submissions")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  };

  const filtered = submissions.filter(s => {
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

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("customer_submissions").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Confirmation supprimée");
      setSubmissions(prev => prev.filter(s => s.id !== id));
    }
    setDeleting(null);
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        <Button onClick={() => setExportOpen(true)} className="gap-2" disabled={filtered.length === 0}>
          <FileSpreadsheet className="h-4 w-4" />
          Exporter ({filtered.length})
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} confirmation(s) {fromDate || toDate ? "dans la période sélectionnée" : "au total"}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Archive className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucune confirmation trouvée.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adresse</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{sub.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sub.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sub.city}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{sub.address}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(sub.created_at), "dd MMM yyyy, HH:mm", { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(sub.id)}
                        disabled={deleting === sub.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} submissions={filtered} />
    </div>
  );
}
