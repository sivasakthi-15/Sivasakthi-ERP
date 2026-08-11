const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// A4 Print Wait for Styles
content = content.replace(
  /const print = async \(\) => \{\s+await printWindow\.document\.fonts\?\.ready;\s+await new Promise<void>\(\(resolve\) => printWindow\.requestAnimationFrame\(\(\) => printWindow\.requestAnimationFrame\(\(\) => resolve\(\)\)\)\);\s+printWindow\.document\.body\.classList\.add\('a4-print-measure-mode'\);\s+paginateA4PrintDocument\(printWindow\.document\);\s+printWindow\.document\.body\.classList\.remove\('a4-print-measure-mode'\);\s+printWindow\.focus\(\);\s+printWindow\.print\(\);\s+printWindow\.close\(\);\s+\};/,
  `const print = async () => {
    const links = Array.from(printWindow.document.querySelectorAll('link[rel="stylesheet"]'));
    await Promise.all(links.map((link: any) => {
      if (link.sheet) return Promise.resolve();
      return new Promise(resolve => {
        link.onload = resolve;
        link.onerror = resolve;
      });
    }));
    await printWindow.document.fonts?.ready;
    await new Promise<void>((resolve) => printWindow.requestAnimationFrame(() => printWindow.requestAnimationFrame(() => resolve())));

    printWindow.document.body.classList.add('a4-print-measure-mode');
    paginateA4PrintDocument(printWindow.document);
    printWindow.document.body.classList.remove('a4-print-measure-mode');

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };`
);

// Thermal Print Style Injection
content = content.replace(
  /<html>\s+<head>\s+<base href="\$\{window\.location\.href\}" \/>\s+<title>Thermal Receipt<\/title>\s+\$\{styles\}\s+<\/head>\s+<body><\/body>\s+<\/html>/,
  `<html>
          <head>
            <base href="\${window.location.href}" />
            <title>Thermal Receipt</title>
            \${styles}
            <style>
              @page { margin: 0; size: 80mm auto; }
              body { margin: 0; padding: 0; width: 80mm; min-width: 80mm; overflow: visible; font-family: monospace; background: white !important; }
              #thermal-print-element { width: 100% !important; margin: 0 !important; max-width: none !important; border: none !important; box-shadow: none !important; }
            </style>
          </head>
          <body></body>
        </html>`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated BillPreview.tsx");
