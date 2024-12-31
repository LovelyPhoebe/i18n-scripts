const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function getJsonData(dir) {
    const fileStr = fs.readFileSync(dir, { encoding: 'utf-8' });
    if (fileStr) {
        return JSON.parse(fileStr)
    }
    return {}
}

function outputXlsx(keys) {
    const data = keys.map(key => [key]);
    // 创建sheet
    const sheet = XLSX.utils.aoa_to_sheet(data);
    // 创建工作簿
    const wookbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wookbook, sheet);
    XLSX.writeFile(wookbook, "i18n/translations.xlsx")
}   

function main(dir) {
    const fileJson = getJsonData(dir);
    const keys = Object.keys(fileJson);
    if (keys.length) {
        outputXlsx(keys)
    }
}

main(process.argv[2])