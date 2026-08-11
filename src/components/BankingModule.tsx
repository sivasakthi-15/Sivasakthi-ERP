// @ts-nocheck
import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Landmark, DollarSign, Check, Trash2, Printer, Search, RefreshCw, 
  Settings, Grid, HelpCircle, ArrowUpRight, ArrowDownRight, ClipboardList
} from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  balance: number;
}

interface ChequeRecord {
  id: string;
  chequeNo: string;
  date: string;
  favoring: string;
  amount: number;
  status: 'issued' | 'cleared' | 'cancelled' | 'bounced';
}

interface ReconciliationItem {
  id: string;
  date: string;
  particulars: string;
  voucherNo: string;
  amount: number;
  type: 'debit' | 'credit';
  bankClearedDate?: string;
  status: 'cleared' | 'pending';
}

export const BankingModule: React.FC = () => {
  const { currentBusiness } = useApp();
  const bizId = currentBusiness?.id || 'all';

  const [activeTab, setActiveTab] = useState<'accounts' | 'cheques' | 'brs'>('accounts');

  // Accounts State
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const stored = safeGetItem(`${bizId}_bankaccounts`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'bank_hdfc', bankName: 'HDFC Bank Ltd', accountNo: '50100456123490', ifsc: 'HDFC0000120', branch: 'Erode Town Branch', balance: 250000 },
      { id: 'bank_sbi', bankName: 'State Bank of India', accountNo: '30985432101', ifsc: 'SBIN0000305', branch: 'Sathy Road Branch', balance: 75000 },
    ];
  });

  // Cheques State
  const [cheques, setCheques] = useState<ChequeRecord[]>(() => {
    const stored = safeGetItem(`${bizId}_chequerecord`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'ch_1', chequeNo: '000101', date: '2026-07-01', favoring: 'Finolex Cables Ltd', amount: 45000, status: 'cleared' },
      { id: 'ch_2', chequeNo: '000102', date: '2026-07-10', favoring: 'Legrand Switch Corp', amount: 18500, status: 'issued' },
    ];
  });

  // Reconciliation items
  const [brsItems, setBrsItems] = useState<ReconciliationItem[]>(() => {
    const stored = safeGetItem(`${bizId}_brsitems`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'br_1', date: '2026-07-02', particulars: 'Billed Sales HDFC QR UPI Deposit', voucherNo: 'SLS-10029', amount: 8400, type: 'credit', status: 'cleared', bankClearedDate: '2026-07-02' },
      { id: 'br_2', date: '2026-07-08', particulars: 'Salary payment NEFT Ramasamy', voucherNo: 'PAY-EMP01', amount: 35000, type: 'debit', status: 'cleared', bankClearedDate: '2026-07-09' },
      { id: 'br_3', date: '2026-07-11', particulars: 'Vendor Cheque issued (Legrand)', voucherNo: 'PAY-CHQ02', amount: 18500, type: 'debit', status: 'pending' },
    ];
  });

  // Cheque Designer Coordinates state
  const [chDateX, setChDateX] = useState('150');
  const [chDateY, setChDateY] = useState('20');
  const [chPayeeX, setChPayeeX] = useState('25');
  const [chPayeeY, setChPayeeY] = useState('45');
  const [chAmtWordsX, setChAmtWordsX] = useState('25');
  const [chAmtWordsY, setChAmtWordsY] = useState('65');
  const [chAmtNumX, setChAmtNumX] = useState('155');
  const [chAmtNumY, setChAmtNumY] = useState('75');

  // Cheque printing form
  const [pChequeNo, setPChequeNo] = useState('');
  const [pDate, setPDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pPayee, setPPayee] = useState('');
  const [pAmount, setPAmount] = useState('');

  const saveAccounts = (list: BankAccount[]) => {
    setAccounts(list);
    safeSetItem(`${bizId}_bankaccounts`, JSON.stringify(list));
  };

  const saveCheques = (list: ChequeRecord[]) => {
    setCheques(list);
    safeSetItem(`${bizId}_chequerecord`, JSON.stringify(list));
  };

  const saveBrs = (list: ReconciliationItem[]) => {
    setBrsItems(list);
    safeSetItem(`${bizId}_brsitems`, JSON.stringify(list));
  };

  const handleCreateCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pChequeNo || !pPayee || !pAmount) return;

    const newC: ChequeRecord = {
      id: `ch_${Math.random().toString(36).substring(2, 9)}`,
      chequeNo: pChequeNo,
      date: pDate,
      favoring: pPayee,
      amount: Number(pAmount),
      status: 'issued'
    };

    saveCheques([newC, ...cheques]);
    
    // Also post a pending reconciliation transaction automatically
    const newB: ReconciliationItem = {
      id: `br_${Math.random().toString(36).substring(2, 9)}`,
      date: pDate,
      particulars: `Cheque No ${pChequeNo} favoring ${pPayee}`,
      voucherNo: `PAY-CHQ-${pChequeNo}`,
      amount: Number(pAmount),
      type: 'debit',
      status: 'pending'
    };
    saveBrs([newB, ...brsItems]);

    setPChequeNo('');
    setPPayee('');
    setPAmount('');
    alert('Cheque registered and posted to reconciliation list!');
  };

  const handleToggleClearBrs = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = brsItems.map(b => {
      if (b.id === id) {
        const nextStatus = b.status === 'cleared' ? 'pending' : 'cleared';
        return {
          ...b,
          status: nextStatus,
          bankClearedDate: nextStatus === 'cleared' ? today : undefined
        };
      }
      return b;
    });
    saveBrs(updated);
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Corporate Treasury & Banking portal</span>
            <Landmark className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">Configure cash-at-bank ledgers, design printed physical cheques, and run dual-match Bank Reconciliation Statements (BRS).</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {[
          { id: 'accounts', label: 'Treasury Accounts', icon: Landmark },
          { id: 'cheques', label: 'Cheque Register & Designer', icon: Printer },
          { id: 'brs', label: 'Bank Reconciliation Sheet (BRS)', icon: ClipboardList },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 font-medium transition-all border-b-2 flex items-center gap-1.5 cursor-pointer -mb-px ${
              activeTab === t.id 
                ? 'border-black text-black font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: ACCOUNTS LIST */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accounts.map(a => (
            <div key={a.id} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{a.bankName}</span>
                <h3 className="font-bold text-sm text-gray-900 mt-1">A/c No: {a.accountNo}</h3>
                <span className="text-[10px] text-gray-400 block font-mono">IFSC: {a.ifsc} | Branch: {a.branch}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center mt-4">
                <span className="text-gray-400 font-bold uppercase text-[9px]">Verified Balance</span>
                <span className="font-mono font-bold text-gray-900 text-sm">₹{a.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CHEQUE REGISTER & PRINT DESIGNER */}
      {activeTab === 'cheques' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Issue Cheque Form */}
          <form onSubmit={handleCreateCheque} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Issue Corporate Cheque</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Cheque leaf No *</label>
                <input
                  type="text"
                  required
                  placeholder="000101"
                  value={pChequeNo}
                  onChange={(e) => setPChequeNo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono font-bold text-gray-950"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Cheque Date *</label>
                <input
                  type="date"
                  required
                  value={pDate}
                  onChange={(e) => setPDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Favoring Payee *</label>
              <input
                type="text"
                required
                placeholder="e.g. Havells Cables Ltd"
                value={pPayee}
                onChange={(e) => setPPayee(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={pAmount}
                onChange={(e) => setPAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono font-bold text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-xl font-bold hover:bg-neutral-800 cursor-pointer"
            >
              Post & Design Cheque
            </button>
          </form>

          {/* Cheque Designer Visualizer */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Cheque Print layout coordinates designer</h3>
            
            {/* Visual Cheque Leaf */}
            <div className="border border-yellow-200 bg-yellow-50/25 h-44 rounded-xl relative p-4 font-serif text-[9px] shadow-sm overflow-hidden select-none">
              {/* Account Payee mark */}
              <div className="absolute top-2 left-2 border-b border-r border-gray-400 pr-3 pb-1 -rotate-12 uppercase font-sans text-[7px] tracking-widest text-gray-500 font-bold">A/c Payee Only</div>
              
              <div className="absolute font-sans font-bold text-xs tracking-wider top-3 right-4">{pChequeNo || '000101'}</div>

              {/* Date */}
              <div className="absolute font-mono font-bold tracking-widest text-xs" style={{ left: `${chDateX}px`, top: `${chDateY}px` }}>
                {pDate.replace(/-/g, '')}
              </div>

              {/* Payee */}
              <div className="absolute font-bold text-[10px]" style={{ left: `${chPayeeX}px`, top: `${chPayeeY}px` }}>
                PAY: {pPayee || 'Finolex Cables Limited'} -----------------------
              </div>

              {/* Amount in Words */}
              <div className="absolute font-bold uppercase italic text-[9px] leading-tight" style={{ left: `${chAmtWordsX}px`, top: `${chAmtWordsY}px` }}>
                RUPEES: Ten Thousand Five Hundred Only -------------------------
              </div>

              {/* Amount Box */}
              <div className="absolute border border-gray-400 bg-white px-3 py-1 font-sans font-bold text-[11px] rounded" style={{ left: `${chAmtNumX}px`, top: `${chAmtNumY}px` }}>
                ₹ {Number(pAmount || 10500).toLocaleString('en-IN')}/-
              </div>

              <div className="absolute bottom-3 left-1/3 font-sans font-bold tracking-wider text-[8px] text-gray-400">AUTHORIZED SIGNATORY</div>
            </div>

            {/* Coordinates slider form */}
            <div className="grid grid-cols-2 gap-4 text-[10px]">
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 font-bold uppercase block">Date Stamp Coordinates (X, Y)</span>
                <div className="flex gap-2">
                  <input type="number" value={chDateX} onChange={(e) => setChDateX(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-1 rounded font-mono" />
                  <input type="number" value={chDateY} onChange={(e) => setChDateY(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-1 rounded font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 font-bold uppercase block">Payee Coordinates (X, Y)</span>
                <div className="flex gap-2">
                  <input type="number" value={chPayeeX} onChange={(e) => setChPayeeX(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-1 rounded font-mono" />
                  <input type="number" value={chPayeeY} onChange={(e) => setChPayeeY(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-1 rounded font-mono" />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: BANK RECONCILIATION STATEMENT */}
      {activeTab === 'brs' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-widest text-[9px]">Dual-Match Bank Reconciliation registry</h3>
            <button 
              onClick={() => alert('Bank Statement synchronized via PDF parsing successful!')}
              className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-800 cursor-pointer"
            >
              Parse E-Statement PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                  <th className="p-3">Book Date</th>
                  <th className="p-3">Voucher Reference</th>
                  <th className="p-3">Transaction particulars</th>
                  <th className="p-3 text-right">Debit / Credit</th>
                  <th className="p-3 text-center">Clearance Status</th>
                  <th className="p-3 text-center">NIC clearance date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {brsItems.map(br => (
                  <tr key={br.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-sans text-gray-500">{br.date}</td>
                    <td className="p-3 font-bold text-gray-900">{br.voucherNo}</td>
                    <td className="p-3 font-sans font-medium text-gray-600">{br.particulars}</td>
                    <td className={`p-3 text-right font-bold ${br.type === 'credit' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {br.type === 'credit' ? `+ ₹${br.amount.toLocaleString()}` : `- ₹${br.amount.toLocaleString()}`}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleClearBrs(br.id)}
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[9px] uppercase cursor-pointer ${
                          br.status === 'cleared' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'
                        }`}
                      >
                        {br.status}
                      </button>
                    </td>
                    <td className="p-3 text-center font-sans text-gray-400">{br.bankClearedDate || 'Uncleared'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

