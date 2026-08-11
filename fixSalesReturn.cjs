const fs = require('fs');

let content = fs.readFileSync('src/components/SalesReturnModule.tsx', 'utf8');

// Add print css to a4-print-element
content = content.replace(
  /<div id="a4-print-element" className="([^"]+)">/g,
  '<div id="a4-print-element" className="$1 print:max-w-none print:w-full print:absolute print:top-0 print:left-0">'
);

fs.writeFileSync('src/components/SalesReturnModule.tsx', content, 'utf8');
console.log('Fixed SalesReturnModule print layout');
