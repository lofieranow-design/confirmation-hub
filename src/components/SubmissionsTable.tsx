import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Radio, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Submission = Tables<"customer_submissions">;

interface SubmissionsTableProps {
  submissions: Submission[];
  onDelete?: (id: string) => void;
  page?: number;
  pageSize?: number;
}

export function SubmissionsTable({ submissions, onDelete, page = 0, pageSize = 50 }: SubmissionsTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("customer_submissions").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Confirmation supprimée");
      onDelete?.(id);
    }
    setDeleting(null);
  };

  if (submissions.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
        <p className="text-muted-foreground">Aucune confirmation pour aujourd'hui.</p>
      </div>
    );
  }

  const startIndex = page * pageSize;

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-border/50">
        <Radio className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Aperçu en direct</span>
        <span className="text-xs text-muted-foreground">— {submissions.length} sur cette page</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="bg-primary/8 border border-border/30 px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-foreground" rowSpan={2}>
                #
              </th>
              <th className="bg-primary/12 border border-border/30 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-foreground" colSpan={4}>
                Informations sur le destinataire
              </th>
              <th className="bg-primary/8 border border-border/30 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-foreground" rowSpan={2}>
                Date
              </th>
              <th className="bg-primary/8 border border-border/30 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-foreground" rowSpan={2}>
                Action
              </th>
            </tr>
            <tr>
              <th className="bg-primary/6 border border-border/30 px-3 py-2 text-left text-xs font-semibold text-foreground">Nom</th>
              <th className="bg-primary/6 border border-border/30 px-3 py-2 text-left text-xs font-semibold text-foreground">Téléphone</th>
              <th className="bg-primary/6 border border-border/30 px-3 py-2 text-left text-xs font-semibold text-foreground">Zone</th>
              <th className="bg-primary/6 border border-border/30 px-3 py-2 text-left text-xs font-semibold text-foreground">Adresse complète</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub, idx) => (
              <tr key={sub.id} className="hover:bg-primary/3 transition-colors">
                <td className="border border-border/30 px-3 py-2.5 text-muted-foreground text-center">{startIndex + idx + 1}</td>
                <td className="border border-border/30 px-3 py-2.5 font-medium text-foreground">{sub.customer_name}</td>
                <td className="border border-border/30 px-3 py-2.5 text-muted-foreground">{sub.phone}</td>
                <td className="border border-border/30 px-3 py-2.5 text-muted-foreground">{sub.city}</td>
                <td className="border border-border/30 px-3 py-2.5 text-muted-foreground">{sub.address}</td>
                <td className="border border-border/30 px-3 py-2.5 text-muted-foreground text-center">
                  {format(new Date(sub.created_at), "dd MMM yyyy, HH:mm", { locale: fr })}
                </td>
                <td className="border border-border/30 px-3 py-2.5 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
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
  );
}
