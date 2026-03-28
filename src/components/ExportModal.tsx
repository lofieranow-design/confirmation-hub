import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"customer_submissions">;

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissions: Submission[];
}

interface ExportFormData {
  so: string;
  nom_marchandise: string;
  montant_total: string;
  autoriser_ouverture: string;
  remarque: string;
}

export function ExportModal({ open, onOpenChange, submissions }: ExportModalProps) {
  const [form, setForm] = useState<ExportFormData>({
    so: "",
    nom_marchandise: "",
    montant_total: "",
    autoriser_ouverture: "",
    remarque: "",
  });
  const [generating, setGenerating] = useState(false);

  const handleChange = (field: keyof ExportFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { utils, writeFile } = await import("xlsx");
      const data = submissions.map(sub => ({
        "Nom du Client": sub.customer_name,
        "Téléphone": sub.phone,
        "Adresse": sub.address,
        "Ville": sub.city,
        "Date": new Date(sub.created_at).toLocaleDateString("fr-FR"),
        "S.O.": form.so,
        "Nom de la marchandise": form.nom_marchandise,
        "Montant total": form.montant_total,
        "Autoriser l'ouverture": form.autoriser_ouverture,
        "Remarque": form.remarque,
      }));
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Confirmations");
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String((row as Record<string, string>)[key] || "").length)) + 2,
      }));
      ws["!cols"] = colWidths;
      writeFile(wb, `confirmations_${new Date().toISOString().split("T")[0]}.xlsx`);
      onOpenChange(false);
    } catch {
      console.error("Export failed");
    } finally {
      setGenerating(false);
    }
  };

  const isValid = form.so && form.nom_marchandise && form.montant_total && form.autoriser_ouverture;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Exporter les confirmations
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Remplissez les détails de la commande. Ces informations seront ajoutées à chaque ligne du fichier Excel.
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="so">S.O.</Label>
              <Input id="so" value={form.so} onChange={e => handleChange("so", e.target.value)} placeholder="Numéro S.O." />
            </div>
            <div>
              <Label htmlFor="nom_marchandise">Nom de la marchandise</Label>
              <Input id="nom_marchandise" value={form.nom_marchandise} onChange={e => handleChange("nom_marchandise", e.target.value)} placeholder="Nom du produit" />
            </div>
            <div>
              <Label htmlFor="montant_total">Montant total</Label>
              <Input id="montant_total" value={form.montant_total} onChange={e => handleChange("montant_total", e.target.value)} placeholder="Ex: 299 MAD" />
            </div>
            <div>
              <Label htmlFor="autoriser_ouverture">Autoriser l'ouverture du colis</Label>
              <Select value={form.autoriser_ouverture} onValueChange={v => handleChange("autoriser_ouverture", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Oui">Oui</SelectItem>
                  <SelectItem value="Non">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="remarque">Remarque</Label>
              <Textarea id="remarque" value={form.remarque} onChange={e => handleChange("remarque", e.target.value)} placeholder="Notes supplémentaires..." rows={2} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleGenerate} disabled={!isValid || generating}>
            {generating ? "Génération..." : "Générer le fichier Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
