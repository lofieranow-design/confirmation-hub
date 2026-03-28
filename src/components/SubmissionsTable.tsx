import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Radio } from "lucide-react";

type Submission = Tables<"customer_submissions">;

interface SubmissionsTableProps {
  submissions: Submission[];
}

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center animate-fade-in">
        <p className="text-muted-foreground">Aucune confirmation pour aujourd'hui.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b">
        <Radio className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Aperçu en direct</span>
        <span className="text-xs text-muted-foreground">— {submissions.length} confirmation(s)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Zone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adresse complète</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {submissions.map((sub, idx) => (
              <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm text-muted-foreground">{idx + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-card-foreground">{sub.customer_name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{sub.phone}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{sub.city}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{sub.address}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {format(new Date(sub.created_at), "dd MMM yyyy, HH:mm", { locale: fr })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
