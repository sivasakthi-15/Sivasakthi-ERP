const fs = require('fs');
let code = fs.readFileSync('src/components/BillingModule.tsx', 'utf8');
code = code.replace('const activeItems = rows.filter(r => r.productId !== \'\');\r\n  const activeItems = rows.filter(r => r.productId !== \'\');', 'const activeItems = rows.filter(r => r.productId !== \'\');');
code = code.replace('const activeItems = rows.filter(r => r.productId !== \'\');\n  const activeItems = rows.filter(r => r.productId !== \'\');', 'const activeItems = rows.filter(r => r.productId !== \'\');');
fs.writeFileSync('src/components/BillingModule.tsx', code);
