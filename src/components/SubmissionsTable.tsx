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
        <table className="w-full text-sm">
          {/* Two-section header matching the Excel template */}
          <thead>
            <tr>
              <th className="bg-[hsl(180,30%,85%)] border border-border px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-foreground" rowSpan={2}>
                #
              </th>
              <th className="bg-[hsl(45,40%,85%)] border border-border px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-foreground" colSpan={4}>
                Informations sur le destinataire
              </th>
              <th className="bg-[hsl(180,30%,85%)] border border-border px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-foreground" rowSpan={2}>
                Date
              </th>
            </tr>
            <tr>
              <th className="bg-[hsl(45,40%,88%)] border border-border px-3 py-2 text-left text-xs font-semibold text-foreground">Nom</th>
              <th className="bg-[hsl(45,40%,88%)] border border-border px-3 py-2 text-left text-xs font-semibold text-foreground">Téléphone</th>
              <th className="bg-[hsl(45,40%,88%)] border border-border px-3 py-2 text-left text-xs font-semibold text-foreground">Zone</th>
              <th className="bg-[hsl(45,40%,88%)] border border-border px-3 py-2 text-left text-xs font-semibold text-foreground">Adresse complète</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, idx) => (
              <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                <td className="border border-border px-3 py-2.5 text-muted-foreground text-center">{idx + 1}</td>
                <td className="border border-border px-3 py-2.5 font-medium text-card-foreground">{sub.customer_name}</td>
                <td className="border border-border px-3 py-2.5 text-muted-foreground">{sub.phone}</td>
                <td className="border border-border px-3 py-2.5 text-muted-foreground">{sub.city}</td>
                <td className="border border-border px-3 py-2.5 text-muted-foreground">{sub.address}</td>
                <td className="border border-border px-3 py-2.5 text-muted-foreground text-center">
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
