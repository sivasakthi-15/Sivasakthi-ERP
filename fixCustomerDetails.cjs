const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

const searchStr = `<div className="space-y-1.5">
                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Party Details</h3>
                    <div className="font-bold text-gray-900 text-sm">{bill.customerName}</div>
                    <div className="text-gray-600 font-medium space-y-0.5">
                        {bill.customerAddress && (
                          <div>Address: <span className="font-semibold text-black whitespace-pre-wrap">{bill.customerAddress}</span></div>
                        )}
                      </div>
                      {bill.customerAddress && (
                        <div>Place / Address: <span className="font-semibold text-black">{bill.customerAddress}</span></div>
                      )}
                      
                      {/* Place of supply default */}
                      <div>Place of Supply: <span className="font-semibold text-black">{businessDetails.state || 'Tamil Nadu'}</span></div>
                    </div>`;

const replaceStr = `<div className="space-y-1.5">
                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Party Details</h3>
                    <div className="font-bold text-gray-900 text-sm">{bill.customerName}</div>
                    <div className="text-gray-600 font-medium space-y-0.5">
                      {bill.customerAddress && (
                        <div>Address: <span className="font-semibold text-black whitespace-pre-wrap">{bill.customerAddress}</span></div>
                      )}
                    </div>
                  </div>`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
    console.log("Fixed Party Details block!");
} else {
    console.log("Search string not found!");
}
