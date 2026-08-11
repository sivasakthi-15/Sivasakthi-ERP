const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace('date: string;\r\n  expectedDeliveryDate: string;', 'date: string;\r\n  expectedDeliveryDate?: string;');
code = code.replace('date: string;\n  expectedDeliveryDate: string;', 'date: string;\n  expectedDeliveryDate?: string;');
fs.writeFileSync('src/types.ts', code);
