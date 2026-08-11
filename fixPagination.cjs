const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");

// Change `paginateA4PrintDocument` to use `querySelector`
content = content.replace(
  /const sourceFooter = template\s*\?\s*\(Array\.from\(template\.children\)\.find\(\(child\) => child\.classList\.contains\('print-invoice-footer'\)\) as HTMLElement \| undefined\)\s*:\s*undefined;/,
  `const sourceFooter = template ? (template.querySelector('.print-invoice-footer') as HTMLElement | undefined) : undefined;`
);

content = content.replace(
  /const sourcePageNumber = template\s*\?\s*\(Array\.from\(template\.children\)\.find\(\(child\) => child\.querySelector\('\.print-page-number'\)\) as HTMLElement \| undefined\)\s*:\s*undefined;/,
  `const sourcePageNumber = template ? (template.querySelector('.print-page-number-bar') as HTMLElement | undefined) : undefined;`
);

// In `renderPaginatedA4Document`, create `print-page-bottom`
content = content.replace(
  /if \(slice\.includeFooter\) \{\s*page\.appendChild\(sourceElements\.sourceFooter\.cloneNode\(true\)\);\s*\}\s*const pageNumberBar = sourceElements\.sourcePageNumber\.cloneNode\(true\) as HTMLElement;\s*const pageNumberEl = pageNumberBar\.querySelector<HTMLElement>\('\.print-page-number'\);\s*if \(pageNumberEl\) \{\s*pageNumberEl\.textContent = `Page \$\{pageIndex \+ 1\} of \$\{totalPages\}`;\s*\}\s*page\.appendChild\(pageNumberBar\);/,
  `const bottomContainer = printDocument.createElement('div');
    bottomContainer.className = 'print-page-bottom mt-auto';

    if (slice.includeFooter) {
      bottomContainer.appendChild(sourceElements.sourceFooter.cloneNode(true));
    }

    const pageNumberBar = sourceElements.sourcePageNumber.cloneNode(true) as HTMLElement;
    const pageNumberEl = pageNumberBar.querySelector<HTMLElement>('.print-page-number');
    if (pageNumberEl) {
      pageNumberEl.textContent = \`Page \${pageIndex + 1} of \${totalPages}\`;
    }
    bottomContainer.appendChild(pageNumberBar);
    
    page.appendChild(bottomContainer);`
);

// Also update buildMeasurementPage to do the same
content = content.replace(
  /if \(includeFooter\) \{\s*page\.appendChild\(sourceFooter\.cloneNode\(true\)\);\s*\}\s*page\.appendChild\(sourcePageNumber\.cloneNode\(true\)\);/,
  `const bottomContainer = doc.createElement('div');
  bottomContainer.className = 'print-page-bottom mt-auto';
  if (includeFooter) {
    bottomContainer.appendChild(sourceFooter.cloneNode(true));
  }
  bottomContainer.appendChild(sourcePageNumber.cloneNode(true));
  page.appendChild(bottomContainer);`
);

fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
console.log("Updated a4InvoicePrintEngine");
