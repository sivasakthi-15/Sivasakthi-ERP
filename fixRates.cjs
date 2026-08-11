const fs = require('fs');

// 1. BillingModule.tsx
let billing = fs.readFileSync('src/components/BillingModule.tsx', 'utf8');
billing = billing.replace(
  /let defaultRate = \(currentBillType === 'contractor' \? prod\.purchasePrice : \(prod\.latestSellingPrice \|\| prod\.sellingPrice\)\) \|\| 0;\n\s*if \(\!defaultRate\) \{\n\s*defaultRate = prod\.latestSellingPrice \|\| prod\.sellingPrice \|\| prod\.purchasePrice \|\| 0;\n\s*\}/g,
  "let defaultRate = (currentBillType === 'contractor' ? prod.purchasePrice : prod.sellingPrice) || 0;"
);
billing = billing.replace(
  /let latestRate = \(currentBillType === 'contractor' \? freshProd\.purchasePrice : \(freshProd\.latestSellingPrice \|\| freshProd\.sellingPrice\)\) \|\| 0;\n\s*if \(\!latestRate\) \{\n\s*latestRate = freshProd\.latestSellingPrice \|\| freshProd\.sellingPrice \|\| freshProd\.purchasePrice \|\| 0;\n\s*\}/g,
  "let latestRate = (currentBillType === 'contractor' ? freshProd.purchasePrice : freshProd.sellingPrice) || 0;"
);
fs.writeFileSync('src/components/BillingModule.tsx', billing);

// 2. InventoryModule.tsx
let inv = fs.readFileSync('src/components/InventoryModule.tsx', 'utf8');
inv = inv.replace(/\(p\.latestSellingPrice \|\| p\.sellingPrice \|\| 0\)/g, "(p.sellingPrice || 0)");
fs.writeFileSync('src/components/InventoryModule.tsx', inv);

// 3. ProductsModule.tsx
let prod = fs.readFileSync('src/components/ProductsModule.tsx', 'utf8');
prod = prod.replace(/\(prod\.latestSellingPrice \|\| prod\.sellingPrice \|\| 0\)/g, "(prod.sellingPrice || 0)");
prod = prod.replace(/\(p\.latestSellingPrice \|\| p\.sellingPrice \|\| 0\)/g, "(p.sellingPrice || 0)");
fs.writeFileSync('src/components/ProductsModule.tsx', prod);

console.log('Fixed rate overrides');
