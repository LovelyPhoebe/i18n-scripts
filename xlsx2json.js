const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function readXlsxToJson(filePath) {
    // 读取 XLSX 文件
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // 获取第一个sheet
    const sheet = workbook.Sheets[sheetName]; // 获取对应sheet的数据
    
    // 将sheet转换为JSON，假设第一列是key，第二列是value
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // 以数组形式读取数据
    const result = {};

    json.forEach(row => {
        if (row[0] && row[1]) { // 确保第一列（key）和第二列（value）都有数据
            result[row[0]] = row[1]; // 将key和value存入对象
        }
    });

    return result;
}

function outputJson(data, outputFile) {
    // 检测目录
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    // 输出为JSON文件
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(outputFile, jsonString, { encoding: 'utf-8' });
}

function main(inputFile, outputFile) {
    const jsonData = readXlsxToJson(inputFile);
    if (jsonData) {
        outputJson(jsonData, outputFile);
        console.log(`JSON file saved at: ${outputFile}`);
    } else {
        console.log('No valid data found in the XLSX file.');
    }
}

// 获取命令行参数
const inputFile = process.argv[2];
const outputFile = path.join(process.cwd(), 'translation', 'output.json');

main(inputFile, outputFile);
