const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");

// Change .print-empty-row to .empty-product-row
content = content.replace(/\.print-empty-row/g, ".empty-product-row");

// Remove margin-top: auto !important from footer and page-number-bar
content = content.replace(/margin-top: auto !important;/g, "");

fs.writeFileSync("src/index.css", content, "utf8");
console.log("Updated index.css");
