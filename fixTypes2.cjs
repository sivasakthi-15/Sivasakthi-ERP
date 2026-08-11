const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace('  expectedDeliveryDate?: string;\r\n  supplierMobile?: string;\r\n  supplierId: string;', '  supplierMobile?: string;\r\n  supplierId: string;');
code = code.replace('  expectedDeliveryDate?: string;\n  supplierMobile?: string;\n  supplierId: string;', '  supplierMobile?: string;\n  supplierId: string;');
fs.writeFileSync('src/types.ts', code);
