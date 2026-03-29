import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ClipboardList, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "reporte", label: "Reporté", color: "text-orange-500" },
  { value: "retour", label: "Retour", color: "text-destructive" },
  { value: "livre", label: "Livré", color: "text-green-600" },
  { value: "sans_reponse", label: "Sans réponse", color: "text-muted-foreground" },
] as const;

type StatusValue = typeof STATUS_OPTIONS[number]["value"];

interface Submission {
  id: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  created_at: string;
  agent_id: string;
  order_status: string | null;
}

interface StatusTabProps {
  agentId: string;
}

export function StatusTab({ agentId }: StatusTabProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [agentId]);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("customer_submissions")
      .select("id,customer_name,phone,city,address,created_at,agent_id,order_status")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });
    setSubmissions((data as Submission[]) || []);
    setLoading(false);
  };

  const filtered = useMemo(() => submissions.filter(s => {
    const d = new Date(s.created_at);
    if (fromDate) {
      const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      if (d < start) return false;
    }
    if (toDate) {
      const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999);
      if (d > end) return false;
    }
    if (statusFilter !== "all") {
      if (statusFilter === "no_status") return !s.order_status;
      if (s.order_status !== statusFilter) return false;
    }
    return true;
  }), [submissions, fromDate, toDate, statusFilter]);

  const handleStatusChange = useCallback(async (id: string, newStatus: StatusValue, currentStatus: string | null) => {
    const finalStatus = currentStatus === newStatus ? null : newStatus;
    setUpdating(id);
    setSubmissions(prev =>
      prev.map(s => s.id === id ? { ...s, order_status: finalStatus } : s)
    );
    const { error } = await supabase
      .from("customer_submissions")
      .update({ order_status: finalStatus })
      .eq("id", id);
    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
      setSubmissions(prev =>
        prev.map(s => s.id === id ? { ...s, order_status: currentStatus } : s)
      );
    }
    setUpdating(null);
  }, []);

  const statusCounts = useMemo(() => STATUS_OPTIONS.map(opt => ({
    ...opt,
    count: submissions.filter(s => s.order_status === opt.value).length,
  })), [submissions]);

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Chargement...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statusCounts.map(s => (
          <div
            key={s.value}
            className={`rounded-lg border bg-card p-4 text-center cursor-pointer transition-all hover:shadow-md ${statusFilter === s.value ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(statusFilter === s.value ? "all" : s.value)}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeFilter from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="no_status">Sans statut</SelectItem>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} commande(s)</p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucune commande trouvée.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zone</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  {STATUS_OPTIONS.map(opt => (
                    <th key={opt.value} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {opt.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-3 font-medium text-card-foreground">{sub.customer_name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{sub.phone}</td>
                    <td className="px-3 py-3 text-muted-foreground">{sub.city}</td>
                    <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(sub.created_at), "dd MMM yyyy", { locale: fr })}
                    </td>
                    {STATUS_OPTIONS.map(opt => (
                      <td key={opt.value} className="px-3 py-3 text-center">
                        <Checkbox
                          checked={sub.order_status === opt.value}
                          disabled={updating === sub.id}
                          onCheckedChange={() => handleStatusChange(sub.id, opt.value, sub.order_status)}
                        />
                      </td>
                    ))}
                    <td className={`px-3 py-3 text-center text-xs font-medium ${STATUS_OPTIONS.find(o => o.value === sub.order_status)?.color || "text-muted-foreground"}`}>
                      {STATUS_OPTIONS.find(o => o.value === sub.order_status)?.label || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
