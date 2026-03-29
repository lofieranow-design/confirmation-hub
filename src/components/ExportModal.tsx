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
      const base = import.meta.env.BASE_URL || "/";
      const templateUrl = `${base}template.xlsx`.replace("//", "/");
      const response = await fetch(templateUrl, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Template Excel introuvable");
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];

      submissions.forEach((sub, index) => {
        const rowNum = index + 3; // data starts at row 3
        const row = worksheet.getRow(rowNum);

        row.getCell(2).value = sub.customer_name ?? "";
        row.getCell(3).value = sub.phone ?? "";
        row.getCell(4).value = sub.city ?? "";
        row.getCell(5).value = sub.address ?? "";

        if (form.so) {
          row.getCell(6).value = form.so;
        }

        row.getCell(7).value = form.nom_marchandise;
        row.getCell(8).value = form.montant_total;

        if (form.autoriser_ouverture) {
          row.getCell(9).value = form.autoriser_ouverture;
        }

        if (form.remarque) {
          row.getCell(10).value = form.remarque;
        }

        row.commit();
      });

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `confirmations_${new Date().toISOString().split("T")[0]}.xlsx`;
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
              <Label htmlFor="so">
                S.O. <span className="text-xs text-muted-foreground">(facultatif)</span>
              </Label>
              <Input id="so" value={form.so} onChange={(e) => handleChange("so", e.target.value)} placeholder="Numéro S.O." />
            </div>
            <div>
              <Label htmlFor="nom_marchandise">Nom de la marchandise *</Label>
              <Input
                id="nom_marchandise"
                value={form.nom_marchandise}
                onChange={(e) => handleChange("nom_marchandise", e.target.value)}
                placeholder="Nom du produit"
              />
            </div>
            <div>
              <Label htmlFor="montant_total">Montant total *</Label>
              <Input
                id="montant_total"
                value={form.montant_total}
                onChange={(e) => handleChange("montant_total", e.target.value)}
                placeholder="Ex: 299"
              />
            </div>
            <div>
              <Label htmlFor="autoriser_ouverture">
                Autoriser l'ouverture du colis <span className="text-xs text-muted-foreground">(facultatif)</span>
              </Label>
              <Select value={form.autoriser_ouverture} onValueChange={(value) => handleChange("autoriser_ouverture", value)}>
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
              <Label htmlFor="remarque">
                Remarque <span className="text-xs text-muted-foreground">(facultatif)</span>
              </Label>
              <Textarea
                id="remarque"
                value={form.remarque}
                onChange={(e) => handleChange("remarque", e.target.value)}
                placeholder="Notes supplémentaires..."
                rows={2}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => { onOpenChange(false); setInjected(false); }}>
            Annuler
          </Button>
          {!injected ? (
            <Button type="button" onClick={handleInject} disabled={!isValid} className="gap-2">
              <Syringe className="h-4 w-4" />
              Injecter
            </Button>
          ) : (
            <Button type="button" onClick={handleGenerate} disabled={generating} className="gap-2">
              <Download className="h-4 w-4" />
              {generating ? "Génération..." : "Générer le fichier Excel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
