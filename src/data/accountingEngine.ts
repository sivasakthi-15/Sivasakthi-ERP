import { Bill, PurchaseBill, Expense, PaymentTransaction, SalesReturn, PurchaseReturn } from '../types';

export interface AccountingLedger {
  id: string;
  name: string;
  group: string; // TallyPrime Group Category
  openingBalance: number;
  currentBalance: number;
  balanceType: 'Debit' | 'Credit';
}

export interface AccountingVoucherItem {
  ledgerId: string;
  ledgerName: string;
  amount: number;
}

export interface AccountingVoucher {
  id: string;
  date: string;
  time?: string;
  voucherNo: string;
  voucherType: 'Journal' | 'Payment' | 'Receipt' | 'Contra' | 'Debit Note' | 'Credit Note' | 'Sales' | 'Purchase';
  reference: string;
  narration: string;
  debits: AccountingVoucherItem[];
  credits: AccountingVoucherItem[];
  isAutomatic?: boolean;
}

export interface AccountGroup {
  name: string;
  parent: string | null;
  category: 'Assets' | 'Liabilities' | 'Capital' | 'Income' | 'Expenses';
}

// Fixed standard groups as in TallyPrime
export const STANDARD_GROUPS: AccountGroup[] = [
  { name: 'Capital Account', parent: null, category: 'Capital' },
  { name: 'Loans (Liability)', parent: null, category: 'Liabilities' },
  { name: 'Current Liabilities', parent: null, category: 'Liabilities' },
  { name: 'Sundry Creditors', parent: 'Current Liabilities', category: 'Liabilities' },
  { name: 'Duties & Taxes', parent: 'Current Liabilities', category: 'Liabilities' },
  { name: 'Fixed Assets', parent: null, category: 'Assets' },
  { name: 'Investments', parent: null, category: 'Assets' },
  { name: 'Current Assets', parent: null, category: 'Assets' },
  { name: 'Sundry Debtors', parent: 'Current Assets', category: 'Assets' },
  { name: 'Cash-in-Hand', parent: 'Current Assets', category: 'Assets' },
  { name: 'Bank Accounts', parent: 'Current Assets', category: 'Assets' },
  { name: 'Sales Accounts', parent: null, category: 'Income' },
  { name: 'Purchase Accounts', parent: null, category: 'Expenses' },
  { name: 'Direct Incomes', parent: null, category: 'Income' },
  { name: 'Indirect Incomes', parent: null, category: 'Income' },
  { name: 'Direct Expenses', parent: null, category: 'Expenses' },
  { name: 'Indirect Expenses', parent: null, category: 'Expenses' },
];

// Helper to compile all ledgers and vouchers
export function compileAccountingDatabase(
  bizId: string,
  bills: Bill[],
  purchases: PurchaseBill[],
  salesReturns: SalesReturn[],
  purchaseReturns: PurchaseReturn[],
  expenses: Expense[],
  payments: PaymentTransaction[],
  manualVouchers: AccountingVoucher[] = []
) {
  // 1. Initial Standard Ledgers
  const ledgersMap: Record<string, AccountingLedger> = {
    'cash_account': { id: 'cash_account', name: 'Cash Account', group: 'Cash-in-Hand', openingBalance: 50000, currentBalance: 50000, balanceType: 'Debit' },
    'bank_account': { id: 'bank_account', name: 'Primary HDFC Bank', group: 'Bank Accounts', openingBalance: 250000, currentBalance: 250000, balanceType: 'Debit' },
    'sales_ledger': { id: 'sales_ledger', name: 'Sales Account', group: 'Sales Accounts', openingBalance: 0, currentBalance: 0, balanceType: 'Credit' },
    'purchase_ledger': { id: 'purchase_ledger', name: 'Purchase Account', group: 'Purchase Accounts', openingBalance: 0, currentBalance: 0, balanceType: 'Debit' },
    'gst_payable': { id: 'gst_payable', name: 'GST Output Payable (Duties & Taxes)', group: 'Duties & Taxes', openingBalance: 0, currentBalance: 0, balanceType: 'Credit' },
    'gst_input_credit': { id: 'gst_input_credit', name: 'GST Input Tax Credit', group: 'Duties & Taxes', openingBalance: 0, currentBalance: 0, balanceType: 'Debit' },
    'capital_acc': { id: 'capital_acc', name: 'Proprietor Capital Account', group: 'Capital Account', openingBalance: 300000, currentBalance: 300000, balanceType: 'Credit' },
    'direct_exp': { id: 'direct_exp', name: 'Direct Freight Charges', group: 'Direct Expenses', openingBalance: 0, currentBalance: 0, balanceType: 'Debit' },
    'salary_exp': { id: 'salary_exp', name: 'Salary & Wages Expense', group: 'Indirect Expenses', openingBalance: 0, currentBalance: 0, balanceType: 'Debit' },
    'rent_exp': { id: 'rent_exp', name: 'Rent & Amenities Expense', group: 'Indirect Expenses', openingBalance: 0, currentBalance: 0, balanceType: 'Debit' },
    'utility_exp': { id: 'utility_exp', name: 'Electricity & Internet Expenses', group: 'Indirect Expenses', openingBalance: 0, currentBalance: 0, balanceType: 'Debit' },
    'misc_exp': { id: 'misc_exp', name: 'Miscellaneous Expenses', group: 'Indirect Expenses', openingBalance: 0, currentBalance: 0, balanceType: 'Debit' },
    'fixed_assets_elec': { id: 'fixed_assets_elec', name: 'Shop Fixtures & Assets', group: 'Fixed Assets', openingBalance: 75000, currentBalance: 75000, balanceType: 'Debit' },
    'depreciation_ledger': { id: 'depreciation_ledger', name: 'Depreciation Expense', group: 'Indirect Expenses', openingBalance: 0, currentBalance: 0, balanceType: 'Debit' },
  };

  const vouchers: AccountingVoucher[] = [];

  // 2. Generate Ledgers for Customers
  const customerIds = new Set<string>();
  const supplierIds = new Set<string>();

  bills.forEach(b => {
    if (b.customerId && b.customerId !== 'c_walkin') {
      customerIds.add(b.customerId);
      const ledgerId = `cust_${b.customerId}`;
      if (!ledgersMap[ledgerId]) {
        ledgersMap[ledgerId] = {
          id: ledgerId,
          name: `${b.customerName} Ledger (Customer)`,
          group: 'Sundry Debtors',
          openingBalance: 0,
          currentBalance: 0,
          balanceType: 'Debit',
        };
      }
    }
  });

  purchases.forEach(p => {
    if (p.supplierId) {
      supplierIds.add(p.supplierId);
      const ledgerId = `supp_${p.supplierId}`;
      if (!ledgersMap[ledgerId]) {
        ledgersMap[ledgerId] = {
          id: ledgerId,
          name: `${p.supplierName} Ledger (Supplier)`,
          group: 'Sundry Creditors',
          openingBalance: 0,
          currentBalance: 0,
          balanceType: 'Credit',
        };
      }
    }
  });

  // Make sure payments sync to ledger creation
  payments.forEach(pay => {
    const isCust = pay.partyType === 'customer';
    const ledgerId = isCust ? `cust_${pay.partyId}` : `supp_${pay.partyId}`;
    if (!ledgersMap[ledgerId]) {
      ledgersMap[ledgerId] = {
        id: ledgerId,
        name: `${pay.partyName} Ledger (${isCust ? 'Customer' : 'Supplier'})`,
        group: isCust ? 'Sundry Debtors' : 'Sundry Creditors',
        openingBalance: 0,
        currentBalance: 0,
        balanceType: isCust ? 'Debit' : 'Credit',
      };
    }
  });

  // 3. Compile Vouchers from Sales Invoices (Bills)
  bills.forEach(b => {
    if (b.status === 'cancelled' || b.status === 'on_hold') return;
    if (['quotation', 'proforma', 'challan'].includes(b.docType || '')) return;

    const isRefundDoc = b.docType === 'sales_return' || b.docType === 'credit_note';
    const hasGST = b.gstEnabled;
    const gstVal = b.cgst + b.sgst + b.igst;
    const taxableVal = b.taxableAmount;
    const grandTotal = b.grandTotal;

    const debits: AccountingVoucherItem[] = [];
    const credits: AccountingVoucherItem[] = [];

    const cashOrBankLedger = b.paymentMode === 'bank_transfer' || b.paymentMode === 'upi' || b.paymentMode === 'cheque' ? 'bank_account' : 'cash_account';
    const customerLedgerId = b.customerId !== 'c_walkin' ? `cust_${b.customerId}` : cashOrBankLedger;

    if (!isRefundDoc) {
      // Normal sales: Debit Customer/Cash/Bank, Credit Sales Account, Credit Output GST
      debits.push({ ledgerId: customerLedgerId, ledgerName: ledgersMap[customerLedgerId]?.name || 'Cash/Customer', amount: grandTotal });
      credits.push({ ledgerId: 'sales_ledger', ledgerName: 'Sales Account', amount: taxableVal });
      if (hasGST && gstVal > 0) {
        credits.push({ ledgerId: 'gst_payable', ledgerName: 'GST Output Payable', amount: gstVal });
      }

      // If split or partial payment happened, double entry settles Customer Ledger against Cash/Bank ledger immediately
      if (b.paidAmount > 0 && b.customerId !== 'c_walkin') {
        vouchers.push({
          id: `auto_pay_sale_${b.id}`,
          date: b.date,
          time: b.time,
          voucherNo: `RCT-${b.billNumber}`,
          voucherType: 'Receipt',
          reference: b.billNumber,
          narration: `Receipt settled against Invoice ${b.billNumber}`,
          debits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger].name, amount: b.paidAmount }],
          credits: [{ ledgerId: customerLedgerId, ledgerName: ledgersMap[customerLedgerId].name, amount: b.paidAmount }],
          isAutomatic: true,
        });
      }
    } else {
      // Sales return / Credit Note: Debit Sales Return Account, Debit Output GST, Credit Customer
      debits.push({ ledgerId: 'sales_ledger', ledgerName: 'Sales Account (Return)', amount: taxableVal });
      if (hasGST && gstVal > 0) {
        debits.push({ ledgerId: 'gst_payable', ledgerName: 'GST Output Payable (Reversal)', amount: gstVal });
      }
      credits.push({ ledgerId: customerLedgerId, ledgerName: ledgersMap[customerLedgerId]?.name || 'Cash/Customer', amount: grandTotal });
    }

    vouchers.push({
      id: `auto_sale_${b.id}`,
      date: b.date,
      time: b.time,
      voucherNo: b.billNumber,
      voucherType: isRefundDoc ? 'Credit Note' : 'Sales',
      reference: b.billNumber,
      narration: `Automated double entry for Invoice ${b.billNumber}`,
      debits,
      credits,
      isAutomatic: true,
    });
  });

  // 4. Compile Vouchers from Purchase Bills
  purchases.forEach(p => {
    const hasGST = p.gstAmount > 0;
    const gstVal = p.gstAmount;
    const taxableVal = p.subtotal;
    const grandTotal = p.grandTotal;

    const supplierLedgerId = `supp_${p.supplierId}`;
    const cashOrBankLedger = p.paymentMode === 'bank_transfer' || p.paymentMode === 'upi' || p.paymentMode === 'cheque' ? 'bank_account' : 'cash_account';
    
    // Normal Purchase: Debit Purchases, Debit GST Input Tax Credit, Credit Supplier (or Cash/Bank if cash-purchased)
    const purchaseCreditLedger = p.paymentMode === 'credit' ? supplierLedgerId : cashOrBankLedger;

    const debits: AccountingVoucherItem[] = [
      { ledgerId: 'purchase_ledger', ledgerName: 'Purchase Account', amount: taxableVal }
    ];
    if (hasGST && gstVal > 0) {
      debits.push({ ledgerId: 'gst_input_credit', ledgerName: 'GST Input Tax Credit', amount: gstVal });
    }

    const credits: AccountingVoucherItem[] = [
      { ledgerId: purchaseCreditLedger, ledgerName: ledgersMap[purchaseCreditLedger]?.name || 'Cash/Supplier', amount: grandTotal }
    ];

    vouchers.push({
      id: `auto_pur_${p.id}`,
      date: p.date,
      voucherNo: p.purchaseNumber,
      voucherType: 'Purchase',
      reference: p.purchaseNumber,
      narration: `Automated purchase double entry for ${p.purchaseNumber} from ${p.supplierName}`,
      debits,
      credits,
      isAutomatic: true,
    });

    // Handle payments made on Purchase immediately
    if (p.paidAmount > 0 && p.paymentMode === 'credit') {
      vouchers.push({
        id: `auto_pay_pur_${p.id}`,
        date: p.date,
        voucherNo: `PMT-${p.purchaseNumber}`,
        voucherType: 'Payment',
        reference: p.purchaseNumber,
        narration: `Payment voucher for purchase invoice ${p.purchaseNumber}`,
        debits: [{ ledgerId: supplierLedgerId, ledgerName: ledgersMap[supplierLedgerId]?.name || 'Supplier', amount: p.paidAmount }],
        credits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger].name, amount: p.paidAmount }],
        isAutomatic: true,
      });
    }
  });

  // 5. Compile Vouchers from Purchases Returns
  purchaseReturns.forEach(pr => {
    const gstVal = pr.items.reduce((sum, item) => sum + (item.total * (item.gstPercent / (100 + item.gstPercent))), 0);
    const taxableVal = pr.grandTotal - gstVal;
    const supplierLedgerId = `supp_${pr.supplierId}`;

    // Debit Supplier, Credit Purchase Account (Reversal), Credit GST Input Credit (Reversal)
    const debits = [{ ledgerId: supplierLedgerId, ledgerName: ledgersMap[supplierLedgerId]?.name || 'Supplier', amount: pr.grandTotal }];
    const credits = [
      { ledgerId: 'purchase_ledger', ledgerName: 'Purchase Account (Return)', amount: taxableVal }
    ];
    if (gstVal > 0) {
      credits.push({ ledgerId: 'gst_input_credit', ledgerName: 'GST Input Tax Credit (Reversal)', amount: gstVal });
    }

    vouchers.push({
      id: `auto_pur_ret_${pr.id}`,
      date: pr.date,
      voucherNo: pr.returnNumber,
      voucherType: 'Debit Note',
      reference: pr.returnNumber,
      narration: `Automated debit note for return against ${pr.purchaseInvoiceNumber}`,
      debits,
      credits,
      isAutomatic: true,
    });
  });

  // 6. Compile Vouchers from Expenses Book
  expenses.forEach(e => {
    const categoryLedgerId = e.category === 'rent' ? 'rent_exp' :
                             e.category === 'salary' ? 'salary_exp' :
                             e.category === 'electricity' || e.category === 'internet' ? 'utility_exp' : 'misc_exp';
    
    const cashOrBankLedger = e.paymentMode === 'bank_transfer' || e.paymentMode === 'upi' || e.paymentMode === 'cheque' ? 'bank_account' : 'cash_account';

    // Expense Payment: Debit Expense, Credit Cash/Bank
    vouchers.push({
      id: `auto_exp_${e.id}`,
      date: e.date,
      voucherNo: `EXP-${e.id.substring(0, 6).toUpperCase()}`,
      voucherType: 'Payment',
      reference: (e.category || '').toUpperCase(),
      narration: `Expense logged for ${e.description}`,
      debits: [{ ledgerId: categoryLedgerId, ledgerName: ledgersMap[categoryLedgerId].name, amount: e.amount }],
      credits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger].name, amount: e.amount }],
      isAutomatic: true,
    });
  });

  // 7. Compile Vouchers from Payment Ledger Settlements (Manual Payments & Receipts)
  payments.forEach(pay => {
    // Avoid double counting payments generated directly with bills/purchases
    if (pay.refId && (pay.refId.startsWith('b_') || pay.refId.startsWith('pur_'))) {
      // These are already handled inside bill / purchase iteration!
      return;
    }

    const isCust = pay.partyType === 'customer';
    const ledgerId = isCust ? `cust_${pay.partyId}` : `supp_${pay.partyId}`;
    const cashOrBankLedger = pay.paymentMode === 'bank_transfer' || pay.paymentMode === 'upi' || pay.paymentMode === 'cheque' ? 'bank_account' : 'cash_account';

    if (pay.type === 'receipt') {
      // Receipt: Debit Cash/Bank, Credit Customer
      vouchers.push({
        id: `auto_pay_settle_${pay.id}`,
        date: pay.date,
        voucherNo: `REC-${pay.id.substring(0, 6).toUpperCase()}`,
        voucherType: 'Receipt',
        reference: pay.notes,
        narration: pay.notes || `Receipt entry from customer ${pay.partyName}`,
        debits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger].name, amount: pay.amount }],
        credits: [{ ledgerId: ledgerId, ledgerName: ledgersMap[ledgerId]?.name || 'Customer Ledger', amount: pay.amount }],
        isAutomatic: true,
      });
    } else {
      // Payment: Debit Supplier, Credit Cash/Bank
      vouchers.push({
        id: `auto_pay_settle_${pay.id}`,
        date: pay.date,
        voucherNo: `PAY-${pay.id.substring(0, 6).toUpperCase()}`,
        voucherType: 'Payment',
        reference: pay.notes,
        narration: pay.notes || `Payment entry to supplier ${pay.partyName}`,
        debits: [{ ledgerId: ledgerId, ledgerName: ledgersMap[ledgerId]?.name || 'Supplier Ledger', amount: pay.amount }],
        credits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger].name, amount: pay.amount }],
        isAutomatic: true,
      });
    }
  });

  // 8. Add Manual/Depreciation/Asset Purchase Journal Vouchers
  manualVouchers.forEach(mv => {
    vouchers.push(mv);
  });

  // 9. Sort all Vouchers by Date (descending)
  vouchers.sort((a, b) => b.date.localeCompare(a.date));

  // 10. Compute Current Ledger Balances from opening balances and voucher transactions
  Object.keys(ledgersMap).forEach(key => {
    const ledger = ledgersMap[key];
    let debitsSum = 0;
    let creditsSum = 0;

    vouchers.forEach(v => {
      v.debits.forEach(d => {
        if (d.ledgerId === key) debitsSum += d.amount;
      });
      v.credits.forEach(c => {
        if (c.ledgerId === key) creditsSum += c.amount;
      });
    });

    const isDebitPreferred = ['Cash-in-Hand', 'Bank Accounts', 'Purchase Accounts', 'Direct Expenses', 'Indirect Expenses', 'Fixed Assets', 'Investments', 'Sundry Debtors'].includes(ledger.group);
    
    let bal = ledger.openingBalance;
    if (isDebitPreferred) {
      bal = bal + debitsSum - creditsSum;
      ledger.currentBalance = Math.abs(bal);
      ledger.balanceType = bal >= 0 ? 'Debit' : 'Credit';
    } else {
      bal = bal + creditsSum - debitsSum;
      ledger.currentBalance = Math.abs(bal);
      ledger.balanceType = bal >= 0 ? 'Credit' : 'Debit';
    }
  });

  return {
    ledgers: Object.values(ledgersMap),
    vouchers,
  };
}

// Balance Sheet Compiler
export function compileBalanceSheet(ledgers: AccountingLedger[]) {
  const assets: { name: string; amount: number }[] = [];
  const liabilities: { name: string; amount: number }[] = [];
  const capital: { name: string; amount: number }[] = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalCapital = 0;

  ledgers.forEach(l => {
    const isDebit = l.balanceType === 'Debit';
    const val = isDebit ? l.currentBalance : -l.currentBalance;

    if (['Cash-in-Hand', 'Bank Accounts', 'Fixed Assets', 'Investments', 'Sundry Debtors'].includes(l.group)) {
      assets.push({ name: l.name, amount: l.currentBalance });
      totalAssets += l.currentBalance;
    } else if (['Sundry Creditors', 'Duties & Taxes', 'Current Liabilities', 'Loans (Liability)'].includes(l.group)) {
      liabilities.push({ name: l.name, amount: l.currentBalance });
      totalLiabilities += l.currentBalance;
    } else if (l.group === 'Capital Account') {
      capital.push({ name: l.name, amount: l.currentBalance });
      totalCapital += l.currentBalance;
    }
  });

  return {
    assets,
    liabilities,
    capital,
    totalAssets,
    totalLiabilities,
    totalCapital,
  };
}

// Profit & Loss Statement Compiler
export function compileProfitAndLoss(ledgers: AccountingLedger[]) {
  let salesValue = 0;
  let purchaseValue = 0;
  let directExpense = 0;
  let indirectExpense = 0;
  let otherIncome = 0;

  ledgers.forEach(l => {
    if (l.group === 'Sales Accounts') {
      salesValue += l.currentBalance;
    } else if (l.group === 'Purchase Accounts') {
      purchaseValue += l.currentBalance;
    } else if (l.group === 'Direct Expenses') {
      directExpense += l.currentBalance;
    } else if (l.group === 'Indirect Expenses') {
      indirectExpense += l.currentBalance;
    } else if (l.group === 'Direct Incomes' || l.group === 'Indirect Incomes') {
      otherIncome += l.currentBalance;
    }
  });

  const grossProfit = salesValue - purchaseValue - directExpense;
  const netProfit = grossProfit + otherIncome - indirectExpense;

  return {
    sales: salesValue,
    purchases: purchaseValue,
    directExpense,
    indirectExpense,
    otherIncome,
    grossProfit,
    netProfit,
  };
}
