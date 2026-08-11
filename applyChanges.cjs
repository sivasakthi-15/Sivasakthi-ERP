const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// 1. Replace "TAX INVOICE" and "GST Tax Invoice"
content = content.replace("let docTitle = 'TAX INVOICE';", "let docTitle = 'INVOICE';");
content = content.replace("let subtitle = 'GST Tax Invoice';", "let subtitle = 'INVOICE';");
content = content.replace("Format 1: GST Tax Invoice (A4)", "Format 1: Invoice (A4)");

// 2. Increase logo size (it's using the "Simulated Logo icon" or image if provided)
const oldLogo = `{/* Simulated Logo icon */}
                        <div className="h-10 w-10 bg-black text-white rounded-lg flex items-center justify-center font-bold text-sm tracking-wider font-mono">
                          {businessDetails.name ? businessDetails.name.slice(0, 2).toUpperCase() : 'EL'}
                        </div>`;
const newLogo = `{/* Company Logo */}
                        {businessDetails.appearance?.showLogo && businessDetails.logo ? (
                          <img src={businessDetails.logo} alt="Company logo" className="h-20 w-20 object-contain" />
                        ) : (
                          <div className="h-20 w-20 bg-black text-white rounded-xl flex items-center justify-center font-bold text-2xl tracking-wider font-mono">
                            {businessDetails.name ? businessDetails.name.slice(0, 2).toUpperCase() : 'EL'}
                          </div>
                        )}`;
content = content.replace(oldLogo, newLogo);

// 3. Customer Details
const oldCustomerDetails = `                      <div className="text-gray-600 font-medium space-y-0.5">
                        <div>Mobile: <span className="font-semibold text-black">{bill.customerMobile}</span></div>
                        {bill.customerAddress && (
                          <div>Place / Address: <span className="font-semibold text-black">{bill.customerAddress}</span></div>
                        )}
                        {bill.customerGst && <div className="text-black font-semibold uppercase">GSTIN: {bill.customerGst}</div>}
                        {/* Place of supply default */}
                        <div>Place of Supply: <span className="font-semibold text-black">{businessDetails.state || 'Tamil Nadu'}</span></div>
                      </div>`;
const newCustomerDetails = `                      <div className="text-gray-600 font-medium space-y-0.5">
                        {bill.customerAddress && (
                          <div>Address: <span className="font-semibold text-black whitespace-pre-wrap">{bill.customerAddress}</span></div>
                        )}
                        {bill.customerGst && <div className="text-black font-semibold uppercase">GSTIN: {bill.customerGst}</div>}
                      </div>`;
content = content.replace(oldCustomerDetails, newCustomerDetails);

fs.writeFileSync("src/components/BillPreview.tsx", content, "utf8");
console.log("Applied final 3 changes");
