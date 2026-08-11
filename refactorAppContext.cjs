const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Fix selectBusiness missing useCallback
content = content.replace(
  /const selectBusiness = \(bizId: string\) => \{/,
  "const selectBusiness = useCallback((bizId: string) => {"
);
content = content.replace(
  /setActiveTab\('billing'\);\n    \}\n  \};/,
  "setActiveTab('billing');\n    }\n  }, []);"
);
if (!content.includes('import React, { createContext, useContext, useState, useEffect, ReactNode')) {
  // Check if useCallback is imported
  if (!content.includes('useCallback')) {
    content = content.replace(/import React, \{ /, 'import React, { useCallback, ');
  }
}

// 2. Fix generateNextBillNo dependency loop
// It was:
// }, [bills, currentBusiness, businessDetails, nextBillNumber]);
content = content.replace(
  /\}, \[bills, currentBusiness, businessDetails, nextBillNumber\]\);/g,
  "}, [bills, currentBusiness, businessDetails]); // Removed nextBillNumber to prevent infinite rendering loops"
);

// 3. Fix addCustomer missing name trim crash
content = content.replace(
  /const normalizedNewName = custData\.name\.trim\(\)\.toLowerCase\(\);/g,
  "const normalizedNewName = (custData.name || '').trim().toLowerCase();"
);

fs.writeFileSync('src/context/AppContext.tsx', content, 'utf8');
console.log('Fixed AppContext loops and crashes');
