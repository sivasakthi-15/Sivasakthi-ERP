const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");
content = content.replace(/includeHeader: cursor === 0,/g, `includeHeader: true,`);
fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
