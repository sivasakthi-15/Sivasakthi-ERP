const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");

content = content.replace(
  /\.a4-print-measure-mode \.print-page > \.flex-1,\s*\.a4-print-measure-mode \.print-page-products,\s*\.a4-print-measure-mode \.print-page-measure \.print-page-products \{/g,
  `.a4-print-measure-mode .print-page > .flex-1 {`
);

content = content.replace(
  /\.a4-print-measure-mode \.print-page-measure \.print-page-content,\s*\.a4-print-measure-mode \.print-page-measure \.flex-1 \{/g,
  `.a4-print-measure-mode .print-page-measure .print-page-content,
    .a4-print-measure-mode .print-page-measure .flex-1 {`
);

// Add specific rule for table in measure mode to be visible without display flex
content += `\n.a4-print-measure-mode .print-page-products { overflow: visible !important; }\n`;

fs.writeFileSync("src/index.css", content, "utf8");
console.log("Fixed index.css");
