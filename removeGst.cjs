const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

content = content.replace('{bill.customerGst && <div className="text-black font-semibold uppercase">GSTIN: {bill.customerGst}</div>}', '');

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Removed GSTIN from customer details.");
