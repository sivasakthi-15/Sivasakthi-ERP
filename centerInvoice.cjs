const fs = require("fs");
let content = fs.readFileSync("src/index.css", "utf8");

content = content.replace(
  /html, body \{\s*width: 210mm !important;/g,
  `html, body {\n    width: 100% !important;`
);

content = content.replace(
  /body \{\s*position: relative !important;\s*left: 0 !important;\s*top: 0 !important;\s*width: 210mm !important;/g,
  `body {\n    position: relative !important;\n    left: 0 !important;\n    top: 0 !important;\n    width: 100% !important;`
);

content = content.replace(
  /#a4-print-element \{\s*display: block !important;\s*flex-direction: column !important;/g,
  `#a4-print-element {\n    display: block !important;\n    flex-direction: column !important;\n    width: 210mm !important;\n    margin: 0 auto !important;`
);

content = content.replace(
  /\.print-page \{\s*display: flex !important;\s*flex-direction: column !important;\s*width: 210mm !important;\s*height: 297mm !important;\s*max-height: 297mm !important;\s*min-height: 297mm !important;\s*margin: 0 !important;/g,
  `.print-page {\n    display: flex !important;\n    flex-direction: column !important;\n    width: 210mm !important;\n    height: 297mm !important;\n    max-height: 297mm !important;\n    min-height: 297mm !important;\n    margin: 0 auto !important;`
);

fs.writeFileSync("src/index.css", content, "utf8");
console.log("Updated index.css for horizontal centering.");
