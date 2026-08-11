const fs = require("fs");
const content = fs.readFileSync("src/components/SalesReturnModule.tsx", "utf8");
const idx = content.indexOf("MODE: RETURN REGISTRY HISTORY");
if(idx > -1) { console.log(content.substring(idx, idx + 2000)); } else { console.log("Not found"); }
