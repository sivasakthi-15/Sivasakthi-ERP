const fs = require("fs");
let content = fs.readFileSync("src/components/BillPreview.tsx", "utf8");

// 1. Increase logo size
content = content.replace(
  'className="h-20 w-20 object-contain"', 
  'className="h-32 w-32 object-contain"'
);
content = content.replace(
  'className="h-20 w-20 bg-black text-white rounded-lg flex items-center justify-center font-bold text-2xl tracking-wider font-mono"',
  'className="h-32 w-32 bg-black text-white rounded-lg flex items-center justify-center font-bold text-3xl tracking-wider font-mono"'
);

// 2. Customer Details: Remove Mobile number, show only Name and Address exactly as entered.
// I'll replace the customer details table.
const oldCustomerTable = `<table className="w-full text-left text-[#0a192f]">
                      <tbody>
                        <tr>
                          <td className="w-24 align-top py-0.5">Customer Name</td>
                          <td className="w-2 align-top py-0.5">:</td>
                          <td className="font-bold py-0.5">{bill.customerName}</td>
                        </tr>
                        {bill.customerAddress && (
                          <tr>
                            <td className="w-24 align-top py-0.5">Address</td>
                            <td className="w-2 align-top py-0.5">:</td>
                            <td className="font-semibold py-0.5 whitespace-pre-wrap leading-tight">{bill.customerAddress}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>`;

// Wait, the old customer table might have had phone numbers because I restored it from MY previous edit which removed them!
// Let's check what the current table looks like.
