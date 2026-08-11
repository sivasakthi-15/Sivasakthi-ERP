const fs = require('fs');

let content = fs.readFileSync('src/components/BillPreview.tsx', 'utf8');

// Fix handlePrint to respect template type
const handlePrintRegex = /const handlePrint = \(\) => \{\s+printA4Element\(\);\s+\};/;
const handlePrintFix = `const handlePrint = () => {
    if (template === 'thermal') {
      const element = document.getElementById('thermal-print-element');
      if (!element) {
        alert('Print content not found.');
        return;
      }
      
      const printWindow = window.open('', '_blank', 'width=350,height=600');
      if (!printWindow) {
        alert('Unable to open print window.');
        return;
      }
      
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((style) => style.outerHTML)
        .join('');
      
      printWindow.document.write(\`
        <!doctype html>
        <html>
          <head>
            <base href="\${window.location.href}" />
            <title>Thermal Receipt</title>
            \${styles}
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
      
      if (printWindow.document.readyState === 'complete') {
        void print();
      } else {
        printWindow.addEventListener('load', () => void print(), { once: true });
      }
    } else {
      printA4Element();
    }
  };`;

content = content.replace(handlePrintRegex, handlePrintFix);

fs.writeFileSync('src/components/BillPreview.tsx', content, 'utf8');
console.log('Fixed thermal printing');
