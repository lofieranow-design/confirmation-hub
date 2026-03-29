import { useState } from "react";
import ExcelJS from "exceljs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet, Syringe, Download } from "lucide-react";
import { toast } from "sonner";
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
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellStyles: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      submissions.forEach((sub, index) => {
        const rowIndex = index + 2;

        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 1 })] = { t: "s", v: sub.customer_name ?? "" };
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 2 })] = { t: "s", v: sub.phone ?? "" };
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 3 })] = { t: "s", v: sub.city ?? "" };
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 4 })] = { t: "s", v: sub.address ?? "" };

        if (form.so) {
          worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 5 })] = { t: "s", v: form.so };
        }

        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 6 })] = { t: "s", v: form.nom_marchandise };
        worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 7 })] = { t: "s", v: form.montant_total };

        if (form.autoriser_ouverture) {
          worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 8 })] = { t: "s", v: form.autoriser_ouverture };
        }

        if (form.remarque) {
          worksheet[XLSX.utils.encode_cell({ r: rowIndex, c: 9 })] = { t: "s", v: form.remarque };
        }
      });

      const lastRowIndex = Math.max(submissions.length + 1, 2);
      worksheet["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRowIndex, c: 9 } });

      const output = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true,
      });

      const blob = new Blob([output], {
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
