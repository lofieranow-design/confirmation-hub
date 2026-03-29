import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet, Syringe, Download } from "lucide-react";
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
  const [injected, setInjected] = useState(false);

  const handleChange = (field: keyof ExportFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setInjected(false);
  };

  const handleInject = () => {
    setInjected(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const XLSX = await import("xlsx");

      // Fetch the base template
      const response = await fetch("/template.xlsx");
      if (!response.ok) throw new Error("Impossible de charger le template");
      const arrayBuffer = await response.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

      const ws = wb.Sheets[wb.SheetNames[0]];

      // Data starts at row 3 (0-indexed row 2) — row 1 group headers, row 2 column headers
      submissions.forEach((sub, i) => {
        const r = i + 2; // 0-indexed row
        // B: Nom (col 1)
        ws[XLSX.utils.encode_cell({ r, c: 1 })] = { t: "s", v: sub.customer_name };
        // C: Téléphone (col 2)
        ws[XLSX.utils.encode_cell({ r, c: 2 })] = { t: "s", v: sub.phone };
        // D: Zone (col 3)
        ws[XLSX.utils.encode_cell({ r, c: 3 })] = { t: "s", v: sub.city };
        // E: Adresse complète (col 4)
        ws[XLSX.utils.encode_cell({ r, c: 4 })] = { t: "s", v: sub.address };
        // F: S.O. (col 5)
        if (form.so) ws[XLSX.utils.encode_cell({ r, c: 5 })] = { t: "s", v: form.so };
        // G: Nom de la marchandise (col 6)
        ws[XLSX.utils.encode_cell({ r, c: 6 })] = { t: "s", v: form.nom_marchandise };
        // H: Montant total (col 7)
        ws[XLSX.utils.encode_cell({ r, c: 7 })] = { t: "n", v: Number(form.montant_total) || 0 };
        // I: Autoriser l'ouverture (col 8)
        if (form.autoriser_ouverture) ws[XLSX.utils.encode_cell({ r, c: 8 })] = { t: "s", v: form.autoriser_ouverture };
        // J: Remarque (col 9)
        if (form.remarque) ws[XLSX.utils.encode_cell({ r, c: 9 })] = { t: "s", v: form.remarque };
      });

      // Update sheet range to include all data rows
      const lastRow = Math.max(submissions.length + 2, 2);
      ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: 9 } });

      // Generate and download
      const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `confirmations_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Fichier Excel téléchargé avec succès");
      onOpenChange(false);
      setInjected(false);
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Erreur lors de l'export: " + (err instanceof Error ? err.message : "Erreur inconnue"));
    } finally {
      setGenerating(false);
    }
  };

  // Only nom_marchandise and montant_total are required
  const isValid = form.nom_marchandise && form.montant_total;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setInjected(false); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Exporter les confirmations
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Remplissez les détails de la commande, puis cliquez sur <strong>Injecter</strong> pour préparer le fichier.
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="so">S.O. <span className="text-xs text-muted-foreground">(facultatif)</span></Label>
              <Input id="so" value={form.so} onChange={e => handleChange("so", e.target.value)} placeholder="Numéro S.O." />
            </div>
            <div>
              <Label htmlFor="nom_marchandise">Nom de la marchandise *</Label>
              <Input id="nom_marchandise" value={form.nom_marchandise} onChange={e => handleChange("nom_marchandise", e.target.value)} placeholder="Nom du produit" />
            </div>
            <div>
              <Label htmlFor="montant_total">Montant total *</Label>
              <Input id="montant_total" value={form.montant_total} onChange={e => handleChange("montant_total", e.target.value)} placeholder="Ex: 299" />
            </div>
            <div>
              <Label htmlFor="autoriser_ouverture">Autoriser l'ouverture du colis <span className="text-xs text-muted-foreground">(facultatif)</span></Label>
              <Select value={form.autoriser_ouverture} onValueChange={v => handleChange("autoriser_ouverture", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="remarque">Remarque <span className="text-xs text-muted-foreground">(facultatif)</span></Label>
              <Textarea id="remarque" value={form.remarque} onChange={e => handleChange("remarque", e.target.value)} placeholder="Notes supplémentaires..." rows={2} />
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); setInjected(false); }}>Annuler</Button>
          {!injected ? (
            <Button onClick={handleInject} disabled={!isValid} className="gap-2">
              <Syringe className="h-4 w-4" />
              Injecter
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              <Download className="h-4 w-4" />
              {generating ? "Génération..." : "Générer le fichier Excel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
