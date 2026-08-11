const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");

content = content.replace(
  /if \(built\.contentContainer\.scrollHeight > built\.contentContainer\.clientHeight\) \{/g,
  `
    const tableEl = built.contentContainer.querySelector('table');
    if (tableEl) {
      const tableRect = tableEl.getBoundingClientRect();
      const containerRect = built.contentContainer.getBoundingClientRect();
      if (tableRect.bottom > containerRect.bottom + 1) {`
);

// We need to add closing braces for the new if block
content = content.replace(
  /built\.body\.removeChild\(built\.body\.lastElementChild\!\);\s+break;\s+\}/g,
  `built.body.removeChild(built.body.lastElementChild!);
        break;
      }
    }`
);

content = content.replace(
  /built\.body\.removeChild\(emptyRow\);\s+break;\s+\}/g,
  `built.body.removeChild(emptyRow);
        break;
      }
    }`
);

fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
console.log("Updated bounding rect logic");
