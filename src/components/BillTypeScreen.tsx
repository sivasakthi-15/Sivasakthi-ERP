import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, ArrowRight, ArrowLeft, ShoppingBag, Landmark } from 'lucide-react';

export const BillTypeScreen: React.FC = () => {
  const { currentBusiness, setBillType, resetToWelcome } = useApp();
  const [selectedType, setSelectedType] = useState<'normal' | 'contractor' | null>(null);

  if (!currentBusiness) return null;

  const handleContinue = () => {
    if (selectedType) {
      setBillType(selectedType);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 flex flex-col justify-between p-6 md:p-12 font-sans">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between border-b border-gray-100 pb-4">
        <button
          onClick={resetToWelcome}
          className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Select Another Shop</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Current Portal:</span>
          <span className="text-xs font-bold uppercase tracking-wider bg-black text-white px-2.5 py-1 rounded">
            {currentBusiness.name}
          </span>
        </div>
      </div>

      {/* Main Selector */}
      <div className="max-w-3xl w-full mx-auto my-auto py-12">
        <div className="text-center mb-10">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">Step 2 of 3</span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mt-2 mb-3">
            Choose Bill Type
          </h1>
          <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto">
            Choose the fiscal type of invoice to match client requirements. This controls the pricing engines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Card 1: Normal Bill */}
          <button
            id="bill-type-normal"
            onClick={() => setSelectedType('normal')}
            className={`text-left rounded-xl border-2 p-6 bg-white transition-all duration-200 relative flex flex-col justify-between h-56 cursor-pointer outline-none ${
              selectedType === 'normal'
                ? 'border-black shadow-lg ring-1 ring-black/5'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            {selectedType === 'normal' && (
              <div className="absolute top-4 right-4 h-5.5 w-5.5 bg-black rounded-full flex items-center justify-center text-white shadow-sm">
                <Check className="h-3 w-3 stroke-[3px]" />
              </div>
            )}
            <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <h3 className="text-base font-bold text-gray-900">Normal Bill (MRP)</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Best for Walk-in Retail sales. Selling prices are **GST Inclusive**. Tax breakdown is computed backward without increasing final invoice total.
              </p>
            </div>
          </button>

          {/* Card 2: Contractor Bill */}
          <button
            id="bill-type-contractor"
            onClick={() => setSelectedType('contractor')}
            className={`text-left rounded-xl border-2 p-6 bg-white transition-all duration-200 relative flex flex-col justify-between h-56 cursor-pointer outline-none ${
              selectedType === 'contractor'
                ? 'border-black shadow-lg ring-1 ring-black/5'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            {selectedType === 'contractor' && (
              <div className="absolute top-4 right-4 h-5.5 w-5.5 bg-black rounded-full flex items-center justify-center text-white shadow-sm">
                <Check className="h-3 w-3 stroke-[3px]" />
              </div>
            )}
            <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-700">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <h3 className="text-base font-bold text-gray-900">Contractor Bill</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Used for Builders & Electricians. Rates are entered **Exclusive of GST**. Taxes are calculated and added separately on top, changing the grand total.
              </p>
            </div>
          </button>
        </div>

        {/* Continue trigger */}
        <div className="mt-10 text-center max-w-xs mx-auto">
          <button
            id="bill-type-continue"
            disabled={!selectedType}
            onClick={handleContinue}
            className={`w-full py-3.5 px-6 rounded-xl font-medium tracking-tight flex items-center justify-center gap-2 transition-all duration-150 shadow-sm ${
              selectedType
                ? 'bg-black text-white hover:bg-neutral-800 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Open POS Counter</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center pt-4 border-t border-gray-100 text-[11px] text-gray-400 font-mono">
        ERP POS billing pricing rules comply with state and central GST directives.
      </div>
    </div>
  );
};
