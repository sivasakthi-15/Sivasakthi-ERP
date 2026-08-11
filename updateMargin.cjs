const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// Change @page { margin: 4mm; size: A4 portrait; } to margin: 0;
content = content.replace(
  /@page \{ margin: 4mm; size: A4 portrait; \}/g,
  `@page { margin: 0; size: A4 portrait; }`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated @page margin to 0");
