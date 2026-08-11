const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");

content = content.replace(
  /function countEmptyRowsThatFit\([\s\S]*?return emptyCount;\n\}/,
  `function countEmptyRowsThatFit(\n  ctx: PageBuildContext,\n  productRows: HTMLTableRowElement[],\n  includeHeader: boolean,\n  includeFooter: boolean,\n): number {\n  return 0;\n}`
);

fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
console.log("Updated countEmptyRowsThatFit to return 0");
