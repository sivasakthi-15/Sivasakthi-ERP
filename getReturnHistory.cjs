const fs = require("fs");
const content = fs.readFileSync("src/components/SalesReturnModule.tsx", "utf8");
const match = content.match(/moduleMode === 'return_history'.*?(?=moduleMode === 'view_receipt'|<\/div>\s*<\/div>\s*\)$)/s);
if(match) { console.log(match[0].substring(0, 1500)); } else { console.log("Not found"); }
