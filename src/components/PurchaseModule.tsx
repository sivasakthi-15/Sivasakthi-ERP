import React, { useState } from 'react';
import { POSection } from './purchase/POSection';
import { GRNSection } from './purchase/GRNSection';
import { InvoiceSection } from './purchase/InvoiceSection';
import { ReturnSection } from './purchase/ReturnSection';
import { DebitNoteSection } from './purchase/DebitNoteSection';
import { LedgerSection } from './purchase/LedgerSection';
import { HistorySection } from './purchase/HistorySection';
import { GRN, PurchaseBill } from '../types';
import { 
  FileText, ClipboardList, CheckSquare, RefreshCw, 
  BookOpen, History, Receipt, ChevronRight, Landmark 
} from 'lucide-react';

export const PurchaseModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'po' | 'grn' | 'invoice' | 'return' | 'debit' | 'ledger' | 'history'>('invoice');
  const [editingPurchase, setEditingPurchase] = useState<PurchaseBill | null>(null);
  
  // Cross-tab conversion states
  const [importedGRN, setImportedGRN] = useState<GRN | null>(null);

  const handleImportGRN = (grn: GRN) => {
    setImportedGRN(grn);
    setActiveTab('invoice');
  };

  const tabs = [
    { id: 'po', name: 'Purchase Order (PO)', icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
    { id: 'grn', name: 'Goods Receipt (GRN)', icon: CheckSquare, color: 'text-sky-600 bg-sky-50' },
    { id: 'invoice', name: 'Purchase Invoice', icon: Receipt, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'return', name: 'Returns & Credit Notes', icon: RefreshCw, color: 'text-rose-600 bg-rose-50' },
    { id: 'debit', name: 'Debit Notes (DN)', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'ledger', name: 'Supplier Ledgers', icon: BookOpen, color: 'text-violet-600 bg-violet-50' },
    { id: 'history', name: 'Purchase History & Auditing', icon: History, color: 'text-slate-600 bg-slate-50' },
  ] as const;

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto space-y-6 font-sans">
      
      {/* Title Header bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Procurement Center</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-emerald-650 font-bold">Enterprise Mode</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">Purchase & Inward Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Professional sales-lifecycle procurement flow modeling Tally Prime & Marg ERP standards.
          </p>
        </div>

        {/* Dynamic Context Mini Indicators */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Inventory Auto-Deduction Connected
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
            Supplier Balance Sheets Active
          </div>
        </div>
      </div>

      {/* Sleek Subnavigation horizontal tab menu */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-2 flex flex-wrap gap-1.5 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'invoice') {
                  setImportedGRN(null); // clear staging if they navigate away
                }
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-slate-900 text-white shadow-sm font-extrabold scale-102' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`p-1 rounded-lg ${isSelected ? 'bg-slate-800' : tab.color}`}>
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : ''}`} />
              </div>
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Render sub-modules based on activeTab */}
      <div className="transition-all duration-300">
        {activeTab === 'po' && <POSection />}
        {activeTab === 'grn' && <GRNSection onConvertToInvoice={handleImportGRN} />}
        {activeTab === 'invoice' && (
          <InvoiceSection 
            importedGRN={importedGRN} 
            clearImportedGRN={() => setImportedGRN(null)} 
            editingPurchase={editingPurchase}
            clearEditingPurchase={() => setEditingPurchase(null)}
          />
        )}
        {activeTab === 'history' && <HistorySection onEditPurchase={purchase => { setEditingPurchase(purchase); setActiveTab('invoice'); }} />}
        {activeTab === 'return' && <ReturnSection />}
        {activeTab === 'debit' && <DebitNoteSection />}
        {activeTab === 'ledger' && <LedgerSection />}
      </div>

    </div>
  );
};
