const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");

const measureCss = `
    .a4-print-measure-mode .print-page-measure .print-page-content,
    .a4-print-measure-mode .print-page-measure .flex-1 {
      min-height: 0 !important;
      overflow: hidden !important;
      flex: 1 1 0% !important;
    }
`;

content = content + measureCss;
fs.writeFileSync("src/index.css", content, "utf8");
console.log("Updated index.css with strict flex-1 overflow constraints");
