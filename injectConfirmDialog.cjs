const fs = require('fs');

let content = fs.readFileSync('src/components/BillingModule.tsx', 'utf8');

const confirmDialogUI = `
      {showUpdateMasterDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-gray-100">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Update Product Master?</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">You changed the selling price for some products during billing.</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                Do you want to permanently update the Product Master price? This will apply to all <strong>NEW</strong> bills moving forward.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    // Update Product Master
                    for (const update of editedMasterProducts) {
                      const prod = products.find(p => p.id === update.id);
                      if (prod) {
                        try {
                          await updateProduct(update.id, {
                            ...prod,
                            [currentBillType === 'contractor' ? 'purchasePrice' : 'sellingPrice']: update.rate,
                            mrp: currentBillType !== 'contractor' ? Math.round(update.rate * 1.25) : prod.mrp
                          });
                        } catch (e) { console.error('Failed to update product master', e); }
                      }
                    }
                    setShowUpdateMasterDialog(false);
                    const trigger = pendingBillSave;
                    setPendingBillSave(null);
                    setEditedMasterProducts([]);
                    handleSaveBill(trigger);
                  }}
                  className="flex-1 bg-black text-white hover:bg-neutral-800 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  YES, Update Master
                </button>
                <button
                  onClick={() => {
                    // Don't update, just save bill
                    setShowUpdateMasterDialog(false);
                    const trigger = pendingBillSave;
                    setPendingBillSave(null);
                    setEditedMasterProducts([]);
                    handleSaveBill(trigger);
                  }}
                  className="flex-1 bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-bold text-sm transition-all"
                >
                  NO, Just Save Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/\{showInvoiceModal && invoiceToPreview && \(/, confirmDialogUI + '\n      {showInvoiceModal && invoiceToPreview && (');

fs.writeFileSync('src/components/BillingModule.tsx', content, 'utf8');
console.log('Injected confirm dialog');
