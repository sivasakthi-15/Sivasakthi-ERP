const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");

content = content.replace(
  /\.a4-print-measure-mode \.print-page > \.flex-1 \{/g,
  `.a4-print-measure-mode .print-page > .flex-1,
  .a4-print-measure-mode .print-page-products,
  .a4-print-measure-mode .print-page-measure .print-page-products {`
);

// Also ensure that the table itself has overflow visible
content = content.replace(
  /\.print-page-products \{\s*flex: 1 1 auto !important;\s*min-height: 0 !important;\s*overflow: hidden !important;\s*\}/,
  `.print-page-products {
      flex: 1 1 auto !important;
      min-height: 0 !important;
      overflow: hidden !important;
    }`
);

fs.writeFileSync("src/index.css", content, "utf8");
console.log("Updated index.css");
