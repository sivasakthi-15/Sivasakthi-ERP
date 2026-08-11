const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

content = content.replace(
  /\$\{templateType === 'thermal' \? `(.*?)` : ''\}/s,
  `\${templateType === 'thermal' ? \`<style>
            @page { margin: 0; size: 80mm auto !important; }
            html.thermal-receipt-body, body.thermal-receipt-body {
              margin: 0 !important;
              padding: 0 !important;
              width: 80mm !important;
              min-width: 80mm !important;
              max-width: 80mm !important;
              min-height: auto !important;
              overflow: visible !important;
              font-family: monospace !important;
              background: white !important;
            }
            #thermal-print-element { width: 80mm !important; margin: 0 !important; max-width: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
          </style>\` : \`<style>
            @page { margin: 4mm; size: A4 portrait; }
          </style>\`}`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated inline styles in BillPreview.tsx");
