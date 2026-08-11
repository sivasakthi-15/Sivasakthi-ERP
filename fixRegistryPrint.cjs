const fs = require("fs");
let content = fs.readFileSync("src/components/SalesReturnModule.tsx", "utf8");

// First, find the "Total Transactions" block to insert the Print button next to it
content = content.replace(
  /<div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">\s*<Filter className="w-4 h-4 text-gray-400" \/>\s*<span>Total Transactions: \{filteredPastReturns\.length\}<\/span>\s*<\/div>/,
  `<div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Filter className="w-4 h-4 text-gray-400" />
                <span>Total Transactions: {filteredPastReturns.length}</span>
              </div>
              <button
                onClick={() => {
                  const element = document.getElementById('return-registry-print');
                  if (!element) return;
                  const printWindow = window.open('', '_blank', 'width=1100,height=800');
                  if (!printWindow) return;
                  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(s => s.outerHTML).join('');
                  printWindow.document.write(\`
                    <!doctype html>
                    <html>
                      <head>
                        <base href="\${window.location.href}" />
                        <title>Return Registry</title>
                        \${styles}
                        <style>
                          @page { size: A4 landscape; margin: 10mm; }
                          body { margin: 0; padding: 0; background: white !important; visibility: visible !important; }
                          #return-registry-print { visibility: visible !important; width: 100% !important; max-width: none !important; }
                          /* Hide elements that shouldn't print */
                          table th:last-child, table td:last-child { display: none !important; }
                        </style>
                      </head>
                      <body class="bg-white">
                        <div class="p-6">
                          <h1 class="text-xl font-bold mb-4">Sales Return Registry</h1>
                          \${element.outerHTML}
                        </div>
                      </body>
                    </html>
                  \`);
                  printWindow.document.close();
                  const doPrint = async () => {
                    const links = Array.from(printWindow.document.querySelectorAll('link[rel="stylesheet"]'));
                    await Promise.all(links.map((link: any) => {
                      if (link.sheet) return Promise.resolve();
                      return new Promise(res => { link.onload = res; link.onerror = res; });
                    }));
                    await printWindow.document.fonts?.ready;
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                  };
                  if (printWindow.document.readyState === 'complete') { void doPrint(); }
                  else { printWindow.addEventListener('load', () => void doPrint(), { once: true }); }
                }}
                className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-gray-800 transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Print Registry
              </button>
            </div>`
);

// Add id="return-registry-print" to the table wrapper
content = content.replace(
  /<div className="overflow-x-auto">/,
  `<div className="overflow-x-auto" id="return-registry-print">`
);

fs.writeFileSync("src/components/SalesReturnModule.tsx", content, "utf8");
console.log("Added Print Registry button");
