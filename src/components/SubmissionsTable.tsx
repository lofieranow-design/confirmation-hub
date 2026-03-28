import { CustomerSubmission } from "@/lib/mock-data";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SubmissionsTableProps {
  submissions: CustomerSubmission[];
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adresse</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ville</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-card-foreground">{sub.customer_name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{sub.phone}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{sub.address}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{sub.city}</td>
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
