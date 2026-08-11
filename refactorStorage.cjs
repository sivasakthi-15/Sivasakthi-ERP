const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add import if needed
  const needsImport = content.includes('localStorage.set') || content.includes('localStorage.get') || content.includes('localStorage.remove');
  
  if (needsImport) {
    content = content.replace(/localStorage\.setItem/g, 'safeSetItem');
    content = content.replace(/localStorage\.getItem/g, 'safeGetItem');
    content = content.replace(/localStorage\.removeItem/g, 'safeRemoveItem');
    
    // Add import statement at the top if it's not AppContext (which has safeSetItem locally)
    if (!content.includes('import { safeSetItem') && !filePath.includes('AppContext.tsx')) {
        // Find relative path to utils
        const dir = path.dirname(filePath);
        const relativeToUtils = path.relative(dir, path.join(__dirname, 'src', 'utils'));
        const importPath = relativeToUtils.replace(/\\/g, '/') + '/safeStorage';
        const importPathStr = importPath.startsWith('.') ? importPath : './' + importPath;
        
        content = `import { safeSetItem, safeGetItem, safeRemoveItem } from '${importPathStr}';\n` + content;
    }
    
    // For AppContext, replace its internal safeSetItem definition with the imported one.
    if (filePath.includes('AppContext.tsx')) {
        content = content.replace(/const safeSetItem = \([\s\S]*?\};\n/, '');
        content = `import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';\n` + content;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      if (!fullPath.includes('safeStorage.ts')) {
        replaceInFile(fullPath);
      }
    }
  }
}

traverse(path.join(__dirname, 'src'));
