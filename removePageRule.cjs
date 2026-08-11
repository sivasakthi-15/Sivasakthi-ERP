const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");

// Remove @page from index.css
content = content.replace(
  /@page\s*\{\s*size:\s*A4\s+portrait;\s*margin:\s*4mm;\s*\}/g,
  `/* @page rules moved to inline styles in BillPreview.tsx */`
);

// Fallback in case the margin was something else
content = content.replace(
  /@page\s*\{\s*size:\s*A4\s+portrait;\s*margin:\s*0;\s*\}/g,
  `/* @page rules moved to inline styles in BillPreview.tsx */`
);

fs.writeFileSync("src/index.css", content, "utf8");
console.log("Removed @page from index.css");
