const fs = require("fs");
let content = fs.readFileSync("src/types.ts", "utf8");
content = content.replace("customerName: string;\r\n    customerMobile?: string;\r\n    customerMobile?: string;", "customerName: string;\r\n    customerMobile?: string;");
content = content.replace("customerName: string;\n    customerMobile?: string;\n    customerMobile?: string;", "customerName: string;\n    customerMobile?: string;");
content = content.replace("poNumber: string;\r\n    expectedDeliveryDate?: string;\r\n    supplierMobile?: string;\r\n    expectedDeliveryDate?: string;", "poNumber: string;\r\n    expectedDeliveryDate?: string;\r\n    supplierMobile?: string;");
content = content.replace("poNumber: string;\n    expectedDeliveryDate?: string;\n    supplierMobile?: string;\n    expectedDeliveryDate?: string;", "poNumber: string;\n    expectedDeliveryDate?: string;\n    supplierMobile?: string;");
fs.writeFileSync("src/types.ts", content, "utf8");
