const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");

content = content.replace(
  /sourceTable: HTMLTableElement;\n\s+sourceFooter: HTMLElement;/g,
  `sourceTable: HTMLTableElement;\n    sourceTotals: HTMLElement;\n    sourceFooter: HTMLElement;`
);

content = content.replace(
  /const \{ doc, template, sourceTop, sourceFooter, sourcePageNumber \} = ctx;/g,
  `const { doc, template, sourceTop, sourceTotals, sourceFooter, sourcePageNumber } = ctx;`
);

content = content.replace(
  /const table = top\.querySelector<HTMLTableElement>\('table'\);\n\s+const body = table\?\.tBodies\[0\];\n\n\s+if \(\!table \|\| \!body\) return null;/g,
  `const table = top.querySelector<HTMLTableElement>('table');\n    const body = table?.tBodies[0];\n\n    if (!table || !body) return null;\n\n    if (includeFooter && sourceTotals) {\n      top.appendChild(sourceTotals.cloneNode(true));\n    }`
);

content = content.replace(
  /template: sourceElements\.template,\n\s+sourceTop: sourceElements\.sourceTop,\n\s+sourceTable: sourceElements\.sourceTable,\n\s+sourceFooter: sourceElements\.sourceFooter,\n\s+sourcePageNumber: sourceElements\.sourcePageNumber,/g,
  `template: sourceElements.template,\n      sourceTop: sourceElements.sourceTop,\n      sourceTable: sourceElements.sourceTable,\n      sourceTotals: sourceElements.sourceTotals,\n      sourceFooter: sourceElements.sourceFooter,\n      sourcePageNumber: sourceElements.sourcePageNumber,`
);

content = content.replace(
  /const sourceTable = sourceTop\?\.querySelector<HTMLTableElement>\('table'\);\n\s+const sourceFooter = template \? \(template\.querySelector\('\.print-invoice-footer'\) as HTMLElement \| undefined\) : \nundefined;\n\s+const sourcePageNumber = template \? \(template\.querySelector\('\.print-page-number-bar'\) as HTMLElement \| undefined\) \n: undefined;/g,
  `const sourceTable = sourceTop?.querySelector<HTMLTableElement>('table');\n    const sourceTotals = template ? (template.querySelector('.print-invoice-totals') as HTMLElement | undefined) : undefined;\n    const sourceFooter = template ? (template.querySelector('.print-invoice-footer') as HTMLElement | undefined) : undefined;\n    const sourcePageNumber = template ? (template.querySelector('.print-page-number-bar') as HTMLElement | undefined) : undefined;`
);

content = content.replace(
  /if \(\!root \|\| \!template \|\| \!sourceTop \|\| \!sourceTable \|\| \!sourceFooter \|\| \!sourcePageNumber\) \{\n\s+return;\n\s+\}/g,
  `if (!root || !template || !sourceTop || !sourceTable || !sourceTotals || !sourceFooter || !sourcePageNumber) {\n      return;\n    }`
);

content = content.replace(
  /sourceTop,\n\s+sourceTable,\n\s+sourceFooter,\n\s+sourcePageNumber,/g,
  `sourceTop,\n      sourceTable,\n      sourceTotals,\n      sourceFooter,\n      sourcePageNumber,`
);

content = content.replace(
  /template: HTMLElement;\n\s+sourceTop: HTMLElement;\n\s+sourceTable: HTMLTableElement;\n\s+sourceFooter: HTMLElement;\n\s+sourcePageNumber: HTMLElement;/g,
  `template: HTMLElement;\n      sourceTop: HTMLElement;\n      sourceTable: HTMLTableElement;\n      sourceTotals: HTMLElement;\n      sourceFooter: HTMLElement;\n      sourcePageNumber: HTMLElement;`
);

fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
console.log("Updated a4InvoicePrintEngine.ts to include sourceTotals");
