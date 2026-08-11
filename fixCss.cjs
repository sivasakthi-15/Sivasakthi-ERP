const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");
content = content.replace(
  /\.a4-print-measure-mode \.print-page-measure \{[\s\S]*?\}/,
  `.a4-print-measure-mode .print-page-measure {
      display: flex !important;
      flex-direction: column !important;
      width: 210mm !important;
      height: 297mm !important;
      max-height: 297mm !important;
      min-height: 297mm !important;
      padding: 10mm !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      visibility: hidden !important;
      position: absolute !important;
      pointer-events: none !important;
      left: -9999px !important;
      top: -9999px !important;
    }`
);
fs.writeFileSync("src/index.css", content, "utf8");
console.log("Updated index.css");
