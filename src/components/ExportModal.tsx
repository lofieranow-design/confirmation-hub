import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      const ExcelJS = await import("exceljs");
      const { saveAs } = await import("file-saver");

      const response = await fetch("/template.xlsx");
      const arrayBuffer = await response.arrayBuffer();

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(arrayBuffer);

      const ws = wb.worksheets[0];

      // Data starts at row 3 — row 1 is group headers, row 2 is column headers
      submissions.forEach((sub, i) => {
        const row = i + 3;
        const excelRow = ws.getRow(row);
        // B: Nom
        excelRow.getCell(2).value = sub.customer_name;
        // C: Téléphone
        excelRow.getCell(3).value = sub.phone;
        // D: Zone
        excelRow.getCell(4).value = sub.city;
        // E: Adresse complète
        excelRow.getCell(5).value = sub.address;
        // F: S.O.
        if (form.so) {
          excelRow.getCell(6).value = form.so;
        }
        // G: Nom de la marchandise
        excelRow.getCell(7).value = form.nom_marchandise;
        // H: Montant total
        excelRow.getCell(8).value = form.montant_total;
        // I: Autoriser l'ouverture
        if (form.autoriser_ouverture) {
          excelRow.getCell(9).value = form.autoriser_ouverture;
        }
        // J: Remarque
        if (form.remarque) {
          excelRow.getCell(10).value = form.remarque;
        }
        excelRow.commit();
      });

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `confirmations_${new Date().toISOString().split("T")[0]}.xlsx`);

      onOpenChange(false);
      setInjected(false);
    } catch (err) {
      console.error("Export failed", err);
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
