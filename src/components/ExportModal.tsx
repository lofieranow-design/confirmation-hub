import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet, Syringe, Download } from "lucide-react";
import { toast } from "sonner";
import { buildExcelWorkbook } from "@/lib/excel-builder";
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
    setForm((prev) => ({ ...prev, [field]: value }));
    setInjected(false);
  };

  const handleInject = () => {
    setInjected(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const blob = await buildExcelWorkbook(submissions, form);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fileName = `confirmations_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}`;
      link.download = `${fileName}.xlsx`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success("Téléchargement lancé");
      onOpenChange(false);
      setInjected(false);
    } catch (error) {
      console.error("Export failed", error);
      toast.error(error instanceof Error ? error.message : "Le fichier Excel n'a pas pu être généré");
    } finally {
      setGenerating(false);
    }
  };

  const isValid = form.nom_marchandise && form.montant_total;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setInjected(false);
      }}
    >
      <DialogContent className="sm:max-w-lg rounded-2xl">
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
              <Label htmlFor="so">
                S.O. <span className="text-xs text-muted-foreground">(facultatif)</span>
              </Label>
              <Input id="so" value={form.so} onChange={(e) => handleChange("so", e.target.value)} placeholder="Numéro S.O." className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="nom_marchandise">Nom de la marchandise *</Label>
              <Input id="nom_marchandise" value={form.nom_marchandise} onChange={(e) => handleChange("nom_marchandise", e.target.value)} placeholder="Nom du produit" className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="montant_total">Montant total *</Label>
              <Input id="montant_total" value={form.montant_total} onChange={(e) => handleChange("montant_total", e.target.value)} placeholder="Ex: 299" className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="autoriser_ouverture">
                Autoriser l'ouverture du colis <span className="text-xs text-muted-foreground">(facultatif)</span>
              </Label>
              <Select value={form.autoriser_ouverture} onValueChange={(value) => handleChange("autoriser_ouverture", value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="remarque">
                Remarque <span className="text-xs text-muted-foreground">(facultatif)</span>
              </Label>
              <Textarea id="remarque" value={form.remarque} onChange={(e) => handleChange("remarque", e.target.value)} placeholder="Notes supplémentaires..." rows={2} className="rounded-xl" />
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => { onOpenChange(false); setInjected(false); }} className="rounded-xl">
            Annuler
          </Button>
          {!injected ? (
            <Button type="button" onClick={handleInject} disabled={!isValid} className="gap-2 rounded-xl">
              <Syringe className="h-4 w-4" />
              Injecter
            </Button>
          ) : (
            <Button type="button" onClick={handleGenerate} disabled={generating} className="gap-2 rounded-xl">
              <Download className="h-4 w-4" />
              {generating ? "Génération..." : "Générer le fichier Excel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
