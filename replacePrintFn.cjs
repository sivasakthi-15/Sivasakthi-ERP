const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// We extract everything before export const printA4Element
const before = content.substring(0, content.indexOf("export const printA4Element"));

// We extract everything after the end of printA4Element block.
// The block ends at: if (printWindow.document.readyState === 'complete') { ... } else { ... } };
const afterIndex = content.indexOf("};", content.indexOf("if (printWindow.document.readyState === 'complete')"));
const after = content.substring(afterIndex + 2);

const newPrintFn = `export const printA4Element = () => {
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
    .map((style) => style.outerHTML)
    .join('');

  printWindow.document.write(\`
    <!doctype html>
    <html>
      <head>
        <base href="\${window.location.href}" />
        <title>Invoice</title>
        \${styles}
        \${templateType === 'thermal' ? \`<style>
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 0; width: 80mm; min-width: 80mm; overflow: visible; font-family: monospace; background: white !important; }
          #thermal-print-element { width: 100% !important; margin: 0 !important; max-width: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        </style>\` : ''}
      </head>
      <body class="\${templateType === 'a4' ? 'bg-white' : ''}"></body>
    </html>
  \`);
  printWindow.document.close();

  printWindow.document.body.appendChild(element.cloneNode(true));

  const print = async () => {
    const links = Array.from(printWindow.document.querySelectorAll('link[rel="stylesheet"]'));
    await Promise.all(
      links.map((link: any) => {
        if (link.sheet) return Promise.resolve();
        return new Promise((resolve) => {
          link.onload = resolve;
          link.onerror = resolve;
        });
      })
    );
    await printWindow.document.fonts?.ready;
    await new Promise<void>((resolve) => setTimeout(resolve, 150));

    if (templateType === 'a4') {
      printWindow.document.body.classList.add('a4-print-measure-mode');
      paginateA4PrintDocument(printWindow.document);
      printWindow.document.body.classList.remove('a4-print-measure-mode');
    }

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (printWindow.document.readyState === 'complete') {
    void print();
  } else {
    printWindow.addEventListener('load', () => void print(), { once: true });
  }
};
`;

content = before + newPrintFn + after;

// Also update handlePrint in BillPreview.tsx to just call printA4Element
content = content.replace(
  /const handlePrint = \(\) => \{[\s\S]+?return;\s+\}\s+printA4Element\(\);\s+\}\s+\};/g,
  `const handlePrint = () => {
    printA4Element();
  };`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Replaced printA4Element");
