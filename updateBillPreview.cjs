const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// We need to find the print-invoice-footer, split it, and move the totals up.
// Let's do this by using a replace with a regex or string replacement.

let startTotals = `<div className="print-invoice-totals z-10 relative mt-1 border-t border-gray-200 pt-1.5">
                  <div className="grid grid-cols-2 gap-3 items-start">`;

let startFooter = `<div className="print-invoice-footer z-10 relative mt-1 pt-1.5">
                  {/* Declarations & terms */}`;

// Let's carefully modify the content
content = content.replace(
  /<div className="print-invoice-footer z-10 relative mt-1 border-t border-gray-200 pt-1\.5">/g,
  startTotals
);

// We need to close the totals div and open the footer div just before {/* Declarations & terms */}
content = content.replace(
  /\{\/\* Declarations & terms \*\/\}/g,
  `</div>\n              ) : null}\n            </div>\n\n            <div className="print-page-bottom mt-auto">\n              {isLastPage ? (\n                ${startFooter}`
);

// We also need to move the original `print-page-bottom mt-auto` logic.
// Originally:
// </table>
// </div>
// <div className="print-page-bottom mt-auto">
//   {isLastPage ? (
//     <div className="print-invoice-footer...
//

// So where we previously had:
content = content.replace(
  /<\/table>\n\s+<\/div>\n\n\s+<div className="print-page-bottom mt-auto">\n\s+\{\/\* Bottom Block \/ Footer \(Only on the LAST page\) \*\/\}\n\s+\{isLastPage \? \(/g,
  `</table>\n              {isLastPage ? (`
);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated BillPreview.tsx layout");
