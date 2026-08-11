const fs = require("fs");

function replaceInFile(file, search, replace) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, "utf8");
    content = content.replace(search, replace);
    fs.writeFileSync(file, content, "utf8");
}

function replaceAllInFile(file, search, replace) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, "utf8");
    content = content.split(search).join(replace);
    fs.writeFileSync(file, content, "utf8");
}

// 1. types.ts - Make new Product fields optional
replaceAllInFile("src/types.ts", "description: string;", "description?: string;");
replaceAllInFile("src/types.ts", "isActive: boolean;", "isActive?: boolean;");
replaceAllInFile("src/types.ts", "mrp: number;", "mrp?: number;");
replaceAllInFile("src/types.ts", "minStock: number;", "minStock?: number;");
replaceAllInFile("src/types.ts", "maxStock: number;", "maxStock?: number;");
// Make PurchaseItem id optional for InvoiceSection
replaceAllInFile("src/types.ts", "id: string;\n    productId: string;", "id?: string;\n    productId: string;");
replaceAllInFile("src/types.ts", "id: string;\r\n    productId: string;", "id?: string;\r\n    productId: string;");
// Add deleteSupplier to AppContextType
replaceInFile("src/types.ts", "updateSupplier: (id: string, supplier: Partial<Supplier>) => void;", "updateSupplier: (id: string, supplier: Partial<Supplier>) => void;\n    deleteSupplier?: (id: string) => void;");
// Add deliveryDate to PurchaseOrder
replaceInFile("src/types.ts", "poNumber: string;", "poNumber: string;\n    deliveryDate?: string;");
// Make customerMobile optional in SalesReturn
replaceInFile("src/types.ts", "customerName: string;", "customerName: string;\n    customerMobile?: string;");

// 2. BillingModule.tsx
replaceAllInFile("src/components/BillingModule.tsx", "title=\"Send to Printer\"", "");
replaceAllInFile("src/components/BillingModule.tsx", "title=\"Thermal Receipt\"", "");
replaceAllInFile("src/components/BillingModule.tsx", "title=\"A4 Invoice\"", "");
replaceAllInFile("src/components/BillingModule.tsx", "<Printer className=\"w-5 h-5\" title=\"Send to Printer Device\" />", "<Printer className=\"w-5 h-5\" />");

// 3. BIModule.tsx
replaceAllInFile("src/components/BIModule.tsx", "item.price", "item.rate");

// 4. ExpensesModule.tsx
replaceAllInFile("src/components/ExpensesModule.tsx", "setNewExpense({ ...newExpense, category: e.target.value })", "setNewExpense({ ...newExpense, category: e.target.value as any })");

// 5. GSTModule.tsx
replaceAllInFile("src/components/GSTModule.tsx", "item.price", "item.rate");

// 6. InventoryModule.tsx
replaceAllInFile("src/components/InventoryModule.tsx", "status: 'Draft'", "status: 'draft'");
replaceAllInFile("src/components/InventoryModule.tsx", "unit: transferData.unit,", "unit: transferData.unit, transferDate: new Date().toISOString(),");

// 7. purchase/GRNSection.tsx
replaceAllInFile("src/components/purchase/GRNSection.tsx", "subtotal:", "// subtotal:");
replaceAllInFile("src/components/purchase/GRNSection.tsx", "item.quantity", "item.quantityReceived");
replaceAllInFile("src/components/purchase/GRNSection.tsx", "item.purchaseRate", "item.rate");

// 8. purchase/HistorySection.tsx
replaceAllInFile("src/components/purchase/HistorySection.tsx", "log.timestamp", "log.createdAt");

// 9. purchase/ReturnSection.tsx
replaceAllInFile("src/components/purchase/ReturnSection.tsx", "purchaseRate: item.rate,", "purchaseRate: item.rate, gstPercent: 0, taxableValue: 0,");

// 10. SalesReturnModule.tsx
replaceAllInFile("src/components/SalesReturnModule.tsx", "businessDetails.gstNo", "businessDetails.gstNumber");

// 11. a4InvoicePrintEngine.ts
replaceAllInFile("src/utils/a4InvoicePrintEngine.ts", "const currentTotals = sourceTotals", "const currentTotals = sourceTotals || totals");
replaceAllInFile("src/utils/a4InvoicePrintEngine.ts", "cloneTotals(sourceTotals)", "cloneTotals(document.getElementById('a4-totals-section'))");

console.log("Applied TS fixes");
