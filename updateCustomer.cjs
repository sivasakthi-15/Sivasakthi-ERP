const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

const oldCustomer = `<div className="space-y-1.5">
                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Party Details</h3>
                    <div className="font-bold text-gray-900 text-sm">{bill.customerName}</div>
                    <div className="text-gray-600 font-medium space-y-0.5">
                      <div>Mobile: <span className="font-semibold text-black">{bill.customerMobile}</span></div>
                      {bill.customerAddress && (
                        <div>Place / Address: <span className="font-semibold text-black">{bill.customerAddress}</span></div>
                      )}
                      {bill.customerGst && <div className="text-black font-semibold uppercase">GSTIN: {bill.customerGst}</div>}
                      {/* Place of supply default */}
                      <div>Place of Supply: <span className="font-semibold text-black">{businessDetails.state || 'Tamil Nadu'}</span></div>
                    </div>
                  </div>`;

const newCustomer = `<div className="space-y-1.5">
                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Customer</h3>
                    <div className="font-bold text-gray-900 text-[13px]">{bill.customerName}</div>
                    {bill.customerAddress && (
                      <div className="text-gray-800 font-medium text-[11px] whitespace-pre-wrap leading-relaxed mt-1">
                        {bill.customerAddress}
                      </div>
                    )}
                  </div>`;

content = content.replace(oldCustomer, newCustomer);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Updated customer layout");
