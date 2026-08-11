const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");

content = content.replace(
  /function getTargetHeight[\s\S]+?return 1120;\s+\}/,
  `function getBaselineHeight(page: HTMLElement): number {
  return page.offsetHeight;
}`
);

content = content.replace(
  /const targetHeight = getTargetHeight\(doc\);/g,
  `const targetHeight = Math.max(getBaselineHeight(built.page), 1122);`
);

fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
console.log("Updated a4InvoicePrintEngine target height logic");
