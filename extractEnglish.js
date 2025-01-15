const fs = require('fs');
const XLSX = require('xlsx');
const path = require("path")

/**
 * Extract keys that are combinations of English letters, numbers, and special character '-' 
 * from a JSON file and export the result to an Excel file with the first column hidden.
 * 
 * @param {string} inputFile - Path to the JSON file.
 * @param {string} outputFile - Path to the output Excel file.
 */
function extractKeysToExcel(inputFile, outputFile) {
    try {
        // Read and parse the JSON file
        const jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

        // Regular expression to match English + numeric + special character '-'
        const keyPattern = /^[a-zA-Z0-9-]+$/;

        // Filter keys matching the pattern
        const results = [];
        for (const key in jsonData) {
            if (keyPattern.test(key)) {
                results.push({ Key: key, Value: jsonData[key] });
            }
        }

        if (results.length === 0) {
            console.log("No matching keys found in the JSON file.");
            return;
        }

        // Create a worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(results);

        // Set column properties to hide the first column (Key)
        worksheet['!cols'] = [{ hidden: true }, { hidden: false }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "FilteredKeys");

        // Write to the Excel file
        XLSX.writeFile(workbook, outputFile);
        console.log(`Extracted ${results.length} items and saved to ${outputFile} (first column hidden).`);
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}

// Example usage
const inputFilePath = process.argv[2]; // Replace with your JSON file path
const outputFilePath = path.join(process.cwd(), "output.xlsx"); // Replace with your desired output file path
extractKeysToExcel(inputFilePath, outputFilePath);
