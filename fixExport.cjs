const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

const importStatement = `import { paginateA4PrintDocument } from '../utils/a4InvoicePrintEngine';\n`;
if (!content.includes(importStatement)) {
    content = importStatement + content;
}

const printFunc = `
export const printA4Element = async () => {
  let element = document.getElementById('a4-print-element');
  let templateType = 'a4';

  if (!element) {
    element = document.getElementById('thermal-print-element');
    templateType = 'thermal';
  }

  if (!element) {
    alert('Print content not found.');
    return;
  }

  const printWindow = window.open(
    '',
    '_blank',
    templateType === 'thermal' ? 'width=350,height=600' : 'width=900,height=1200'
  );

  if (!printWindow) {
    alert('Unable to open print window.');
    return;
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(s => s.outerHTML)
    .join('');

  printWindow.document.write(\`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print</title>
        \${styles}
        <style>
          @media print {
            @page { margin: 0; }
            body { margin: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        \${element.outerHTML}
      </body>
    </html>
  \`);
  printWindow.document.close();

  if (printWindow.document.fonts && printWindow.document.fonts.ready) {
    await printWindow.document.fonts.ready;
  }
  await new Promise(resolve => setTimeout(resolve, 150));

  if (templateType === 'a4') {
    printWindow.document.body.classList.add('a4-print-measure-mode');
    paginateA4PrintDocument(printWindow.document);
    printWindow.document.body.classList.remove('a4-print-measure-mode');
  }

  printWindow.focus();
  printWindow.print();
  printWindow.close();
};
`;

if (!content.includes("export const printA4Element")) {
    content = content + printFunc;
}

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Added printA4Element and import");
