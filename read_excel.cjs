const XLSX = require('xlsx');
const workbook = XLSX.readFile('/Users/pc/Desktop/Télécharger le modèle V1.3.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data.slice(0, 5), null, 2));
