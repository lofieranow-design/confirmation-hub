import ExcelJS from "exceljs";
import regionsData from "@/lib/regions-data.json";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"customer_submissions">;

interface ExportFormData {
  so: string;
  nom_marchandise: string;
  montant_total: string;
  autoriser_ouverture: string;
  remarque: string;
}

export async function buildExcelWorkbook(
  submissions: Submission[],
  form: ExportFormData
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();

  // ── Sheet 1: Modèle d'importation ──
  const ws1 = wb.addWorksheet("Modèle d'importation");

  // Column widths
  ws1.getColumn(1).width = 11.5;
  ws1.getColumn(2).width = 15.5;
  ws1.getColumn(3).width = 14.66;
  ws1.getColumn(4).width = 31.66;
  ws1.getColumn(5).width = 21.5;
  ws1.getColumn(6).width = 12.83;
  ws1.getColumn(7).width = 12.16;
  ws1.getColumn(8).width = 13.16;
  ws1.getColumn(9).width = 16.16;
  ws1.getColumn(10).width = 14.5;

  const headerFillBlue: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E2F3" },
  };
  const headerFillOrange: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFCE4D6" },
  };
  const boldFont: Partial<ExcelJS.Font> = { bold: true, size: 11 };
  const redBoldFont: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: "FFFF0000" } };
  const greenBoldFont: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: "FF008000" } };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Row 1 - merged headers
  ws1.mergeCells("A1:A2");
  ws1.mergeCells("B1:E1");
  ws1.mergeCells("F1:J1");

  const a1 = ws1.getCell("A1");
  a1.value = "Waybill";
  a1.font = boldFont;
  a1.fill = headerFillBlue;
  a1.border = thinBorder;
  a1.alignment = { vertical: "middle", horizontal: "center" };

  const b1 = ws1.getCell("B1");
  b1.value = "Informations sur le destinataire";
  b1.font = greenBoldFont;
  b1.fill = headerFillOrange;
  b1.border = thinBorder;
  b1.alignment = { horizontal: "center" };

  const f1 = ws1.getCell("F1");
  f1.value = "Informations de base";
  f1.font = boldFont;
  f1.fill = headerFillBlue;
  f1.border = thinBorder;
  f1.alignment = { horizontal: "center" };

  // Row 2 - sub-headers
  const headers2 = [
    { col: 2, val: "Nom", font: greenBoldFont, fill: headerFillOrange },
    { col: 3, val: "Téléphone", font: greenBoldFont, fill: headerFillOrange },
    { col: 4, val: "Zone", font: greenBoldFont, fill: headerFillOrange },
    { col: 5, val: "Adresse complète", font: greenBoldFont, fill: headerFillOrange },
    { col: 6, val: "S.O.", font: boldFont, fill: headerFillBlue },
    { col: 7, val: "Nom de la marchandise", font: redBoldFont, fill: headerFillBlue },
    { col: 8, val: "Montant total", font: redBoldFont, fill: headerFillBlue },
    { col: 9, val: "Autoriser l'ouverture du colis ou non ", font: boldFont, fill: headerFillBlue },
    { col: 10, val: "Remarque", font: boldFont, fill: headerFillBlue },
  ];

  headers2.forEach((h) => {
    const cell = ws1.getRow(2).getCell(h.col);
    cell.value = h.val;
    cell.font = h.font;
    cell.fill = h.fill;
    cell.border = thinBorder;
    cell.alignment = { wrapText: true, vertical: "middle" };
  });

  // Data rows starting at row 3
  submissions.forEach((sub, i) => {
    const row = ws1.getRow(i + 3);
    row.getCell(2).value = sub.customer_name ?? "";
    const phoneCell = row.getCell(3);
    phoneCell.value = sub.phone ?? "";
    phoneCell.numFmt = "@";
    row.getCell(4).value = sub.city ?? "";
    row.getCell(5).value = sub.address ?? "";
    if (form.so) row.getCell(6).value = form.so;
    row.getCell(7).value = form.nom_marchandise;
    const montant = parseFloat(form.montant_total);
    row.getCell(8).value = isNaN(montant) ? form.montant_total : montant;
    if (form.autoriser_ouverture) row.getCell(9).value = form.autoriser_ouverture;
    if (form.remarque) row.getCell(10).value = form.remarque;

    // Add data validation for column I (Yes/No)
    row.getCell(9).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Yes,No"'],
    };

    row.commit();
  });

  // ── Sheet 2: Guide d'importation ──
  const ws2 = wb.addWorksheet("Guide d'importation");
  ws2.getColumn(1).width = 40.16;
  ws2.getColumn(2).width = 18;
  ws2.getColumn(3).width = 3.66;
  ws2.getColumn(4).width = 51.5;
  ws2.getColumn(5).width = 22.16;

  const whiteBold: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  const blackBold: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FF000000" }, size: 11 };
  const grayFont: Partial<ExcelJS.Font> = { color: { argb: "FF808080" }, size: 11 };
  const redFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFF0000" }, size: 11 };

  const darkFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D0D0D" } };
  const redFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
  const grayFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF808080" } };

  ws2.mergeCells("A1:E1");
  const ga1 = ws2.getCell("A1");
  ga1.value = "⚠ Veuillez lire ce guide pour remplir votre commande avec succès ⚠️";
  ga1.font = whiteBold;
  ga1.fill = darkFill;
  ga1.alignment = { horizontal: "center", wrapText: true };

  ws2.mergeCells("A2:E2");
  const ga2 = ws2.getCell("A2");
  ga2.value = "Le tableau est divisé en deux parties principales：\nInformations client + Détails de la commande";
  ga2.font = blackBold;
  ga2.alignment = { wrapText: true };

  ws2.mergeCells("A3:E3");
  ws2.getCell("A3").value = "Waybill:facultatif; Numéro de lettre de transport logistique, par segment de numéro non attribué par faster, s'il vous plaît contacter le vendeur si nécessaire.";
  ws2.getCell("A3").font = blackBold;
  ws2.getCell("A3").alignment = { wrapText: true };

  ws2.mergeCells("A4:B4");
  const ga4 = ws2.getCell("A4");
  ga4.value = "Informations client";
  ga4.font = whiteBold;
  ga4.fill = redFill;

  ws2.mergeCells("D4:E4");
  const gd4 = ws2.getCell("D4");
  gd4.value = "informations de base ";
  gd4.font = whiteBold;
  gd4.fill = grayFill;

  const guideRows: Array<[string, string, string | null, string, string]> = [
    ["Nom\nNom complet du destinataire", "*obligatoire", null, "S.O.\nVotre numéro de commande, les doublons ne sont pas autorisés.", "facultatif"],
    ["Téléphone\nNuméro de téléphone du destinataire, longueur du numéro : 10 chiffres", "*obligatoire", null, "Nom de la marchandise\nNom ou description de l'article", "*obligatoire"],
    ["Zone\nVeuillez sélectionner le district dans la liste des zones disponibles. Si vous ne trouvez pas le district souhaité, veuillez contacter le service client", "*obligatoire", null, "Montant total\nSi ce n'est pas un paiement à la livraison ou pas de COD ，le montant total sera 0", "*obligatoire"],
    ["here.", null, null, "Autoriser l'ouverture du colis ou non \nSi vous n'autorisez pas le client à ouvrir le colis avant réception, laissez vide", "facultatif"],
    ["Adresse complète\nadresse complète du destinataire", "*obligatoire", null, "Remarque", "facultatif"],
  ];

  guideRows.forEach((row, i) => {
    const r = ws2.getRow(i + 5);
    r.getCell(1).value = row[0];
    r.getCell(1).font = blackBold;
    r.getCell(1).alignment = { wrapText: true };
    if (row[1]) {
      r.getCell(2).value = row[1];
      r.getCell(2).font = row[1] === "*obligatoire" ? redFont : grayFont;
    }
    if (row[3]) {
      r.getCell(4).value = row[3];
      r.getCell(4).font = blackBold;
      r.getCell(4).alignment = { wrapText: true };
    }
    if (row[4]) {
      r.getCell(5).value = row[4];
      r.getCell(5).font = row[4] === "*obligatoire" ? redFont : grayFont;
    }
    r.commit();
  });

  // ── Sheet 3: Région ──
  const ws3 = wb.addWorksheet("Région");
  ws3.getColumn(1).width = 28.5;
  ws3.getColumn(2).width = 22.16;

  const grayHeaderFill: ExcelJS.FillPattern = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC0C0C0" },
  };

  ws3.getRow(1).getCell(1).value = "Zone/Ville d'appartenance";
  ws3.getRow(1).getCell(1).font = boldFont;
  ws3.getRow(1).getCell(1).fill = grayHeaderFill;
  ws3.getRow(1).getCell(2).value = "Province d'appartenance";
  ws3.getRow(1).getCell(2).font = boldFont;
  ws3.getRow(1).getCell(2).fill = grayHeaderFill;

  (regionsData as string[][]).forEach((region, i) => {
    const row = ws3.getRow(i + 2);
    row.getCell(1).value = region[0];
    row.getCell(2).value = region[1];
    row.commit();
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
