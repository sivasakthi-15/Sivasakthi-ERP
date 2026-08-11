import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BUSINESSES } from '../data/initialData';
import { Check, ArrowRight, Zap, Droplet } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { selectBusiness } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedId) {
      selectBusiness(selectedId);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 flex flex-col justify-between p-6 md:p-12 font-sans selection:bg-gray-200">
      {/* Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-black rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-mono font-bold text-sm tracking-widest">E</span>
          </div>
          <span className="font-sans font-semibold tracking-tight text-lg text-gray-900">ERP Prime</span>
        </div>
        <div className="text-xs font-mono text-gray-500 tracking-wider">v1.2.0 (Stable)</div>
      </div>

      {/* Main Card Selector */}
      <div className="max-w-4xl w-full mx-auto my-auto py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            Select Business Channel
          </h1>
          <p className="text-sm md:text-base text-gray-500 max-w-lg mx-auto">
            Choose an enterprise workspace to initialize the billing engines, product inventory registers, and customer accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {BUSINESSES.map((biz) => {
            const isSelected = selectedId === biz.id;
            const isElec = biz.id === 'sivasakthi_elec';

            return (
              <button
                key={biz.id}
                id={`biz-card-${biz.id}`}
                onClick={() => setSelectedId(biz.id)}
                className={`text-left rounded-2xl border-2 p-6 md:p-8 bg-white transition-all duration-300 relative flex flex-col justify-between group h-64 md:h-72 cursor-pointer outline-none ${
                  isSelected
                    ? 'border-black shadow-lg ring-1 ring-black/5 -translate-y-1'
                    : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                }`}
              >
                {/* Active check indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 h-6 w-6 bg-black rounded-full flex items-center justify-center text-white shadow-sm transition-scale duration-200">
                    <Check className="h-3.5 w-3.5 stroke-[3px]" />
                  </div>
                )}

                {/* Logo & Category Icon */}
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center font-bold text-xl ${
                    isElec 
                      ? 'bg-amber-50 text-amber-600' 
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    {isElec ? (
                      <Zap className="h-7 w-7 stroke-[2px]" />
                    ) : (
                      <Droplet className="h-7 w-7 stroke-[2px]" />
                    )}
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                      {isElec ? 'Electricals & Wires' : 'Hardware & Plumbing'}
                    </div>
                    <div className="text-xs text-gray-500">Shop ID: {biz.defaultDetails.invoicePrefix}</div>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-4">
                  <h3 className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-black transition-colors duration-150">
                    {biz.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {biz.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                  {biz.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue trigger */}
        <div className="mt-12 text-center max-w-sm mx-auto">
          <button
            id="continue-button"
            disabled={!selectedId}
            onClick={handleContinue}
            className={`w-full py-4 px-6 rounded-xl font-medium tracking-tight flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
              selectedId
                ? 'bg-black text-white hover:bg-neutral-800 cursor-pointer active:scale-[0.99]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Initialize System</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="text-[10px] text-gray-400 mt-3 font-mono">
            Requires active shop profile selection. Multi-terminal sync ready.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center justify-between pt-6 border-t border-gray-100 text-[11px] text-gray-400">
        <div>&copy; 2026 ERP POS Prime. All rights reserved.</div>
        <div className="flex items-center gap-4 mt-2 md:mt-0 font-mono">
          <span>Security TLS 1.3</span>
          <span>&middot;</span>
          <span>Database LocalFS Encrypted</span>
        </div>
      </div>
    </div>
  );
};
