const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

content = content.replace(
  /const printWindow = window\.open\([\s\S]*?\);/,
  `const printWindow = window.open(
      '',
      '_blank',
      templateType === 'thermal' ? 'width=400,height=600' : 'width=900,height=1200'
    );`
);

content = content.replace(
  /\$\{templateType === 'thermal' \? `<style>[\s\S]*?<\/style>` : ''\}/,
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
          </style>\` : ''}`
);

content = content.replace(
  /<body class="\$\{templateType === 'a4' \? 'bg-white' : ''\}"><\/body>/,
  `<body class="\${templateType === 'a4' ? 'bg-white' : 'thermal-receipt-body'}"></body>`
);

// We should also add thermal-receipt-body to the html element
content = content.replace(
  /<html>\s*<head>/,
  `<html class="\${templateType === 'thermal' ? 'thermal-receipt-body' : ''}">
        <head>`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated BillPreview.tsx for thermal printing.");
