const ExcelJS = require('exceljs');

async function check() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('/Users/pc/Desktop/Télécharger le modèle V1.3.xlsx');

    if (workbook.definedNames && workbook.definedNames.model) {
        console.log(JSON.stringify(workbook.definedNames.model, null, 2));
    } else {
        console.log("No defined names found or model is inaccessible.");
    }
}

check().catch(console.error);
