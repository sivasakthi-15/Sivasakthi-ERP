const fs = require("fs");

let bp = fs.readFileSync("src/components/BillPreview.tsx", "utf8");
bp = bp.replace(/#thermal-print-element \{[\s\S]*?padding: 10mm !important;/g, `#thermal-print-element { width: 100% !important; margin: 0 !important; max-width: none !important; border: none !important; box-shadow: none !important; padding: 0 !important;`);
fs.writeFileSync("src/components/BillPreview.tsx", bp, "utf8");

let sr = fs.readFileSync("src/components/SalesReturnModule.tsx", "utf8");
// Fix thermal style if it has wrong padding
sr = sr.replace(/#thermal-print-element \{[\s\S]*?border: none !important; box-shadow: none !important; \}/g, `#thermal-print-element { width: 100% !important; margin: 0 !important; max-width: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; }`);

// Add A4 styles
sr = sr.replace(
  /<title>Invoice<\/title>\s*\$\{styles\}\s*<\/head>/g,
  `<title>Invoice</title>
              \${styles}
              <style>
                @page { size: A4 portrait; margin: 10mm; }
                body { margin: 0; padding: 0; background: white !important; }
                #a4-print-element { width: 100% !important; max-width: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
              </style>
            </head>`
);

fs.writeFileSync("src/components/SalesReturnModule.tsx", sr, "utf8");
console.log("Updated thermal padding and A4 Sales Return margins");
