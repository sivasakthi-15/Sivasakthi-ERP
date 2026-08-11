const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// We'll replace `{/* Bottom Block / Footer (Only on the LAST page) */}` to introduce the wrapper.
content = content.replace(
  /\{\/\* Bottom Block \/ Footer \(Only on the LAST page\) \*\/\}/g,
  `<div className="print-page-bottom mt-auto">\n              {/* Bottom Block / Footer (Only on the LAST page) */}`
);

// We'll replace the end of print-page-number-bar
content = content.replace(
  /<div className="print-page-number-bar text-center text-\[9px\] text-gray-400 mt-2 pt-2 border-t border-gray-50 font-mono flex justify-between items-center">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\)\}/,
  (match) => {
    // wait, the match ends with `</div>` (for print-page-number-bar), then `</div>` (for print-page).
    // We want to add a `</div>` for print-page-bottom BEFORE the `</div>` for print-page.
    let str = match.replace(/<\/div>\s*<\/div>\s*\);\s*\}\)\}/, `</div>\n            </div>\n          </div>\n        );\n      })}`);
    return str;
  }
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Wrapped footer in BillPreview.tsx");
