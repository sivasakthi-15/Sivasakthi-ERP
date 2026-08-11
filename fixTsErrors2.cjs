const fs = require("fs");
function replaceAllInFile(file, search, replace) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, "utf8");
    content = content.split(search).join(replace);
    fs.writeFileSync(file, content, "utf8");
}
// Fix duplicate customerMobile
let types = fs.readFileSync("src/types.ts", "utf8");
types = types.replace("customerName: string;\n    customerMobile?: string;\n    customerMobile?: string;", "customerName: string;\n    customerMobile?: string;");
types = types.replace("customerName: string;\r\n    customerMobile?: string;\r\n    customerMobile?: string;", "customerName: string;\r\n    customerMobile?: string;");
// Add expectedDeliveryDate & supplierMobile to PurchaseOrder
types = types.replace("poNumber: string;", "poNumber: string;\n    expectedDeliveryDate?: string;\n    supplierMobile?: string;");
// Make sure PurchaseItem has optional id
types = types.replace("export interface PurchaseItem {\n    id: string;", "export interface PurchaseItem {\n    id?: string;");
types = types.replace("export interface PurchaseItem {\r\n    id: string;", "export interface PurchaseItem {\r\n    id?: string;");
fs.writeFileSync("src/types.ts", types, "utf8");

// GRNSection.tsx fixes
let grn = fs.readFileSync("src/components/purchase/GRNSection.tsx", "utf8");
grn = grn.replace(/item\.quantityReceived/g, "item.receivedQuantity");
grn = grn.replace(/item\.receivedQuantityReceived/g, "item.receivedQuantity");
fs.writeFileSync("src/components/purchase/GRNSection.tsx", grn, "utf8");

// SalesReturnModule
replaceAllInFile("src/components/SalesReturnModule.tsx", "returnBill.customerMobile", "(returnBill as any).customerMobile");

// a4InvoicePrintEngine.ts
replaceAllInFile("src/utils/a4InvoicePrintEngine.ts", "const currentTotals = sourceTotals || totals", "const currentTotals = document.getElementById('a4-totals-section') || totals");

console.log("Applied second round of TS fixes");
