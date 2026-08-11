const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('ErrorBoundary')) {
  content = content.replace(
    /import \{ WelcomeScreen \} from '\.\/components\/WelcomeScreen';/,
    "import { WelcomeScreen } from './components/WelcomeScreen';\nimport { ErrorBoundary } from './components/ErrorBoundary';"
  );
  
  // Wrap main content
  content = content.replace(
    /<Sidebar \/>\n\s*<main className="flex-1 overflow-hidden">/g,
    "<Sidebar />\n        <main className=\"flex-1 overflow-hidden\">\n          <ErrorBoundary>"
  );
  
  content = content.replace(
    /<\/main>\n\s*<\/div>/g,
    "          </ErrorBoundary>\n        </main>\n      </div>"
  );
  
  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('Added ErrorBoundary to App.tsx');
}
