const fs = require("fs");
let content = fs.readFileSync("src/components/SalesReturnModule.tsx", "utf8");

const replacement = `const handlePrint = () => {
    if (printTemplate === 'thermal') {
      const element = document.getElementById('thermal-print-element');
      if (!element) { alert('Print content not found.'); return; }
      const printWindow = window.open('', '_blank', 'width=350,height=600');
      if (!printWindow) { alert('Unable to open print window.'); return; }
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map((s) => s.outerHTML).join('');
      printWindow.document.write(\`
        <!doctype html>
        <html>
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
        </html>
      \`);
      printWindow.document.close();
      printWindow.document.body.appendChild(element.cloneNode(true));
      const print = async () => {
        await printWindow.document.fonts?.ready;
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
      if (printWindow.document.readyState === 'complete') { void print(); }
      else { printWindow.addEventListener('load', () => void print(), { once: true }); }
    } else {
      const element = document.getElementById('a4-print-element');
      if (!element) { alert('Print content not found.'); return; }
      const printWindow = window.open('', '_blank', 'width=900,height=1200');
      if (!printWindow) { alert('Unable to open print window.'); return; }
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((s) => s.outerHTML).join('');
      printWindow.document.write(\`
        <!doctype html>
        <html>
          <head>
            <base href="\${window.location.href}" />
            <title>Invoice</title>
            \${styles}
          </head>
          <body></body>
        </html>
      \`);
      printWindow.document.close();
      printWindow.document.body.appendChild(element.cloneNode(true));
      const print = async () => {
        const links = Array.from(printWindow.document.querySelectorAll('link[rel="stylesheet"]'));
        await Promise.all(links.map((link: any) => {
          if (link.sheet) return Promise.resolve();
          return new Promise(resolve => { link.onload = resolve; link.onerror = resolve; });
        }));
        await printWindow.document.fonts?.ready;
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
      if (printWindow.document.readyState === 'complete') { void print(); }
      else { printWindow.addEventListener('load', () => void print(), { once: true }); }
    }
  };`;

content = content.replace(/const handlePrint = \(\) => \{\s*window\.print\(\);\s*\};/g, replacement);

fs.writeFileSync("src/components/SalesReturnModule.tsx", content, "utf8");
console.log("Updated SalesReturnModule.tsx");
