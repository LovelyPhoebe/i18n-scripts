const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const excludeDir = ["i18n", "DataPlatform", "locales"];

function dfs(dir) {
  // 需要排除excludeDir目录的文件
  const children = fs.readdirSync(dir).map((s) => path.join(dir, s));
  const result = [];
  children.forEach((s) => {
    if (fs.statSync(s).isDirectory() && !excludeDir.some((d) => s.includes(d)))
      result.push(...dfs(s));
    else if (
      ["js", "ts", "tsx", "json"].some((u) => s.endsWith(u)) &&
      !s.includes(".d.")
    )
      result.push(s);
  });
  return result;
}

function readFile(fileName) {
  const commentRegex = /\/\/.*|\/\*[\s\S]*?\*\//g;
  const text = fs.readFileSync(fileName, { encoding: "utf-8" });
  const cleanText = text.replace(commentRegex, ""); // 去除注释
  const result = [];

  // 匹配 lang?.xxx 或 lang.xxx
  const regex1 = /lang\??.?\.(\w+|[\u4e00-\u9fa5]+)/g;

  //  字符串字面量 或 HTML 标签 等内容中匹配 中文字符

  const regex2 =
    /'([\u4e00-\u9fa5]+)'|">([\u4e00-\u9fa5]+)<|"([\u4e00-\u9fa5]+)"|`([\u4e00-\u9fa5]+)`/g;

  const pattern =
    /'[\u4e00-\u9fa5]+([^']*)'|>[\u4e00-\u9fa5]+<|"[\u4e00-\u9fa5]+([^"]*)[\u4e00-\u9fa5]+"|`[\u4e00-\u9fa5]+.*`/g;
  let match;

  // 匹配 lang?.xxx 和 lang.xxx
  while ((match = regex1.exec(cleanText)) !== null) {
    result.push(match[1]);
  }

  //   while ((match = regex2.exec(cleanText)) !== null) {
  //     result.push(match[1]);
  //   }
  const texts = cleanText.match(pattern);
  if (texts) {

    texts.forEach((text) => {
        result.push(text.replace(/'|<|>|"|`/g, ""));
      });
  }

  // 删除重复的条目
  const uniqueResult = [...new Set([...result])];

  // 按照需求返回文本
  return { translations: uniqueResult };
}

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

/**
 * 比较和现有的翻译的区别，然后将未翻译的内容输出到固定目录
 * 以排查到的为基准
 * @param {*} words // 已找出的需要翻译的语料list
 * @param {*} i18nDir // 需要比较的i18n目录，目录下文件为en-US.json ja-JP.json zh-CN.json
 */
function compare(words, i18nDir) {
  const i18nFiles = fs.readdirSync(i18nDir).filter((s) => s.endsWith(".json"));

  i18nFiles.forEach((fileName) => {
    const fullPath = path.join(i18nDir, fileName);
    const translations = JSON.parse(
      fs.readFileSync(fullPath, { encoding: "utf-8" })
    );

    // Collect matched translations based on words
    const matchedTranslations = {};
    const untranslatedEntries = {};

    if (fileName.indexOf("zh-CN") > -1) {
      words.forEach((word) => {
        if (translations[word] !== undefined) {
          matchedTranslations[word] = translations[word];
        } else {
          untranslatedEntries[word] = word; // key 就是 value 补充输出
        }
      });
    } else {
      words.forEach((word) => {
        if (translations[word] !== undefined) {
          matchedTranslations[word] = translations[word];
        } else {
          untranslatedEntries[word] = "";
        }
      });
    }

    const finalTranslations = {
      ...matchedTranslations,
      ...untranslatedEntries,
    };

    const outputFileName = path.join(
      process.cwd(),
      "i18nUtils",
      fileName.replace(".json", "_filtered.json")
    );

    // Ensure the output directory exists
    ensureDirectoryExistence(outputFileName);

    // Write matched translations to a new JSON file
    fs.writeFileSync(
      outputFileName,
      JSON.stringify(finalTranslations, null, 2)
    );
  });
}

// 直接输出 Excel 文件
function outputExcel(words) {
  // 创建一个包含词汇的二维数组，第一行是"中文"
  const data = [["中文"], ...words.map((word) => [word])];

  // 创建工作簿并添加工作表
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Words");

  // 写入Excel文件
  const outputFileName = path.join(process.cwd(), "i18n", "translations.xlsx");
  XLSX.writeFile(wb, outputFileName);
}

// function main(dir, i18nDir) {
//   const files = dfs(dir);
//   const words = [...new Set(files.map((s) => readFile(s)).flat())];
//   compare(words, i18nDir);
// }

function main(dir) {
  const files = dfs(dir);
  const allTranslations = [];

  // 读取文件并提取翻译文本和变量名
  files.forEach((file) => {
    const { translations } = readFile(file);

    // 合并翻译文本和变量名
    allTranslations.push(...translations);
  });
  // 去重翻译文本和变量名
  const uniqueTranslations = [...new Set(allTranslations)];
  outputExcel([...uniqueTranslations]);
}

main(process.argv[2], process.argv[3]);
