const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

content = content.replace(
  /<div className="print-invoice-totals z-10 relative mt-1 border-t border-gray-200 pt-1.5">\n                  <div className="grid grid-cols-2 gap-3 items-start">\n                  <div className="grid grid-cols-2 gap-3 items-start">/g,
  `<div className="print-invoice-totals z-10 relative mt-1 border-t border-gray-200 pt-1.5">\n                  <div className="grid grid-cols-2 gap-3 items-start">`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Fixed duplicate grid-cols-2 in BillPreview");
