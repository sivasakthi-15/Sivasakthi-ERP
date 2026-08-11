const fs = require('fs');
let code = fs.readFileSync('src/components/BillingModule.tsx', 'utf8');

const ensureCustStart = code.indexOf('const ensureCustomerIsResolved = (): Customer => {');
const ensureCustEnd = code.indexOf('if (paymentMode === \'credit\' || unpaidBalance > 0', ensureCustStart);

let newEnsureCust = `const ensureCustomerIsResolved = (): Customer => {
    let finalCustomer = selectedCustomer;
    
    const queryName = customerSearch.trim();
    if (queryName) {
      // 1. Search the Customer collection
      const normalizedQuery = queryName.toLowerCase();
      const existing = customers.find(c => (c.name || '').toLowerCase() === normalizedQuery);
      if (existing) {
        if (custAddress.trim() && existing.address !== custAddress.trim()) {
          updateCustomer(existing.id, { address: custAddress.trim() });
          existing.address = custAddress.trim();
        }
        setSelectedCustomer(existing);
        finalCustomer = existing;
      } else {
        // 2. If it doesn't exist, automatically create a new customer record.
        const created = addCustomer({
          name: queryName,
          mobile: '',
          address: custAddress.trim(),
          city: '',
          state: '',
          pincode: '',
          gstNumber: '',
          email: '',
          creditLimit: 0,
          notes: 'Automatically created from POS Billing on Checkout',
          type: 'retail'
        });
        setSelectedCustomer(created);
        finalCustomer = created;
      }
    } else {
      const walkin = customers.find(c => c.id === 'c_walkin');
      if (walkin) {
        setSelectedCustomer(walkin);
        finalCustomer = walkin;
      } else {
        const fallbackWalkin: any = {
          id: 'c_walkin',
          shopId: currentBusiness?.id || 'all',
          name: 'Walk-in Customer',
          mobile: '9999999999',
          address: 'Local Address',
          city: 'Local',
          state: 'Tamil Nadu',
          pincode: '600001',
          gstNumber: '',
          email: 'counter@gmail.com',
          creditLimit: 10000,
          notes: 'System default fallback walkin',
          type: 'retail'
        };
        setSelectedCustomer(fallbackWalkin);
        finalCustomer = fallbackWalkin;
      }
    }
    
    return finalCustomer;
  };

  const handleSaveBill = async (triggerPrint: boolean) => {
    // Intercept to check for edited rates
    const activeItems = rows.filter(r => r.productId !== '');
`;

const handleSaveBillIndex = code.indexOf('const handleSaveBill = async (triggerPrint: boolean) => {', ensureCustStart);
code = code.substring(0, ensureCustStart) + newEnsureCust + code.substring(code.indexOf('const activeItems = rows.filter(r => r.productId !== \'\');', handleSaveBillIndex));


// Also update handleSelectCustomer
const handleSelectCustStart = code.indexOf('const handleSelectCustomer = (cust: Customer) => {');
const handleSelectCustEnd = code.indexOf('const ensureCustomerIsResolved = (): Customer => {');
let newHandleSelectCust = `const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setShowCustSuggestions(false);
    setCustMobile(cust.mobile || '');
    setCustGst(cust.gstNumber || '');
    setCustAddress(cust.address || '');
    setCustEmail(cust.email || '');
    pushNotify('success', \`Selected Customer: \${cust.name}\`);
  };

  `;
code = code.substring(0, handleSelectCustStart) + newHandleSelectCust + code.substring(handleSelectCustEnd);

// Also remove handleCustomerSearchKeyDown and handleCreateAndSelectCustomer
const createAndSelectStart = code.indexOf('const handleCreateAndSelectCustomer = (name: string) => {');
const handleAddCustomerQuick = code.indexOf('const handleAddCustomerQuick = (e: React.FormEvent) => {');
if (createAndSelectStart !== -1 && handleAddCustomerQuick !== -1) {
  code = code.substring(0, createAndSelectStart) + code.substring(handleAddCustomerQuick);
}


// UI replacement
const uiStart = code.indexOf('{/* Customer Selection block */}');
const uiEnd = code.indexOf('{/* GST Toggle Switch */}');
let newUI = `{/* Customer Edit Fields */}
          <div className="flex gap-3 items-center">
            <div className="relative">
              <label className="text-[10px] text-gray-400 font-medium block mb-1">Customer Name (F6)</label>
              <div className="relative">
                <input
                  ref={customerSearchInputRef}
                  type="text"
                  placeholder="Customer Name"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    if (e.target.value.trim() !== '') {
                       setShowCustSuggestions(true);
                    } else {
                       setShowCustSuggestions(false);
                    }
                  }}
                  onFocus={(e) => {
                    e.target.select();
                    if (e.target.value.trim() !== '') setShowCustSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowCustSuggestions(false), 200);
                  }}
                  className="w-48 text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black bg-white truncate"
                />
              </div>

              {/* Autocomplete Suggestions */}
              {showCustSuggestions && filteredCustomers.length > 0 && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
                  {filteredCustomers.map(cust => (
                    <button
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className="w-full text-left p-2.5 hover:bg-gray-50 flex flex-col gap-0.5 border-b border-gray-50/50"
                    >
                      <div className="text-xs font-bold text-gray-800">{cust.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {cust.address ? cust.address : 'No Address'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-medium block mb-1">Customer Address</label>
              <input
                type="text"
                placeholder="Address"
                value={custAddress}
                onChange={(e) => setCustAddress(e.target.value)}
                className="w-56 text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black bg-white truncate"
              />
            </div>
          </div>

          <div className="h-8 border-r border-gray-100 hidden sm:block"></div>

          `;
code = code.substring(0, uiStart) + newUI + code.substring(uiEnd);

fs.writeFileSync('src/components/BillingModule.tsx', code);
console.log("Updated BillingModule");
