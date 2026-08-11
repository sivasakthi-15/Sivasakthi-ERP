const fs = require("fs");
let content = fs.readFileSync("src/utils/a4InvoicePrintEngine.ts", "utf8");

content = content.replace(
  /let fitIntermediate = countRowsThatFit\(ctx, remaining, true, false\);\s*if \(fitIntermediate <= 0\) fitIntermediate = 1;/,
  `let fitIntermediate = countRowsThatFit(ctx, remaining, true, false);
      
      // Prevent footer-only pages: if the remaining products fit without the footer,
      // but they didn't fit WITH the footer, we must force at least one product
      // to the next page so the footer is not alone.
      if (fitIntermediate >= remaining.length) {
        fitIntermediate = Math.max(1, remaining.length - 1);
      }
      
      if (fitIntermediate <= 0) fitIntermediate = 1;`
);

fs.writeFileSync("src/utils/a4InvoicePrintEngine.ts", content, "utf8");
console.log("Updated pagination logic to prevent footer-only pages.");
