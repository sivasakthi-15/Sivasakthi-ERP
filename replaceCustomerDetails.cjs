const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

const startIdx = content.indexOf('<div className="text-gray-600 font-medium space-y-0.5">');
const endIdx = content.indexOf('</div>', startIdx + 100);

// Just replace everything between these with our new block
if (startIdx !== -1 && endIdx !== -1) {
  const newBlock = `<div className="text-gray-600 font-medium space-y-0.5">
                        {bill.customerAddress && (
                          <div>Address: <span className="font-semibold text-black whitespace-pre-wrap">{bill.customerAddress}</span></div>
                        )}
                      </div>`;
  content = content.substring(0, startIdx) + newBlock + content.substring(endIdx + 6);
  fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
  console.log("Successfully replaced Customer Details!");
} else {
  console.log("Could not find Customer Details block.");
}
