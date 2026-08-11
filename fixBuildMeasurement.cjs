const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");

content = content.replace(
  /if \(includeFooter\) \{\s*page\.appendChild\(sourceFooter\.cloneNode\(true\)\);\s*\}\s*if \(includePageNumber\) \{\s*page\.appendChild\(sourcePageNumber\.cloneNode\(true\)\);\s*\}/,
  `const bottomContainer = doc.createElement('div');
  bottomContainer.className = 'print-page-bottom mt-auto';
  if (includeFooter) {
    bottomContainer.appendChild(sourceFooter.cloneNode(true));
  }
  if (includePageNumber) {
    bottomContainer.appendChild(sourcePageNumber.cloneNode(true));
  }
  page.appendChild(bottomContainer);`
);

fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
console.log("Fixed buildMeasurementPage");
