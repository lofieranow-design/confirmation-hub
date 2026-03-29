const ExcelJS = require('exceljs');
async function fix() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('/Users/pc/Desktop/Télécharger le modèle V1.3.xlsx');

    if (workbook.definedNames && workbook.definedNames.model) {
        // Clear the model completely to avoid saving corrupted named ranges
        workbook.definedNames.model = [];
    }

    await workbook.xlsx.writeFile('fixed.xlsx');
    console.log("Saved fixed.xlsx");
}
fix().catch(console.error);
