const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const helper = `\nconst safeSetItem = (key: string, value: string) => {\n  try {\n    localStorage.setItem(key, value);\n  } catch (error) {\n    console.warn('localStorage quota exceeded or access denied. Skipping persistence for key:', key);\n  }\n};\n`;
code = code.replace(/from '\.\.\/data\/initialData';\n/, match => match + helper);

code = code.replace(/localStorage\.setItem\(/g, 'safeSetItem(');

code = code.replace(
  /safeSetItem\('enterprise_notifications',\s*JSON\.stringify\(securityNotifications\)\);/g,
  "safeSetItem('enterprise_notifications', JSON.stringify(securityNotifications.slice(0, 100)));"
);

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log('Refactored AppContext.tsx successfully');
