// @ts-nocheck
import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Customer, Bill, BillItem, BillStatus } from '../types';
import { api } from '../services/api';
import { 
  Plus, Search, Trash2, HelpCircle, Save, Printer, RefreshCw, X, AlertTriangle, 
  Check, User, Users, Minimize2, CreditCard, Landmark, CheckCircle2,
  Copy, ArrowUp, ArrowDown, Lock, Unlock, FolderOpen, AlertCircle, Edit3
} from 'lucide-react';

interface RowState {
  id: string;
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: string; // string to handle decimal inputs easily in textfields
  unit: string;
  rate: string;
  discountPercent: string;
  gstPercent: number;
  total: number;
  isRateEdited: boolean;
  originalRate: number;
}

export const BillingModule: React.FC = () => {
  const { 
    products, customers, bills, createBill, updateBill, deleteBill, nextBillNumber, currentBillType, setBillType,
    businessDetails, draftBill, saveDraft, addProduct, addCustomer, updateCustomer, updateProduct, currentBusiness,
    editingBillId, setEditingBillId
  } = useApp();

  const [resumedHoldBillId, setResumedHoldBillId] = useState<string | null>(null);

  // Primary states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustSuggestions, setShowCustSuggestions] = useState(false);
  const [showAddCustModal, setShowAddCustModal] = useState(false);

  // Inline customer details states
  const [custMobile, setCustMobile] = useState('');
  const [custGst, setCustGst] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [showEditCustInline, setShowEditCustInline] = useState(false);

  // Billing rows (15 rows initially)
  const [rows, setRows] = useState<RowState[]>([]);
  const [gstEnabled, setGstEnabled] = useState(true);

  // Inline row product search states (Business Requirement 3)
  const [inlineSearchRowId, setInlineSearchRowId] = useState<string | null>(null);
  const [inlineSearchQuery, setInlineSearchQuery] = useState('');
  const [inlineSearchSuggestions, setInlineSearchSuggestions] = useState<Product[]>([]);
  const [inlineSearchIdx, setInlineSearchIdx] = useState(0);

  // Auto Create Product Master Dialog States
  const [showAutoCreateModal, setShowAutoCreateModal] = useState(false);
  const [autoCreateRowId, setAutoCreateRowId] = useState<string | null>(null);
  const [autoCreateData, setAutoCreateData] = useState({
    name: '',
    sellingPrice: '',
    purchasePrice: '',
    gstPercent: 18,
    hsnCode: '8536',
    unit: 'Nos',
    category: 'Electricals',
    brand: 'Generic',
    openingStock: '0',
    minStock: '5',
    barcode: ''
  });

  // Search product states
  const [productSearch, setProductSearch] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);
  const [productSuggestionsOpen, setProductSuggestionsOpen] = useState(false);
  const productSuggestionsRef = useRef<HTMLDivElement | null>(null);

  // Payments states
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque' | 'credit' | 'split'>('cash');
  const [cashPaid, setCashPaid] = useState('');
  const [upiPaid, setUpiPaid] = useState('');
  const [cardPaid, setCardPaid] = useState('');
  const [bankPaid, setBankPaid] = useState('');
  const [chequePaid, setChequePaid] = useState('');
  const [creditPaid, setCreditPaid] = useState('');

  // Discount Engine states
  const [flatBillDiscountPercent, setFlatBillDiscountPercent] = useState('0');
  const [flatBillDiscountAmount, setFlatBillDiscountAmount] = useState('0');
  const [cashDiscount, setCashDiscount] = useState('0');
  const [schemeDiscount, setSchemeDiscount] = useState('0');

  // Additional Charges state
  const [additionalCharges, setAdditionalCharges] = useState({
    packing: '0',
    loading: '0',
    transport: '0',
    freight: '0',
    handling: '0',
    other: '0'
  });

  // Notes state
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Round Off overrides
  const [isManualRoundOff, setIsManualRoundOff] = useState(false);
  const [manualRoundOffValue, setManualRoundOffValue] = useState('0');

  // Edit Lock / Unlock states (Section 21)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isBillingLocked, setIsBillingLocked] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Void/Cancel states (Section 19)
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidBillId, setVoidBillId] = useState<string | null>(null);

  // Crash / Power failure recovery (Section 16)
  const [interruptedSession, setInterruptedSession] = useState<any | null>(null);

  // Draft List Modal
  const [showDraftsModal, setShowDraftsModal] = useState(false);

  // Popup messages
  const [notifications, setNotifications] = useState<{ id: string; type: 'success' | 'error' | 'warn'; text: string }[]>([]);

  // Modal preview
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showUpdateMasterDialog, setShowUpdateMasterDialog] = useState(false);
  const [pendingBillSave, setPendingBillSave] = useState<any>(null);
  const [editedMasterProducts, setEditedMasterProducts] = useState<{id: string, rate: number}[]>([]);
  const [invoiceToPreview, setInvoiceToPreview] = useState<Bill | null>(null);

  // Document Type selection state
  const [docType, setDocType] = useState<Bill['docType']>('invoice');

  // Custom metadata states
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState('');

  // Hold / Resume lists & modals
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [holdReasonInput, setHoldReasonInput] = useState('');
  const [showHoldInputPopover, setShowHoldInputPopover] = useState(false);
  const [holdSearchQuery, setHoldSearchQuery] = useState('');
  const [holdSortOrder, setHoldSortOrder] = useState<'time_desc' | 'time_asc' | 'amount_desc' | 'amount_asc'>('time_desc');

  // References for keyboard capture
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const customerSearchInputRef = useRef<HTMLInputElement>(null);

  // Quick Customer add fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustGst, setNewCustGst] = useState('');
  const [newCustType, setNewCustType] = useState<'retail' | 'wholesale' | 'contractor'>('retail');

  const loadBillIntoState = (targetBill: Bill) => {
    // 1. Load customer
    const cust = customers.find(c => c.id === targetBill.customerId);
    if (cust) {
      setSelectedCustomer(cust);
      setCustomerSearch(cust.name);
      setCustMobile(cust.mobile || '');
      setCustGst(cust.gstNumber || '');
      setCustAddress(cust.address || '');
    } else {
      setSelectedCustomer(null);
      setCustomerSearch(targetBill.customerName || '');
      setCustMobile(targetBill.customerMobile || '');
      setCustGst(targetBill.customerGst || '');
      setCustAddress((targetBill as any).customerAddress || '');
    }

    // 2. Load basic settings
    setGstEnabled(targetBill.gstEnabled !== false);
    setPaymentMode(targetBill.paymentMode || 'cash');
    setFlatBillDiscountPercent((targetBill.discountPercent ?? 0).toString());
    setFlatBillDiscountAmount((targetBill.discountAmount ?? 0).toString());
    setCashDiscount(((targetBill as any).cashDiscount ?? 0).toString());
    setSchemeDiscount(((targetBill as any).schemeDiscount ?? 0).toString());
    setDocType(targetBill.docType || 'invoice');
    if (setBillType && targetBill.billType) {
      setBillType(targetBill.billType);
    }
    
    // 3. Load metadata
    setVehicleNumber(targetBill.vehicleNumber || '');
    setDeliveryPerson(targetBill.deliveryPerson || '');
    setReceivedBy(targetBill.receivedBy || '');
    setReturnReason(targetBill.returnReason || '');
    setLinkedInvoiceNumber(targetBill.linkedInvoiceNumber || '');
    setCustomerNotes((targetBill as any).customerNotes || targetBill.notes || '');
    setInternalNotes((targetBill as any).internalNotes || '');
    setDeliveryNotes((targetBill as any).deliveryNotes || '');
    setInvoiceNotes((targetBill as any).invoiceNotes || '');

    if (targetBill.additionalCharges) {
      setAdditionalCharges({
        packing: (targetBill.additionalCharges.packing ?? '0').toString(),
        loading: (targetBill.additionalCharges.loading ?? '0').toString(),
        transport: (targetBill.additionalCharges.transport ?? '0').toString(),
        freight: (targetBill.additionalCharges.freight ?? '0').toString(),
        handling: (targetBill.additionalCharges.handling ?? '0').toString(),
        other: (targetBill.additionalCharges.other ?? '0').toString(),
      });
    } else {
      setAdditionalCharges({
        packing: '0',
        loading: '0',
        transport: '0',
        freight: '0',
        handling: '0',
        other: '0',
      });
    }

    // 4. Load payment details
    const cash = targetBill.splitPayments?.cash ?? (targetBill.paymentMode === 'cash' ? targetBill.paidAmount : 0);
    const upi = targetBill.splitPayments?.upi ?? (targetBill.paymentMode === 'upi' ? targetBill.paidAmount : 0);
    const card = targetBill.splitPayments?.card ?? (targetBill.paymentMode === 'card' ? targetBill.paidAmount : 0);
    const bank = targetBill.splitPayments?.bank ?? (targetBill.paymentMode === 'bank_transfer' ? targetBill.paidAmount : 0);
    const cheque = (targetBill as any).splitPayments?.cheque ?? (targetBill.paymentMode === 'cheque' ? targetBill.paidAmount : 0);
    const credit = (targetBill as any).splitPayments?.credit ?? (targetBill.paymentMode === 'credit' ? targetBill.balanceAmount : 0);

    setCashPaid(cash ? cash.toString() : '');
    setUpiPaid(upi ? upi.toString() : '');
    setCardPaid(card ? card.toString() : '');
    setBankPaid(bank ? bank.toString() : '');
    setChequePaid(cheque ? cheque.toString() : '');
    setCreditPaid(credit ? credit.toString() : '');

    // 5. Load items rows
    const restoredRows: RowState[] = targetBill.items.map((item, idx) => {
      const prod = products.find(p => p.id === item.productId || (p as any)._id === item.productId);
      return {
        id: `row_${idx}_${Math.random().toString(36).substring(2, 5)}`,
        productId: item.productId,
        productName: item.name || (prod ? prod.name : ''),
        hsnCode: item.hsnCode || (prod ? prod.hsnCode : '') || '',
        quantity: (item.quantity ?? 1).toString(),
        unit: item.unit || (prod ? prod.unit : '') || 'Nos',
        rate: (item.rate ?? 0).toString(),
        discountPercent: (item.discountPercent ?? 0).toString(),
        gstPercent: item.gstPercent !== undefined ? item.gstPercent : (prod ? prod.gstPercent : 18),
        total: item.total || 0,
        isRateEdited: item.isRateEdited || false,
        originalRate: item.originalRate || item.rate || (prod ? prod.sellingPrice : 0)
      };
    });

    while (restoredRows.length < 15) {
      restoredRows.push({
        id: `row_pad_${restoredRows.length}_${Math.random().toString(36).substring(2, 5)}`,
        productId: '',
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        rate: '',
        discountPercent: '0',
        gstPercent: 0,
        total: 0,
        isRateEdited: false,
        originalRate: 0
      });
    }

    setRows(restoredRows);
  };

  // Keep product suggestions open while interacting; close only on explicit outside click after short delay
  useEffect(() => {
    if (!productSuggestionsOpen) return;
    let closeTimer: any = null;
    const onDocMouseDown = (ev: MouseEvent) => {
      const target = ev.target as Node;
      const insidePanel = productSuggestionsRef.current && productSuggestionsRef.current.contains(target);
      const insideInput = productSearchInputRef.current && productSearchInputRef.current.contains(target as Node);
      if (insidePanel || insideInput) {
        // interacting within panel/input -> do nothing
        return;
      }
      // Start a short timer to allow accidental clicks to be corrected
      closeTimer = setTimeout(() => {
        setProductSuggestionsOpen(false);
        setProductSuggestions([]);
      }, 300);
    };
    const onFocusIn = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('focusin', onFocusIn);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [productSuggestionsOpen]);

  useEffect(() => {
    if (editingBillId) {
      const billToEdit = bills.find(b => b.id === editingBillId);
      if (billToEdit) {
        loadBillIntoState(billToEdit);
        pushNotify('success', `Loaded Invoice ${billToEdit.billNumber} for Editing`);
      }
    }
  }, [editingBillId, bills]);

  // Initialize: default to walk-in customer, restore interrupted session if any, and set up 15 empty rows
  useEffect(() => {
    if (editingBillId) {
      return;
    }
    // Select walk-in customer automatically
    const walkin = customers.find(c => c.id === 'c_walkin');
    if (walkin) {
      setSelectedCustomer(walkin);
    }

    // Check for power failure or crash recovery (Section 16)
    const interrupted = safeGetItem(`interrupted_pos_session_${businessDetails?.id || 'current'}`);
    if (interrupted) {
      try {
        const parsed = JSON.parse(interrupted);
        if (parsed && parsed.items && parsed.items.length > 0) {
          setInterruptedSession(parsed);
        }
      } catch (err) {}
    }

    // Set 15 empty rows
    const initialRows: RowState[] = Array.from({ length: 15 }, (_, idx) => ({
      id: `row_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      productId: '',
      productName: '',
      hsnCode: '',
      quantity: '',
      unit: '',
      rate: '',
      discountPercent: '0',
      gstPercent: 0,
      total: 0,
      isRateEdited: false,
      originalRate: 0
    }));
    setRows(initialRows);

    // If a draft is active, show a restore prompt instead of auto-restoring
    if (draftBill && draftBill.shopId === (currentBusiness?.id || draftBill.shopId)) {
      setShowDraftRestorePrompt(true);
    }
  }, [currentBillType, businessDetails]);

  // Restore Draft helper
  const restoreDraft = (draft: Bill) => {
    const cust = customers.find(c => c.id === draft.customerId);
    if (cust) setSelectedCustomer(cust);
    
    setGstEnabled(draft.gstEnabled);
    setPaymentMode(draft.paymentMode);
    setFlatBillDiscountPercent((draft.discountPercent ?? 0).toString());
    
    // Set split payments if any
    if (draft.splitPayments) {
      setCashPaid((draft.splitPayments.cash ?? 0).toString());
      setUpiPaid((draft.splitPayments.upi ?? 0).toString());
      setCardPaid((draft.splitPayments.card ?? 0).toString());
      setBankPaid((draft.splitPayments.bank ?? 0).toString());
      setChequePaid((draft.splitPayments as any).cheque?.toString() || '');
      setCreditPaid((draft.splitPayments as any).credit?.toString() || '');
    }

    // Construct table rows
    const restoredRows: RowState[] = draft.items.map((item, idx) => ({
      id: `row_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      productId: item.productId,
      productName: item.name,
      hsnCode: item.hsnCode,
      quantity: (item.quantity ?? 1).toString(),
      unit: item.unit,
      rate: (item.rate ?? 0).toString(),
      discountPercent: (item.discountPercent ?? 0).toString(),
      gstPercent: item.gstPercent,
      total: item.total,
      isRateEdited: item.isRateEdited || false,
      originalRate: item.originalRate || item.rate
    }));

    // Pad to at least 15 rows
    while (restoredRows.length < 15) {
      restoredRows.push({
        id: `row_pad_${restoredRows.length}_${Math.random().toString(36).substring(2, 5)}`,
        productId: '',
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        rate: '',
        discountPercent: '0',
        gstPercent: 0,
        total: 0,
        isRateEdited: false,
        originalRate: 0
      });
    }

    setRows(restoredRows);
    pushNotify('success', 'Active billing draft restored successfully');
  };

  // Keyboard Event Hotkeys (Section 14: F2, F3, F4, F5, F7, F8, F9, F10, Ctrl+S, Ctrl+P)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Check if inside input fields (except if we want to bypass)
      const activeEl = document.activeElement as HTMLElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');

      if (e.key === 'F2') {
        e.preventDefault();
        productSearchInputRef.current?.focus();
        pushNotify('success', 'Focussed product search input');
      } else if (e.key === 'F3' || e.key === 'F6') {
        e.preventDefault();
        customerSearchInputRef.current?.focus();
        pushNotify('success', 'Focussed customer search input');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setShowAddCustModal(true);
      } else if (e.key === 'F5') {
        e.preventDefault();
        // Save current state as quick draft
        handleSaveDraft();
      } else if (e.key === 'F7') {
        e.preventDefault();
        setShowHoldInputPopover(prev => !prev);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setShowResumeModal(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setPaymentMode(prev => prev === 'split' ? 'cash' : 'split');
        pushNotify('success', 'Toggled Split payment mode');
      } else if (e.key === 'F10' || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        handleSaveBill(false);
      } else if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        // If we have an active preview, trigger print; otherwise preview last invoice
        if (showInvoiceModal) {
          printA4Element();
        } else {
          const activeItems = rows.filter(r => r.productId !== '');
          if (activeItems.length > 0) {
            handleSaveBill(true);
          } else {
            pushNotify('warn', 'No items in the billing cart to print preview');
          }
        }
      } else if (e.key === 'Escape') {
        setShowInvoiceModal(false);
        setShowAddCustModal(false);
        setShowResumeModal(false);
        setShowDraftsModal(false);
        setShowUnlockModal(false);
        setShowVoidModal(false);
        setProductSuggestions([]);
        setShowCustSuggestions(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [rows, selectedCustomer, paymentMode, cashPaid, upiPaid, cardPaid, gstEnabled, flatBillDiscountPercent, showInvoiceModal]);

  // Continuous Autosave session to localStorage for Crash & Power Recovery (Section 16)
  useEffect(() => {
    const activeItems = rows.filter(r => r.productId !== '');
    if (activeItems.length > 0 && selectedCustomer) {
      const sum = calculateBillSummary();
      const currentSessionState = {
        customerId: selectedCustomer.id,
        gstEnabled,
        paymentMode,
        discountPercent: parseFloat(flatBillDiscountPercent) || 0,
        discountAmount: sum.discountAmount,
        flatBillDiscountAmount,
        cashDiscount,
        schemeDiscount,
        additionalCharges,
        customerNotes,
        internalNotes,
        deliveryNotes,
        invoiceNotes,
        isManualRoundOff,
        manualRoundOffValue,
        rows: activeItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discountPercent: item.discountPercent,
          gstPercent: item.gstPercent,
          total: item.total,
          isRateEdited: item.isRateEdited,
          originalRate: item.originalRate
        }))
      };
      safeSetItem(`interrupted_pos_session_${businessDetails?.id || 'current'}`, JSON.stringify(currentSessionState));
    } else {
      safeRemoveItem(`interrupted_pos_session_${businessDetails?.id || 'current'}`);
    }
  }, [rows, selectedCustomer, paymentMode, gstEnabled, flatBillDiscountPercent, flatBillDiscountAmount, cashDiscount, schemeDiscount, additionalCharges, customerNotes, internalNotes, deliveryNotes, invoiceNotes, isManualRoundOff, manualRoundOffValue, businessDetails]);

  // Synchronize selectedCustomer with any changes in the global customers list (e.g. when tempId gets updated to real MongoDB ID)
  useEffect(() => {
    if (selectedCustomer) {
      // Try to find the exact match by ID first
      const matchById = customers.find(c => c.id === selectedCustomer.id);
      if (matchById) {
        if (matchById !== selectedCustomer) {
          setSelectedCustomer(matchById);
        }
      } else {
        // If not found by ID (could be due to tempId -> real ID transition)
        // Find by name match
        const matchByName = customers.find(c => 
          c.name.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase()
        );
        if (matchByName) {
          setSelectedCustomer(matchByName);
        }
      }
    }
  }, [customers, selectedCustomer]);

  // Synchronize rows' productIds with any changes in the global products list (e.g. when tempId gets updated to real MongoDB ID)
  useEffect(() => {
    let changed = false;
    const updatedRows = rows.map(row => {
      if (row.productId && row.productId.startsWith('p_')) {
        // Find if this product now has a real database ID
        const matchedProd = products.find(p => 
          p.name.trim().toLowerCase() === row.productName.trim().toLowerCase()
        );
        if (matchedProd && matchedProd.id !== row.productId) {
          changed = true;
          return {
            ...row,
            productId: matchedProd.id
          };
        }
      }
      return row;
    });
    if (changed) {
      setRows(updatedRows);
    }
  }, [products, rows]);

  // Notifications logger
  const pushNotify = (type: 'success' | 'error' | 'warn', text: string) => {
    const id = Math.random().toString();
    setNotifications(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  // Restores an interrupted session state (Section 16)
  const handleRestoreInterruptedSession = () => {
    if (!interruptedSession) return;
    try {
      const cust = customers.find(c => c.id === interruptedSession.customerId);
      if (cust) setSelectedCustomer(cust);

      setGstEnabled(interruptedSession.gstEnabled ?? true);
      setPaymentMode(interruptedSession.paymentMode ?? 'cash');
      setFlatBillDiscountPercent(interruptedSession.discountPercent?.toString() || '0');
      setFlatBillDiscountAmount(interruptedSession.flatBillDiscountAmount?.toString() || '0');
      setCashDiscount(interruptedSession.cashDiscount?.toString() || '0');
      setSchemeDiscount(interruptedSession.schemeDiscount?.toString() || '0');
      if (interruptedSession.additionalCharges) setAdditionalCharges(interruptedSession.additionalCharges);
      setCustomerNotes(interruptedSession.customerNotes ?? '');
      setInternalNotes(interruptedSession.internalNotes ?? '');
      setDeliveryNotes(interruptedSession.deliveryNotes ?? '');
      setInvoiceNotes(interruptedSession.invoiceNotes ?? '');
      setIsManualRoundOff(interruptedSession.isManualRoundOff ?? false);
      setManualRoundOffValue(interruptedSession.manualRoundOffValue?.toString() || '0');

      const restoredRows: RowState[] = interruptedSession.rows.map((item: any, idx: number) => ({
        id: `row_rec_${idx}_${Math.random().toString(36).substring(2, 5)}`,
        productId: item.productId,
        productName: item.productName,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discountPercent: item.discountPercent,
        gstPercent: item.gstPercent,
        total: item.total,
        isRateEdited: item.isRateEdited || false,
        originalRate: item.originalRate || parseFloat(item.rate) || 0
      }));

      // Pad up to 15
      while (restoredRows.length < 15) {
        restoredRows.push({
          id: `row_pad_${restoredRows.length}_${Math.random().toString(36).substring(2, 5)}`,
          productId: '',
          productName: '',
          hsnCode: '',
          quantity: '',
          unit: '',
          rate: '',
          discountPercent: '0',
          gstPercent: 0,
          total: 0,
          isRateEdited: false,
          originalRate: 0
        });
      }

      setRows(restoredRows);
      setInterruptedSession(null);
      safeRemoveItem(`interrupted_pos_session_${businessDetails?.id || 'current'}`);
      pushNotify('success', 'POS crash recovery: Interrupted billing session restored!');
    } catch (err) {
      pushNotify('error', 'Failed to parse recovery session');
    }
  };

  // Discard recovery session
  const handleDiscardInterruptedSession = () => {
    setInterruptedSession(null);
    safeRemoveItem(`interrupted_pos_session_${businessDetails?.id || 'current'}`);
    pushNotify('warn', 'Recovery session discarded.');
  };

  // Save current screen as solid Draft (Section 17)
  const handleSaveDraft = () => {
    const activeItems = rows.filter(r => r.productId !== '');
    if (activeItems.length === 0) {
      pushNotify('warn', 'No items in cart. Cannot save empty draft.');
      return;
    }
    const sum = calculateBillSummary();
    const draft: Bill = {
      id: `draft_${Date.now()}`,
      shopId: businessDetails?.id || 'current',
      billNumber: `DFT-${Math.floor(1000 + Math.random() * 9000)}`,
      billType: currentBillType || 'normal',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      customerId: selectedCustomer?.id || 'c_walkin',
      customerName: selectedCustomer?.name || 'Walk-In Customer',
      customerMobile: selectedCustomer?.mobile || '9999999999',
      items: activeItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.productName,
        hsnCode: item.hsnCode,
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit,
        rate: parseFloat(item.rate) || 0,
        discountPercent: parseFloat(item.discountPercent) || 0,
        discountAmount: 0,
        gstPercent: item.gstPercent,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: item.total,
        isRateEdited: item.isRateEdited,
        originalRate: item.originalRate
      })),
      gstEnabled,
      subtotal: sum.subtotal,
      discountPercent: parseFloat(flatBillDiscountPercent) || 0,
      discountAmount: sum.discountAmount,
      taxableAmount: sum.taxableAmount,
      cgst: sum.cgst,
      sgst: sum.sgst,
      igst: 0,
      roundOff: sum.roundOff,
      grandTotal: sum.grandTotal,
      paidAmount: 0,
      balanceAmount: sum.grandTotal,
      paymentMode,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    saveDraft(draft);
    pushNotify('success', `POS Session Draft "${draft.billNumber}" saved securely! (F8 to resume)`);
  };

  // Autosave active billing draft (debounced)
  useEffect(() => {
    // Debounce writes to local persistent draft
    if (draftAutoSaveTimer.current) {
      window.clearTimeout(draftAutoSaveTimer.current as number);
      draftAutoSaveTimer.current = null;
    }

    draftAutoSaveTimer.current = window.setTimeout(() => {
      try {
        const activeItems = rows.filter(r => r.productId && r.productId !== '');
        if (activeItems.length === 0) return;
        const sum = calculateBillSummary();
        const draft: Bill = {
          id: (draftBill && draftBill.id) || `draft_autosave_${Date.now()}`,
          shopId: businessDetails?.id || 'current',
          billNumber: (draftBill && draftBill.billNumber) || `DFT-${Math.floor(1000 + Math.random() * 9000)}`,
          billType: currentBillType || 'normal',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString(),
          customerId: selectedCustomer?.id || 'c_walkin',
          customerName: selectedCustomer?.name || customerSearch || 'Walk-In Customer',
          customerMobile: selectedCustomer?.mobile || custMobile || '',
          items: activeItems.map(item => ({
            id: item.id,
            productId: item.productId,
            name: item.productName,
            hsnCode: item.hsnCode,
            quantity: parseFloat(item.quantity) || 1,
            unit: item.unit,
            rate: parseFloat(item.rate) || 0,
            discountPercent: parseFloat(item.discountPercent) || 0,
            gstPercent: item.gstPercent,
            total: item.total
          })),
          gstEnabled,
          subtotal: sum.subtotal,
          discountPercent: parseFloat(flatBillDiscountPercent) || 0,
          discountAmount: sum.discountAmount,
          taxableAmount: sum.taxableAmount,
          cgst: sum.cgst,
          sgst: sum.sgst,
          igst: 0,
          roundOff: sum.roundOff,
          grandTotal: sum.grandTotal,
          paidAmount: 0,
          balanceAmount: sum.grandTotal,
          paymentMode,
          status: 'draft',
          createdAt: new Date().toISOString()
        };
        saveDraft(draft);
      } catch (e) {
        // ignore autosave failures
      }
    }, 800);

    return () => {
      if (draftAutoSaveTimer.current) {
        window.clearTimeout(draftAutoSaveTimer.current as number);
        draftAutoSaveTimer.current = null;
      }
    };
  }, [rows, selectedCustomer, customerSearch, custMobile, gstEnabled, paymentMode, flatBillDiscountPercent, additionalCharges, customerNotes, internalNotes, deliveryNotes, invoiceNotes]);

  // Advanced Product Suggestion search with ranking (Section 1 & Section 2)
  const handleProductSearchChange = (val: string) => {
    setProductSearch(val);
    setProductSuggestionsOpen(true);
    if (!val.trim()) {
      setProductSuggestions([]);
      setProductSuggestionsOpen(false);
      return;
    }

    const term = val.toLowerCase().trim();

    // Fast physical barcode scanner match check
    const perfectBarcodeMatch = products.find(p => p.isActive && ((p.barcode && p.barcode === val.trim()) || (p.sku && p.sku.toLowerCase() === term)));
    if (perfectBarcodeMatch) {
      addProductRow(perfectBarcodeMatch);
      setProductSearch('');
      setProductSuggestions([]);
      pushNotify('success', `Barcode Scanned: ${perfectBarcodeMatch.name}`);
      return;
    }

    // Dynamic ranking (Exact match > Starts with > Contains) for ultra-fast typing catalog (Section 1)
    const activeProducts = products.filter(p => p.isActive);
    const scoredSuggestions = activeProducts.map(p => {
      const nameL = (p.name || '').toLowerCase();
      const codeL = (p.productCode || '').toLowerCase();
      const skuL = (p.sku || '').toLowerCase();
      const barcodeL = (p.barcode || '').toLowerCase();
      const hsnL = (p.hsnCode || '').toLowerCase();
      const brandL = (p.brand || '').toLowerCase();
      const catL = (p.category || '').toLowerCase();

      let score = 0;

      // 1. Exact Match (High Score)
      if (nameL === term) score += 1000;
      else if (skuL === term) score += 950;
      else if (codeL === term) score += 900;
      else if (barcodeL === term) score += 850;
      // 2. Starts With Match (Medium Score)
      else if (nameL.startsWith(term)) score += 500;
      else if (skuL.startsWith(term)) score += 450;
      else if (codeL.startsWith(term)) score += 400;
      else if (barcodeL.startsWith(term)) score += 350;
      // 3. Contains Match (Lower Score)
      else if (nameL.includes(term)) score += 200;
      else if (skuL.includes(term)) score += 180;
      else if (codeL.includes(term)) score += 150;
      else if (hsnL.includes(term)) score += 120;
      else if (brandL.includes(term)) score += 100;
      else if (catL.includes(term)) score += 80;

      return { product: p, score };
    }).filter(item => item.score > 0);

    // Sort by rank descending, then alphabetically by name
    scoredSuggestions.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

    // Slice to top 15 results for performance
    const finalSuggestions = scoredSuggestions.map(item => item.product).slice(0, 15);
    setProductSuggestions(finalSuggestions);
    setSelectedSuggestionIdx(0);
  };

  const handleProductSearchKeys = (e: React.KeyboardEvent) => {
    // Exact barcode scanned check on physical "Enter" (Section 2)
    if (e.key === 'Enter' && productSearch.trim()) {
      const barcodeClean = productSearch.trim();
      const match = products.find(p => p.isActive && (p.barcode === barcodeClean || (p.sku && p.sku.toLowerCase() === barcodeClean.toLowerCase()) || (p.productCode && p.productCode.toLowerCase() === barcodeClean.toLowerCase())));
      if (match) {
        e.preventDefault();
        addProductRow(match);
        setProductSearch('');
        setProductSuggestions([]);
        pushNotify('success', `Scanned item added: ${match.name}`);
        return;
      }
    }

    if (productSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIdx(prev => (prev + 1) % productSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIdx(prev => (prev - 1 + productSuggestions.length) % productSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If there's exactly one suggestion and it exactly matches the typed query, auto-select it
      if (productSuggestions.length === 1) {
        const only = productSuggestions[0];
        if ((only.name || '').trim().toLowerCase() === productSearch.trim().toLowerCase()) {
          addProductRow(only);
          setProductSuggestionsOpen(false);
          setProductSuggestions([]);
          return;
        }
      }
      const selected = productSuggestions[selectedSuggestionIdx];
      if (selected) {
        addProductRow(selected);
        setProductSuggestionsOpen(false);
        setProductSuggestions([]);
      }
    } else if (e.key === 'Escape') {
      setProductSuggestionsOpen(false);
      setProductSuggestions([]);
    }
  };

  // Business Requirement 3: Inline Row Product Search & Autocomplete
  const handleInlineSearchChange = (rowId: string, val: string) => {
    setInlineSearchRowId(rowId);
    setInlineSearchQuery(val);
    
    if (!val.trim()) {
      setInlineSearchSuggestions([]);
      return;
    }

    const term = val.toLowerCase().trim();

    // Direct Barcode Scan Match
    const perfectBarcodeMatch = products.find(p => p.isActive && ((p.barcode && p.barcode === val.trim()) || (p.sku && p.sku.toLowerCase() === term)));
    if (perfectBarcodeMatch) {
      selectProductForInlineRow(rowId, perfectBarcodeMatch);
      setInlineSearchRowId(null);
      setInlineSearchQuery('');
      setInlineSearchSuggestions([]);
      pushNotify('success', `Barcode Scanned: ${perfectBarcodeMatch.name}`);
      return;
    }

    const activeProducts = products.filter(p => p.isActive);
    const scoredSuggestions = activeProducts.map(p => {
      const nameL = (p.name || '').toLowerCase();
      const codeL = (p.productCode || '').toLowerCase();
      const skuL = (p.sku || '').toLowerCase();
      const barcodeL = (p.barcode || '').toLowerCase();
      const hsnL = (p.hsnCode || '').toLowerCase();
      const brandL = (p.brand || '').toLowerCase();
      const catL = (p.category || '').toLowerCase();

      let score = 0;

      // 1. Exact Match (High Score)
      if (nameL === term) score += 1000;
      else if (skuL === term) score += 950;
      else if (codeL === term) score += 900;
      else if (barcodeL === term) score += 850;
      // 2. Starts With Match (Medium Score)
      else if (nameL.startsWith(term)) score += 500;
      else if (skuL.startsWith(term)) score += 450;
      else if (codeL.startsWith(term)) score += 400;
      else if (barcodeL.startsWith(term)) score += 350;
      // 3. Contains Match (Lower Score)
      else if (nameL.includes(term)) score += 200;
      else if (skuL.includes(term)) score += 180;
      else if (codeL.includes(term)) score += 150;
      else if (hsnL.includes(term)) score += 120;
      else if (brandL.includes(term)) score += 100;
      else if (catL.includes(term)) score += 80;

      return { product: p, score };
    }).filter(item => item.score > 0);

    scoredSuggestions.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

    const finalSuggestions = scoredSuggestions.map(item => item.product).slice(0, 15);
    setInlineSearchSuggestions(finalSuggestions);
    setInlineSearchIdx(0);
  };

  const selectProductForInlineRow = async (rowId: string, prod: Product) => {
    // Robust rate mapping: Fallback to other price in case selected is falsy or 0, preventing Rate from defaulting to 0
    let defaultRate = prod.sellingPrice || 0;
    
    if (prod.stock <= 0) {
      pushNotify('error', `Error: ${prod.name} is OUT OF STOCK.`);
    } else if (prod.stock <= prod.reorderLevel) {
      pushNotify('warn', `Low Stock Warning: Only ${prod.stock} ${prod.unit} left!`);
    }

    setRows(prevRows => prevRows.map(row => {
      if (row.id === rowId) {
        const qty = parseFloat(row.quantity) || 1;
        return {
          ...row,
          productId: prod.id,
          productName: prod.name,
          hsnCode: prod.hsnCode,
          unit: prod.unit,
          rate: defaultRate.toString(),
          quantity: row.quantity || '1', // Ensure quantity gets filled with 1 if it was empty
          gstPercent: prod.gstPercent,
          total: recalculateRowTotal(qty, defaultRate, parseFloat(row.discountPercent) || 0, prod.gstPercent),
          isRateEdited: false,
          originalRate: defaultRate
        };
      }
      return row;
    }));

    // Focus quantity input for this row
    setTimeout(() => {
      try {
        const qtyEl = document.querySelector(`input[data-qty-row="${rowId}"]`) as HTMLInputElement | null;
        if (qtyEl) {
          qtyEl.focus();
          qtyEl.select();
        }
      } catch (err) {}
    }, 60);

    
  };

  const createProductDirectlyFromBilling = (name: string, rowId: string) => {
    if (!name.trim()) return;
    const cleanName = name.trim();
    
    // Check if duplicate
    const existing = products.find(p => p.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      selectProductForInlineRow(rowId, existing);
      setInlineSearchRowId(null);
      setInlineSearchQuery('');
      setInlineSearchSuggestions([]);
      return;
    }

    setAutoCreateRowId(rowId);
    setAutoCreateData({
      name: cleanName,
      sellingPrice: '',
      purchasePrice: '',
      gstPercent: 18,
      hsnCode: '8536',
      unit: 'Nos',
      category: 'Electricals',
      brand: 'Generic',
      openingStock: '0',
      minStock: '5',
      barcode: ''
    });
    setShowAutoCreateModal(true);
  };

  const startGlobalQuickCreate = (name: string) => {
    if (!name.trim()) return;
    const tempRowId = `row_active_${Math.random().toString(36).substring(2, 5)}`;
    
    // Append a temporary blank row
    const newBlankRow: RowState = {
      id: tempRowId,
      productId: '',
      productName: '',
      hsnCode: '',
      quantity: '1',
      unit: 'Nos',
      rate: '0',
      discountPercent: '0',
      gstPercent: 18,
      total: 0,
      isRateEdited: false,
      originalRate: 0
    };
    
    setRows(prev => [...prev, newBlankRow]);
    createProductDirectlyFromBilling(name, tempRowId);
    setProductSearch('');
    setProductSuggestions([]);
  };

  const handleSaveAutoCreatedProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!autoCreateData.name.trim() || !autoCreateRowId) return;

    const cleanName = autoCreateData.name.trim();
    const rateVal = parseFloat(autoCreateData.sellingPrice) || 0;
    const purchaseVal = parseFloat(autoCreateData.purchasePrice) || Math.round(rateVal * 0.75);
    const uniqueCode = 'PRD-' + Date.now().toString().slice(-6);
    const openStockVal = parseFloat(autoCreateData.openingStock) || 0;
    const minStockVal = parseFloat(autoCreateData.minStock) || 5;

    const newProductPayload = {
      name: cleanName,
      productCode: uniqueCode,
      barcode: autoCreateData.barcode || '',
      sku: '',
      hsnCode: autoCreateData.hsnCode || '8536',
      category: autoCreateData.category || 'Electricals',
      brand: autoCreateData.brand || 'Generic',
      unit: autoCreateData.unit || 'Nos',
      purchasePrice: purchaseVal,
      sellingPrice: rateVal,
      mrp: Math.round(rateVal * 1.25),
      gstPercent: autoCreateData.gstPercent,
      stock: openStockVal,
      minStock: minStockVal,
      maxStock: 500,
      reorderLevel: minStockVal,
      description: 'Automatically created from POS Billing inline search',
      isActive: true,
      openingStock: openStockVal
    };

    try {
      const createdProd = addProduct(newProductPayload);
      pushNotify('success', `Successfully created product "${cleanName}" in Product Master with Selling Price ₹${rateVal}!`);
      
      // Update row state with the new product details
      setRows(prevRows => prevRows.map(row => {
        if (row.id === autoCreateRowId) {
          return {
            ...row,
            productId: createdProd.id,
            productName: createdProd.name,
            hsnCode: createdProd.hsnCode,
            unit: createdProd.unit,
            rate: createdProd.sellingPrice.toString(),
            gstPercent: createdProd.gstPercent,
            quantity: '1',
            total: recalculateRowTotal(1, createdProd.sellingPrice, parseFloat(row.discountPercent) || 0, createdProd.gstPercent),
            isRateEdited: false,
            originalRate: createdProd.sellingPrice,
            openingStock: openStockVal
          };
        }
        return row;
      }));

      setShowAutoCreateModal(false);
      setAutoCreateRowId(null);
      setInlineSearchRowId(null);
      setInlineSearchQuery('');
      setInlineSearchSuggestions([]);
    } catch (err: any) {
      pushNotify('error', `Failed to create product: ${err.message}`);
    }
  };

  const handleInlineSearchKeys = (e: React.KeyboardEvent, rowId: string) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (inlineSearchSuggestions.length > 0) {
        setInlineSearchIdx(prev => (prev + 1) % inlineSearchSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inlineSearchSuggestions.length > 0) {
        setInlineSearchIdx(prev => (prev - 1 + inlineSearchSuggestions.length) % inlineSearchSuggestions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (inlineSearchSuggestions.length > 0) {
        const selected = inlineSearchSuggestions[inlineSearchIdx];
        if (selected) {
          selectProductForInlineRow(rowId, selected);
          setInlineSearchRowId(null);
          setInlineSearchQuery('');
          setInlineSearchSuggestions([]);
        }
        return;
      }
      // If exactly one suggestion and it matches exactly, select it
      if (inlineSearchSuggestions.length === 1) {
        const only = inlineSearchSuggestions[0];
        if ((only.name || '').trim().toLowerCase() === inlineSearchQuery.trim().toLowerCase()) {
          selectProductForInlineRow(rowId, only);
          setInlineSearchRowId(null);
          setInlineSearchQuery('');
          setInlineSearchSuggestions([]);
          return;
        }
      } else if (inlineSearchQuery.trim()) {
        // Business Requirement 2: Create product directly from billing if not found
        createProductDirectlyFromBilling(inlineSearchQuery, rowId);
      }
    } else if (e.key === 'Escape') {
      setInlineSearchRowId(null);
      setInlineSearchSuggestions([]);
    }
  };

  // Add Product to rows and focus its Quantity field
  const addProductRow = async (prod: Product) => {
    // Check if item already exists in rows to merge
    const existingIdx = rows.findIndex(r => r.productId === prod.id);
    if (existingIdx !== -1) {
      // Merge quantity
      const target = rows[existingIdx];
      const prevQty = parseFloat(target.quantity) || 0;
      const nextQty = prevQty + 1;
      
      if (nextQty > prod.stock) {
        pushNotify('warn', `Warning: Entered quantity (${nextQty}) exceeds available stock (${prod.stock}) for ${prod.name}`);
      }

      const updatedRows = [...rows];
      updatedRows[existingIdx] = {
        ...target,
        quantity: nextQty.toString(),
        total: recalculateRowTotal(nextQty, parseFloat(target.rate), parseFloat(target.discountPercent), target.gstPercent)
      };
      setRows(updatedRows);
      pushNotify('success', `Appended unit to ${prod.name}`);

      // Focus quantity input for merged row
      setTimeout(() => {
        try {
          const mergedRowId = updatedRows[existingIdx].id;
          const qtyEl = document.querySelector(`input[data-qty-row="${mergedRowId}"]`) as HTMLInputElement | null;
          if (qtyEl) {
            qtyEl.focus();
            qtyEl.select();
          }
        } catch (err) {}
      }, 50);

      return;
    }

    // Insert into the first empty row, or create a new one
    const firstEmptyIdx = rows.findIndex(r => r.productId === '');
    // Robust rate mapping: Fallback to other price in case selected is falsy or 0, preventing Rate from defaulting to 0
    let defaultRate = prod.sellingPrice || 0;
    
    // Warn if out of stock
    if (prod.stock <= 0) {
      pushNotify('error', `Error: ${prod.name} is OUT OF STOCK.`);
    } else if (prod.stock <= prod.reorderLevel) {
      pushNotify('warn', `Low Stock Warning: Only ${prod.stock} ${prod.unit} left!`);
    }

    const newRowId = `row_active_${Math.random().toString(36).substring(2, 5)}`;
    const newRowData: RowState = {
      id: newRowId,
      productId: prod.id,
      productName: prod.name,
      hsnCode: prod.hsnCode,
      quantity: '1',
      unit: prod.unit,
      rate: defaultRate.toString(),
      discountPercent: '0',
      gstPercent: prod.gstPercent,
      total: recalculateRowTotal(1, defaultRate, 0, prod.gstPercent),
      isRateEdited: false,
      originalRate: defaultRate
    };

    if (firstEmptyIdx !== -1) {
      const updated = [...rows];
      updated[firstEmptyIdx] = newRowData;
      setRows(updated);
      // Focus newly added row quantity after DOM update
      setTimeout(() => {
        try {
          const qtyEl = document.querySelector(`input[data-qty-row="${newRowId}"]`) as HTMLInputElement | null;
          if (qtyEl) {
            qtyEl.focus();
            qtyEl.select();
          }
        } catch (err) {}
      }, 80);
    } else {
      setRows(prev => [...prev, newRowData]);
      setTimeout(() => {
        try {
          const qtyEl = document.querySelector(`input[data-qty-row="${newRowId}"]`) as HTMLInputElement | null;
          if (qtyEl) {
            qtyEl.focus();
            qtyEl.select();
          }
        } catch (err) {}
      }, 80);
    }

    
  };

  // Row changes handler with detailed validations (Section 5, Section 6, Section 7)
  const handleRowChange = (id: string, field: 'quantity' | 'rate' | 'discountPercent', value: string) => {
    const updated = rows.map(row => {
      if (row.id === id) {
        let qty = field === 'quantity' ? value : row.quantity;
        let rate = field === 'rate' ? value : row.rate;
        let disc = field === 'discountPercent' ? value : row.discountPercent;

        // Clean input strings to validate numbers
        let numQty = parseFloat(qty) || 0;
        let numRate = parseFloat(rate) || 0;
        let numDisc = parseFloat(disc) || 0;

        // 1. Quantity Validation (Section 5)
        if (field === 'quantity') {
          if (numQty < 0) {
            pushNotify('error', 'Quantity cannot be negative');
            qty = '0';
            numQty = 0;
          } else if (numQty > 10000) {
            pushNotify('warn', 'Extremely high quantity. Capped at 10,000 units.');
            qty = '10000';
            numQty = 10000;
          }

          // Decimal constraints for discrete units (Section 5)
          const isDiscrete = ['pcs', 'nos', 'box', 'set', 'coil', 'pack', 'unit', 'numbers'].includes((row.unit || '').toLowerCase());
          if (isDiscrete && !Number.isInteger(numQty)) {
            pushNotify('error', `Decimals not allowed for discrete unit: ${row.unit}`);
            qty = Math.floor(numQty).toString();
            numQty = Math.floor(numQty);
          }

          // Stock level warning check
          const prod = products.find(p => p.id === row.productId);
          if (prod && numQty > prod.stock) {
            pushNotify('warn', `Requested quantity (${numQty}) exceeds available stock (${prod.stock}) for ${prod.name}`);
          }
        }

        // 2. Price / Rate Validation (Section 6)
        if (field === 'rate') {
          if (numRate < 0) {
            pushNotify('error', 'Rate price cannot be negative');
            rate = '0';
            numRate = 0;
          }

          // Under-pricing safety limit warning (Minimum Selling Price)
          const safetyLimit = row.originalRate * 0.5; // Warning under 50% discount
          if (numRate > 0 && numRate < safetyLimit) {
            pushNotify('warn', `Selling price is under safety limit of ₹ ${(safetyLimit || 0).toFixed(2)} (50% of catalog rate)`);
          }
        }

        // 3. Discount Validation
        if (field === 'discountPercent') {
          if (numDisc < 0) {
            pushNotify('error', 'Discount cannot be negative');
            disc = '0';
            numDisc = 0;
          } else if (numDisc > 100) {
            pushNotify('error', 'Discount cannot exceed 100%');
            disc = '100';
            numDisc = 100;
          }
        }

        const isEdited = field === 'rate' ? (parseFloat(rate) !== row.originalRate) : row.isRateEdited;

        return {
          ...row,
          quantity: qty,
          rate: rate,
          discountPercent: disc,
          isRateEdited: isEdited,
          total: recalculateRowTotal(numQty, numRate, numDisc, row.gstPercent)
        };
      }
      return row;
    });

    // Automatically append a new empty row if the last active row is modified (Section 4)
    const activeRows = updated.filter(r => r.productId !== '');
    if (activeRows.length === updated.length && updated.length < 500) {
      updated.push({
        id: `row_pad_${updated.length}_${Math.random().toString(36).substring(2, 5)}`,
        productId: '',
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        rate: '',
        discountPercent: '0',
        gstPercent: 0,
        total: 0,
        isRateEdited: false,
        originalRate: 0
      });
    }

    setRows(updated);
  };

  // Row Management Spreadsheet operations (Section 4)
  const appendRow = () => {
    const newId = `row_appended_${Math.random().toString(36).substring(2, 8)}`;
    const newRow = {
      id: newId,
      productId: '',
      productName: '',
      hsnCode: '',
      quantity: '',
      unit: '',
      rate: '',
      discountPercent: '0',
      gstPercent: 0,
      total: 0,
      isRateEdited: false,
      originalRate: 0
    } as RowState;
    setRows(prev => [...prev, newRow]);

    // Focus the newly added product input
    setTimeout(() => {
      try {
        const prodInput = document.querySelector(`input[data-row-id="${newId}"]`) as HTMLInputElement | null;
        if (prodInput) {
          prodInput.focus();
          prodInput.select();
          setInlineSearchRowId(newId);
          setInlineSearchQuery('');
        }
      } catch (err) {}
    }, 80);
  };

  const insertRowAt = (idx: number) => {
    const newRow: RowState = {
      id: `row_inserted_${Math.random().toString(36).substring(2, 5)}`,
      productId: '',
      productName: '',
      hsnCode: '',
      quantity: '',
      unit: '',
      rate: '',
      discountPercent: '0',
      gstPercent: 0,
      total: 0,
      isRateEdited: false,
      originalRate: 0
    };
    const updated = [...rows];
    updated.splice(idx, 0, newRow);
    setRows(updated);
    pushNotify('success', `Inserted row at position ${idx + 1}`);
  };

  const duplicateRowAt = (idx: number) => {
    const target = rows[idx];
    if (!target.productId) {
      pushNotify('warn', 'Cannot duplicate empty product row');
      return;
    }
    const dupRow: RowState = {
      ...target,
      id: `row_dup_${Math.random().toString(36).substring(2, 5)}`
    };
    const updated = [...rows];
    updated.splice(idx + 1, 0, dupRow);
    setRows(updated);
    pushNotify('success', `Duplicated row item to line ${idx + 2}`);
  };

  const moveRowUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...rows];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setRows(updated);
  };

  const moveRowDown = (idx: number) => {
    if (idx === rows.length - 1) return;
    const updated = [...rows];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setRows(updated);
  };

  const clearRowAt = (idx: number) => {
    const updated = [...rows];
    updated[idx] = {
      id: `row_cleared_${Math.random().toString(36).substring(2, 5)}`,
      productId: '',
      productName: '',
      hsnCode: '',
      quantity: '',
      unit: '',
      rate: '',
      discountPercent: '0',
      gstPercent: 0,
      total: 0,
      isRateEdited: false,
      originalRate: 0
    };
    setRows(updated);
    pushNotify('success', `Cleared item slot at line ${idx + 1}`);
  };

  const removeRow = (id: string) => {
    let filtered = rows.filter(r => r.id !== id);
    // Ensure we maintain minimum 15 grid spacing
    while (filtered.length < 15) {
      filtered.push({
        id: `row_pad_${filtered.length}_${Math.random().toString(36).substring(2, 5)}`,
        productId: '',
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        rate: '',
        discountPercent: '0',
        gstPercent: 0,
        total: 0,
        isRateEdited: false,
        originalRate: 0
      });
    }
    setRows(filtered);
    pushNotify('success', 'Item row removed');
  };

  const clearBill = () => {
    if (window.confirm('Are you sure you want to clear the current POS session?')) {
      const empty: RowState[] = Array.from({ length: 15 }, (_, idx) => ({
        id: `row_${idx}_${Math.random().toString(36).substring(2, 5)}`,
        productId: '',
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        rate: '',
        discountPercent: '0',
        gstPercent: 0,
        total: 0,
        isRateEdited: false,
        originalRate: 0
      }));
      setRows(empty);
      setFlatBillDiscountPercent('0');
      setFlatBillDiscountAmount('0');
      setCashDiscount('0');
      setSchemeDiscount('0');
      setAdditionalCharges({
        packing: '0',
        loading: '0',
        transport: '0',
        freight: '0',
        handling: '0',
        other: '0'
      });
      setCustomerNotes('');
      setInternalNotes('');
      setDeliveryNotes('');
      setInvoiceNotes('');
      setIsManualRoundOff(false);
      setManualRoundOffValue('0');
      setCashPaid('');
      setUpiPaid('');
      setCardPaid('');
      setBankPaid('');
      setChequePaid('');
      setCreditPaid('');
      // Clear persistent draft when user explicitly clears the bill
      try { saveDraft(null); } catch (e) {}
      setVehicleNumber('');
      setDeliveryPerson('');
      setReceivedBy('');
      setReturnReason('');
      setLinkedInvoiceNumber('');
      pushNotify('success', 'POS Billing terminal reset completed successfully');
    }
  };

  // HOLD / RESUME DRAFTS (Section 14B)
  const handleHoldBill = async (reason: string) => {
    const activeItems = rows.filter(r => r.productId !== '');
    if (activeItems.length === 0) {
      pushNotify('error', 'Add some products first to place the bill on hold');
      return;
    }

    const resolvedCustomer = ensureCustomerIsResolved();

    const sum = calculateBillSummary();
    const billItems: BillItem[] = activeItems.map(item => {
      const q = parseFloat(item.quantity) || 1;
      const r = parseFloat(item.rate) || 0;
      const dPercent = parseFloat(item.discountPercent) || 0;
      const dAmt = (q * r) * (dPercent / 100);
      const postDisc = (q * r) - dAmt;
      const rowGst = parseFloat(item.gstPercent as any) || 0;
      
      let rowTaxable = 0;
      let taxVal = 0;

      if (currentBillType === 'contractor') {
        rowTaxable = postDisc;
        taxVal = gstEnabled ? postDisc * (rowGst / 100) : 0;
      } else {
        if (gstEnabled) {
          rowTaxable = postDisc / (1 + rowGst / 100);
          taxVal = postDisc - rowTaxable;
        } else {
          rowTaxable = postDisc;
          taxVal = 0;
        }
      }

      return {
        id: item.id,
        productId: item.productId,
        name: item.productName,
        hsnCode: item.hsnCode,
        quantity: q,
        unit: item.unit,
        rate: r,
        discountPercent: dPercent,
        discountAmount: dAmt,
        gstPercent: rowGst,
        taxableValue: rowTaxable,
        cgst: taxVal / 2,
        sgst: taxVal / 2,
        igst: 0,
        total: item.total,
        isRateEdited: item.isRateEdited,
        originalRate: item.originalRate
      };
    });

    const originalBill = editingBillId 
      ? bills.find(b => b.id === editingBillId) 
      : (resumedHoldBillId ? bills.find(b => b.id === resumedHoldBillId) : null);

    const billPayload = {
      billType: currentBillType || 'normal',
      date: originalBill ? originalBill.date : new Date().toISOString().split('T')[0],
      time: originalBill ? originalBill.time : new Date().toLocaleTimeString(),
      customerId: resolvedCustomer ? resolvedCustomer.id : 'c_walkin',
      customerName: resolvedCustomer ? resolvedCustomer.name : 'Walk-in Customer',
      customerMobile: resolvedCustomer ? resolvedCustomer.mobile : '9999999999',
      customerGst: resolvedCustomer?.gstNumber,
      customerAddress: resolvedCustomer ? resolvedCustomer.address : custAddress || undefined,
      items: billItems,
      gstEnabled,
      subtotal: sum.subtotal,
      discountPercent: parseFloat(flatBillDiscountPercent) || 0,
      discountAmount: sum.discountAmount,
      taxableAmount: sum.taxableAmount,
      cgst: sum.cgst,
      sgst: sum.sgst,
      igst: 0,
      roundOff: sum.roundOff,
      grandTotal: sum.grandTotal,
      paidAmount: 0,
      balanceAmount: sum.grandTotal,
      paymentMode: 'credit' as const,
      status: 'on_hold' as const,
      docType,
      isHold: true,
      holdReason: reason || 'Suspended POS Draft',
      vehicleNumber: ['challan'].includes(docType) ? vehicleNumber : undefined,
      deliveryPerson: ['challan'].includes(docType) ? deliveryPerson : undefined,
      receivedBy: ['challan'].includes(docType) ? receivedBy : undefined,
      returnReason: ['sales_return', 'credit_note', 'debit_note'].includes(docType) ? returnReason : undefined,
      linkedInvoiceNumber: ['sales_return', 'credit_note', 'debit_note'].includes(docType) ? linkedInvoiceNumber : undefined,
      customerNotes: customerNotes.trim() || undefined,
      internalNotes: internalNotes.trim() || undefined,
      deliveryNotes: deliveryNotes.trim() || undefined,
      invoiceNotes: invoiceNotes.trim() || undefined,
      cashDiscount: parseFloat(cashDiscount) || 0,
      schemeDiscount: parseFloat(schemeDiscount) || 0,
      additionalCharges: {
        packing: parseFloat(additionalCharges.packing) || 0,
        loading: parseFloat(additionalCharges.loading) || 0,
        transport: parseFloat(additionalCharges.transport) || 0,
        freight: parseFloat(additionalCharges.freight) || 0,
        handling: parseFloat(additionalCharges.handling) || 0,
        other: parseFloat(additionalCharges.other) || 0,
      }
    };

    try {
      if (editingBillId) {
        await updateBill(editingBillId, {
          ...billPayload,
          id: editingBillId,
          billNumber: originalBill?.billNumber,
          status: 'on_hold' as const,
          isHold: true,
          holdReason: reason || 'Suspended POS Draft'
        });
        setEditingBillId(null);
        pushNotify('success', `Bill updated on hold under: ${reason || 'Suspended POS Draft'}`);
      } else if (resumedHoldBillId) {
        await updateBill(resumedHoldBillId, {
          ...billPayload,
          id: resumedHoldBillId,
          billNumber: originalBill?.billNumber,
          status: 'on_hold' as const,
          isHold: true,
          holdReason: reason || 'Suspended POS Draft'
        });
        setResumedHoldBillId(null);
        pushNotify('success', `Hold Bill updated and kept on hold under: ${reason || 'Suspended POS Draft'}`);
      } else {
        createBill(billPayload);
        pushNotify('success', `Bill saved as ON HOLD under: ${reason || 'Suspended POS Draft'}`);
      }
      
      // Reset POS grid
      const emptyGrid: RowState[] = Array.from({ length: 15 }, (_, idx) => ({
        id: `row_${idx}_${Math.random().toString(36).substring(2, 5)}`,
        productId: '',
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        rate: '',
        discountPercent: '0',
        gstPercent: 0,
        total: 0,
        isRateEdited: false,
        originalRate: 0
      }));
      setRows(emptyGrid);
      setFlatBillDiscountPercent('0');
      setFlatBillDiscountAmount('0');
      setCashDiscount('0');
      setSchemeDiscount('0');
      setAdditionalCharges({
        packing: '0',
        loading: '0',
        transport: '0',
        freight: '0',
        handling: '0',
        other: '0'
      });
      setCustomerNotes('');
      setInternalNotes('');
      setDeliveryNotes('');
      setInvoiceNotes('');
      setCashPaid('');
      setUpiPaid('');
      setCardPaid('');
      setBankPaid('');
      setChequePaid('');
      setCreditPaid('');
      setVehicleNumber('');
      setDeliveryPerson('');
      setReceivedBy('');
      setReturnReason('');
      setLinkedInvoiceNumber('');
      setHoldReasonInput('');
      setShowHoldInputPopover(false);
    } catch (err: any) {
      pushNotify('error', `Failed to suspend bill: ${err.message}`);
    }
  };

  const handleResumeBill = (holdBill: Bill) => {
    const cust = customers.find(c => c.id === holdBill.customerId);
    if (cust) setSelectedCustomer(cust);
    
    setGstEnabled(holdBill.gstEnabled);
    setPaymentMode(holdBill.paymentMode);
    setFlatBillDiscountPercent((holdBill.discountPercent ?? 0).toString());
    setDocType(holdBill.docType || 'invoice');
    setVehicleNumber(holdBill.vehicleNumber || '');
    setDeliveryPerson(holdBill.deliveryPerson || '');
    setReceivedBy(holdBill.receivedBy || '');
    setReturnReason(holdBill.returnReason || '');
    setLinkedInvoiceNumber(holdBill.linkedInvoiceNumber || '');

    const restoredRows: RowState[] = holdBill.items.map((item, idx) => ({
      id: `row_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      productId: item.productId,
      productName: item.name,
      hsnCode: item.hsnCode,
      quantity: (item.quantity ?? 1).toString(),
      unit: item.unit,
      rate: (item.rate ?? 0).toString(),
      discountPercent: (item.discountPercent ?? 0).toString(),
      gstPercent: item.gstPercent,
      total: item.total,
      isRateEdited: item.isRateEdited || false,
      originalRate: item.originalRate || item.rate
    }));

    while (restoredRows.length < 15) {
      restoredRows.push({
        id: `row_pad_${restoredRows.length}_${Math.random().toString(36).substring(2, 5)}`,
        productId: '',
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        rate: '',
        discountPercent: '0',
        gstPercent: 0,
        total: 0,
        isRateEdited: false,
        originalRate: 0
      });
    }

    setRows(restoredRows);
    setResumedHoldBillId(holdBill.id);
    setShowResumeModal(false);
    pushNotify('success', `Loaded POS suspension draft ${holdBill.billNumber}. Saving/printing will convert it to a final bill.`);
  };

  const handleCancelEdit = () => {
    setEditingBillId(null);
    setResumedHoldBillId(null);
    
    // Reset grid
    const emptyGrid: RowState[] = Array.from({ length: 15 }, (_, idx) => ({
      id: `row_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      productId: '',
      productName: '',
      hsnCode: '',
      quantity: '',
      unit: '',
      rate: '',
      discountPercent: '0',
      gstPercent: 0,
      total: 0,
      isRateEdited: false,
      originalRate: 0
    }));
    setRows(emptyGrid);
    setFlatBillDiscountPercent('0');
    setFlatBillDiscountAmount('0');
    setCashDiscount('0');
    setSchemeDiscount('0');
    setAdditionalCharges({
      packing: '0',
      loading: '0',
      transport: '0',
      freight: '0',
      handling: '0',
      other: '0'
    });
    setCustomerNotes('');
    setInternalNotes('');
    setDeliveryNotes('');
    setInvoiceNotes('');
    setCashPaid('');
    setUpiPaid('');
    setCardPaid('');
    setBankPaid('');
    setChequePaid('');
    setCreditPaid('');
    setVehicleNumber('');
    setDeliveryPerson('');
    setReceivedBy('');
    setReturnReason('');
    setLinkedInvoiceNumber('');
    
    // Select walk-in customer automatically
    const walkin = customers.find(c => c.id === 'c_walkin');
    if (walkin) {
      setSelectedCustomer(walkin);
      setCustomerSearch(walkin.name);
    }
    
    pushNotify('warn', 'Edit/Resume session discarded');
  };

  // Recompute single row total based on inclusive/exclusive pricing models
  const recalculateRowTotal = (qty: number, rate: number, disc: number, gst: number): number => {
    const q = isNaN(qty) || qty < 0 ? 0 : qty;
    const r = isNaN(rate) || rate < 0 ? 0 : rate;
    const d = isNaN(disc) || disc < 0 ? 0 : disc;
    const g = isNaN(gst) || gst < 0 ? 0 : gst;

    if (q <= 0 || r <= 0) return 0;
    
    const grossVal = q * r;
    const itemDisc = grossVal * (d / 100);
    const postDisc = grossVal - itemDisc;

    if (currentBillType === 'contractor') {
      // Contractor (Exclusive GST): Total = item cost + GST
      const tax = gstEnabled ? postDisc * (g / 100) : 0;
      return postDisc + tax;
    } else {
      // Normal (Inclusive GST): Total is simply post-discount cost
      return postDisc;
    }
  };

  // Customer suggestions (Section 3)
  const [showDraftRestorePrompt, setShowDraftRestorePrompt] = useState(false);
  const draftAutoSaveTimer = useRef<number | null>(null);
  const handleCustomerSearchChange = (val: string) => {
    setCustomerSearch(val);
    if (!val.trim()) {
      setShowCustSuggestions(false);
      return;
    }
    setShowCustSuggestions(true);
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerSearch(cust.name);
    setShowCustSuggestions(false);
    setCustMobile(cust.mobile || '');
    setCustGst(cust.gstNumber || '');
    setCustAddress(cust.address || '');
    setCustEmail(cust.email || '');
    pushNotify('success', `Selected Customer: ${cust.name}`);
  };

  const ensureCustomerIsResolved = (): Customer => {
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
    const editedRows = activeItems.filter(r => r.isRateEdited && r.productId && r.productId.startsWith('p_') === false);
    
    if (editedRows.length > 0 && !pendingBillSave) {
      const updates = editedRows.map(r => ({ id: r.productId, rate: parseFloat(r.rate) || 0 }));
      setEditedMasterProducts(updates);
      setPendingBillSave(triggerPrint);
      setShowUpdateMasterDialog(true);
      return;
    }

    try {
      // 1. Double check locking mechanism (Section 15)
      if (isBillingLocked) {
        pushNotify('error', 'POS Terminal is LOCKED. Unlock first (Ctrl+L) to make transactions.');
        return;
      }

      const activeItems = rows.filter(r => r.productId !== '');
      const sum = calculateBillSummary();
      
      if (activeItems.length === 0) {
        pushNotify('error', 'Validation Fail: Add at least one active product item to save bill');
        return;
      }

      const resolvedCustomer = ensureCustomerIsResolved();

      // 2. Perform Stock Validation
      for (const item of activeItems) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const itemQty = parseFloat(item.quantity) || 0;
          if (itemQty <= 0) {
            pushNotify('error', `Validation Fail: Quantity for ${item.productName} must be greater than 0`);
            return;
          }
          if (itemQty > prod.stock) {
            pushNotify('warn', `Stock limit bypassed: ${item.productName} has only ${prod.stock} left in inventory`);
          }
        }
      }

      // 3. Prepare bill payload items
      const billItems: BillItem[] = activeItems.map(item => {
        const q = parseFloat(item.quantity) || 1;
        const r = parseFloat(item.rate) || 0;
        const dPercent = parseFloat(item.discountPercent) || 0;
        const dAmt = (q * r) * (dPercent / 100);
        const postDisc = (q * r) - dAmt;
        const rowGst = parseFloat(item.gstPercent as any) || 0;

        let rowTaxable = 0;
        let taxVal = 0;

        if (currentBillType === 'contractor') {
          rowTaxable = postDisc;
          taxVal = gstEnabled ? postDisc * (rowGst / 100) : 0;
        } else {
          if (gstEnabled) {
            rowTaxable = postDisc / (1 + rowGst / 100);
            taxVal = postDisc - rowTaxable;
          } else {
            rowTaxable = postDisc;
            taxVal = 0;
          }
        }

        return {
          id: item.id,
          productId: item.productId,
          name: item.productName,
          hsnCode: item.hsnCode,
          quantity: q,
          unit: item.unit,
          rate: r,
          discountPercent: dPercent,
          discountAmount: dAmt,
          gstPercent: rowGst,
          taxableValue: rowTaxable,
          cgst: taxVal / 2,
          sgst: taxVal / 2,
          igst: 0,
          total: item.total,
          isRateEdited: item.isRateEdited,
          originalRate: item.originalRate,
          openingStock: item.openingStock,
          category: item.category,
          brand: item.brand,
          sku: item.sku,
          barcode: item.barcode,
          productCode: item.productCode
        };
      });

      // 4. Compute split and mode balances (Section 10, Section 11)
      let paidAmt = 0;
      let splitPay = undefined;

      if (paymentMode === 'split') {
        const cash = parseFloat(cashPaid) || 0;
        const upi = parseFloat(upiPaid) || 0;
        const card = parseFloat(cardPaid) || 0;
        const bank = parseFloat(bankPaid) || 0;
        const cheque = parseFloat(chequePaid) || 0;
        const credit = parseFloat(creditPaid) || 0;
        paidAmt = cash + upi + card + bank + cheque;
        splitPay = { cash, upi, card, bank, cheque, credit };
      } else if (paymentMode === 'credit') {
        paidAmt = 0;
      } else {
        paidAmt = sum.grandTotal; // auto paid
      }

      const unpaidBalance = Math.max(0, sum.grandTotal - paidAmt);

      // 5. Customer Credit Limit Verification (Section 13)
      if (paymentMode === 'credit' || unpaidBalance > 0 || (paymentMode === 'split' && (parseFloat(creditPaid) || 0) > 0)) {
        const extraCreditAmount = paymentMode === 'split' ? (parseFloat(creditPaid) || 0) : unpaidBalance;
        if (!resolvedCustomer || resolvedCustomer.id === 'c_walkin') {
          pushNotify('error', 'Credit accounts are strictly forbidden for Walk-In customers. Choose Cash/UPI or select a registered client.');
          return;
        }
        
        const limit = resolvedCustomer.creditLimit ?? 0;
        const currentCreditExposure = limit - 10000; // Simulated historic balance, let's keep a buffer
        if (extraCreditAmount > limit) {
          pushNotify('error', `Credit limit exceeded! Customer limit is ₹ ${(limit ?? 0).toFixed(2)}, attempting to load ₹ ${(extraCreditAmount ?? 0).toFixed(2)} on credit.`);
          return;
        } else if (extraCreditAmount > limit * 0.8) {
          pushNotify('warn', `High Credit Warning: Remaining buffer is below 20% of limit for ${resolvedCustomer.name}`);
        }
      }

      const originalBill = editingBillId 
        ? bills.find(b => b.id === editingBillId) 
        : (resumedHoldBillId ? bills.find(b => b.id === resumedHoldBillId) : null);

      const billPayload = {
        billType: currentBillType || 'normal',
        date: originalBill ? originalBill.date : new Date().toISOString().split('T')[0],
        time: originalBill ? originalBill.time : new Date().toLocaleTimeString(),
        customerId: resolvedCustomer.id,
        customerName: resolvedCustomer.name,
        customerOrganizationName: resolvedCustomer.organizationName,
        customerMobile: resolvedCustomer.mobile,
        customerGst: resolvedCustomer.gstNumber,
        customerAddress: resolvedCustomer ? resolvedCustomer.address : custAddress || undefined,
        items: billItems,
        gstEnabled,
        subtotal: sum.subtotal,
        discountPercent: parseFloat(flatBillDiscountPercent) || 0,
        discountAmount: sum.discountAmount,
        taxableAmount: sum.taxableAmount,
        cgst: sum.cgst,
        sgst: sum.sgst,
        igst: 0,
        roundOff: sum.roundOff,
        grandTotal: sum.grandTotal,
        paidAmount: paidAmt,
        balanceAmount: unpaidBalance,
        paymentMode,
        splitPayments: splitPay,
        status: (paymentMode === 'credit' || unpaidBalance > 0) ? 'credit' as const : 'paid' as const,
        docType,
        vehicleNumber: ['challan'].includes(docType) ? vehicleNumber : undefined,
        deliveryPerson: ['challan'].includes(docType) ? deliveryPerson : undefined,
        receivedBy: ['challan'].includes(docType) ? receivedBy : undefined,
        returnReason: ['sales_return', 'credit_note', 'debit_note'].includes(docType) ? returnReason : undefined,
        linkedInvoiceNumber: ['sales_return', 'credit_note', 'debit_note'].includes(docType) ? linkedInvoiceNumber : undefined,
        customerNotes: customerNotes.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        invoiceNotes: invoiceNotes.trim() || undefined,
        cashDiscount: parseFloat(cashDiscount) || 0,
        schemeDiscount: parseFloat(schemeDiscount) || 0,
        additionalCharges: {
          packing: parseFloat(additionalCharges.packing) || 0,
          loading: parseFloat(additionalCharges.loading) || 0,
          transport: parseFloat(additionalCharges.transport) || 0,
          freight: parseFloat(additionalCharges.freight) || 0,
          handling: parseFloat(additionalCharges.handling) || 0,
          other: parseFloat(additionalCharges.other) || 0,
        }
      };

      let savedInvoice: Bill;
      if (editingBillId) {
        savedInvoice = await updateBill(editingBillId, {
          ...billPayload,
          id: editingBillId,
          billNumber: originalBill?.billNumber,
          status: (paymentMode === 'credit' || unpaidBalance > 0) ? 'credit' as const : 'paid' as const
        });
        setEditingBillId(null);
        pushNotify('success', `Bill ${savedInvoice.billNumber} Updated Successfully!`);
      } else if (resumedHoldBillId) {
        savedInvoice = await updateBill(resumedHoldBillId, {
          ...billPayload,
          id: resumedHoldBillId,
          billNumber: originalBill?.billNumber,
          isHold: false,
          status: (paymentMode === 'credit' || unpaidBalance > 0) ? 'credit' as const : 'paid' as const
        });
        setResumedHoldBillId(null);
        pushNotify('success', `Hold Bill converted to Final Bill ${savedInvoice.billNumber} Successfully!`);
      } else {
        savedInvoice = createBill(billPayload);
        pushNotify('success', `Bill ${savedInvoice.billNumber} Saved/Created Successfully!`);
      }
      
      // 6. Reset POS grid and states to original pristine state
      const emptyGrid: RowState[] = Array.from({ length: 15 }, (_, idx) => ({
        id: `row_${idx}_${Math.random().toString(36).substring(2, 5)}`,
        productId: '',
        productName: '',
        hsnCode: '',
        quantity: '',
        unit: '',
        rate: '',
        discountPercent: '0',
        gstPercent: 0,
        total: 0,
        isRateEdited: false,
        originalRate: 0
      }));
      setRows(emptyGrid);
      setFlatBillDiscountPercent('0');
      setFlatBillDiscountAmount('0');
      setCashDiscount('0');
      setSchemeDiscount('0');
      setAdditionalCharges({
        packing: '0',
        loading: '0',
        transport: '0',
        freight: '0',
        handling: '0',
        other: '0'
      });
      setCustomerNotes('');
      setInternalNotes('');
      setDeliveryNotes('');
      setInvoiceNotes('');
      setIsManualRoundOff(false);
      setManualRoundOffValue('0');
      setCashPaid('');
      setUpiPaid('');
      setCardPaid('');
      setBankPaid('');
      setChequePaid('');
      setCreditPaid('');
      setVehicleNumber('');
      setDeliveryPerson('');
      setReceivedBy('');
      setReturnReason('');
      setLinkedInvoiceNumber('');

      // Clear any saved draft after successful save
      try { saveDraft(null); } catch (e) {}

      // Auto-preview modal if trigger print clicked
      if (triggerPrint) {
        setInvoiceToPreview(savedInvoice);
        setShowInvoiceModal(true);
      }
    } catch (err: any) {
      console.error("handleSaveBill error:", err);
      pushNotify('error', `Save failed: ${err.message}`);
    }
  };

  // Filter products list for custom display drop-downs
  const searchProductsFiltered = productSuggestions.filter(p => !rows.some(r => r.productId === p.id));

  // Customer filter lists
  const filteredCustomers = React.useMemo(() => {
    const searchLower = customerSearch.toLowerCase();
    return customers.filter(c => 
      (c.name || '').toLowerCase().includes(searchLower) ||
      (c.mobile || '').includes(searchLower) ||
      (c.city || '').toLowerCase().includes(searchLower) ||
      (c.address || '').toLowerCase().includes(searchLower)
    );
  }, [customers, customerSearch]);

  // Calculate bill summary totals used across the component.
  function calculateBillSummary() {
    const active = rows.filter(r => r.productId && r.productId !== '');
    const totalItems = active.length;

    let subtotalGross = 0; // sum of qty * rate
    let postDiscSum = 0; // sum after item-level discounts (but before bill-level discounts)
    let taxableBefore = 0; // taxable portion before bill-level discounts
    let cgst = 0;
    let sgst = 0;

    for (const row of active) {
      const q = parseFloat(row.quantity as any) || 0;
      const r = parseFloat(row.rate as any) || 0;
      const d = parseFloat(row.discountPercent as any) || 0;
      const g = parseFloat(row.gstPercent as any) || 0;

      const gross = q * r;
      const rowDisc = gross * (d / 100);
      const postDisc = Math.max(0, gross - rowDisc);

      subtotalGross += gross;
      postDiscSum += postDisc;

      if (currentBillType === 'contractor') {
        const tax = gstEnabled ? postDisc * (g / 100) : 0;
        taxableBefore += postDisc;
        cgst += tax / 2;
        sgst += tax / 2;
      } else {
        if (gstEnabled) {
          const rowTaxable = postDisc / (1 + g / 100);
          const tax = postDisc - rowTaxable;
          taxableBefore += rowTaxable;
          cgst += tax / 2;
          sgst += tax / 2;
        } else {
          taxableBefore += postDisc;
        }
      }
    }

    // Bill level discounts and adjustments
    const flatAmt = parseFloat(flatBillDiscountAmount as any) || 0;
    const flatPct = parseFloat(flatBillDiscountPercent as any) || 0;
    const flatFromPct = flatAmt > 0 ? flatAmt : (subtotalGross * (flatPct / 100));
    const cashDiscAmt = parseFloat(cashDiscount as any) || 0;
    const schemeDiscAmt = parseFloat(schemeDiscount as any) || 0;

    const billLevelDiscount = flatFromPct + cashDiscAmt + schemeDiscAmt;
    const totalDiscountAmount = (subtotalGross - postDiscSum) + billLevelDiscount; // item-level discounts + bill-level

    // Apply bill-level discounts proportionally to postDiscSum to adjust taxable and taxes
    let taxableAfter = taxableBefore;
    let adjustedCgst = cgst;
    let adjustedSgst = sgst;
    if (postDiscSum > 0) {
      const postDiscAfter = Math.max(0, postDiscSum - billLevelDiscount);
      const ratio = postDiscAfter / postDiscSum;
      taxableAfter = taxableBefore * ratio;
      adjustedCgst = cgst * ratio;
      adjustedSgst = sgst * ratio;
    }

    const additionalChargesSum = (parseFloat(additionalCharges.packing as any) || 0)
      + (parseFloat(additionalCharges.loading as any) || 0)
      + (parseFloat(additionalCharges.transport as any) || 0)
      + (parseFloat(additionalCharges.freight as any) || 0)
      + (parseFloat(additionalCharges.handling as any) || 0)
      + (parseFloat(additionalCharges.other as any) || 0);

    // Compute grand total based on pricing model
    let grand = 0;
    if (currentBillType === 'contractor') {
      // contractor pricing: post-disc excludes tax, so add taxes
      const postDiscAfter = Math.max(0, postDiscSum - billLevelDiscount);
      grand = postDiscAfter + adjustedCgst + adjustedSgst + additionalChargesSum;
    } else {
      // normal pricing: postDiscSum already includes tax when gstEnabled
      const postDiscAfter = Math.max(0, postDiscSum - billLevelDiscount);
      grand = postDiscAfter + additionalChargesSum;
    }

    // Round off handling
    let roundOff = 0;
    if (isManualRoundOff) {
      roundOff = parseFloat(manualRoundOffValue as any) || 0;
    } else {
      const rounded = Math.round(grand);
      roundOff = +(rounded - grand).toFixed(2);
    }

    const grandTotal = +(grand + roundOff).toFixed(2);

    return {
      totalItems,
      subtotal: +postDiscSum.toFixed(2),
      subtotalGross: +subtotalGross.toFixed(2),
      discountAmount: +totalDiscountAmount.toFixed(2),
      taxableAmount: +taxableAfter.toFixed(2),
      cgst: +adjustedCgst.toFixed(2),
      sgst: +adjustedSgst.toFixed(2),
      roundOff: +roundOff.toFixed(2),
      grandTotal
    };
  }

  const sum = calculateBillSummary();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-screen font-sans overflow-hidden select-none">
      
      {/* Toast Notifications Panel */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map((n) => (
          <div key={n.id} className={`p-4 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-3 animate-slide-in ${
            n.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 
            n.type === 'error' ? 'bg-red-50 text-red-800 border-red-150' : 'bg-amber-50 text-amber-800 border-amber-150'
          }`}>
            {n.type === 'success' && <Check className="h-4.5 w-4.5 stroke-[2.5px] text-emerald-600" />}
            {n.type === 'error' && <Trash2 className="h-4.5 w-4.5 text-red-600" />}
            {n.type === 'warn' && <AlertTriangle className="h-4.5 w-4.5 text-amber-600 animate-bounce" />}
            <span>{n.text}</span>
          </div>
        ))}
      </div>

      {/* Active Session Status Banner (Editing or Resumed Draft) */}
      {(editingBillId || resumedHoldBillId) && (
        <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-white text-amber-600 uppercase font-mono animate-pulse">
              {editingBillId ? 'EDIT MODE' : 'RESUMED DRAFT'}
            </span>
            <span className="text-xs font-semibold">
              {editingBillId 
                ? `You are currently editing Invoice ID: ${bills.find(b => b.id === editingBillId)?.billNumber || editingBillId}. Saving will overwrite this record, updating stock and ledger outstandings.` 
                : `You are currently converting Held Draft: ${bills.find(b => b.id === resumedHoldBillId)?.billNumber || resumedHoldBillId} to a final invoice.`
              }
            </span>
          </div>
          <button 
            onClick={handleCancelEdit}
            className="px-3 py-1 bg-white hover:bg-neutral-100 text-amber-700 hover:text-amber-800 rounded-lg text-xs font-extrabold cursor-pointer transition-colors duration-150 flex items-center gap-1 shadow-sm"
          >
            <X className="h-3 w-3" />
            <span>Discard Changes / Exit</span>
          </button>
        </div>
      )}

      {/* 1. Top POS Panel Details */}
      <div className="bg-white border-b border-gray-150 p-4 shrink-0 flex flex-col md:flex-row justify-between gap-4">
        {/* Left segment */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider leading-none">POS Terminal</div>
            <div className="text-sm font-extrabold text-gray-800 mt-1">{nextBillNumber}</div>
          </div>

          <div className="h-8 border-r border-gray-100 hidden sm:block"></div>

          {/* Document Type Select dropdown */}
          <div>
            <label className="text-[10px] text-gray-400 font-bold block">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="mt-1 text-xs font-bold text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black bg-white cursor-pointer shadow-xs"
            >
              <option value="invoice">GST Tax Invoice</option>
              <option value="non_gst">Non-GST Cash Bill</option>
              <option value="quotation">Quotation / Estimate</option>
              <option value="challan">Delivery Challan</option>
              <option value="proforma">Proforma Invoice</option>
              <option value="sales_return">Sales Return Slip</option>
              <option value="credit_note">Credit Note (CN)</option>
              <option value="debit_note">Debit Note (DN)</option>
            </select>
          </div>

          <div className="h-8 border-r border-gray-100 hidden sm:block"></div>

          {/* Hold & Resume Suspension Controls */}
          <div className="flex items-center gap-1.5 mt-4 sm:mt-0">
            {/* Hold trigger popover */}
            <div className="relative">
              <button
                onClick={() => setShowHoldInputPopover(!showHoldInputPopover)}
                className="px-3 py-1.5 border border-dashed border-gray-300 rounded-lg hover:border-black text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Place active items on hold"
              >
                <Minimize2 className="h-3.5 w-3.5 text-gray-500" />
                <span>Hold (Hold)</span>
              </button>

              {showHoldInputPopover && (
                <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-30 space-y-2 text-xs">
                  <span className="font-bold text-gray-800 block">Suspend Bill Draft</span>
                  <input
                    type="text"
                    placeholder="Reference name/reason..."
                    value={holdReasonInput}
                    onChange={(e) => setHoldReasonInput(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  />
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => setShowHoldInputPopover(false)}
                      className="px-2.5 py-1 border border-gray-200 hover:bg-gray-50 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleHoldBill(holdReasonInput)}
                      className="px-3 py-1 bg-black text-white hover:bg-neutral-800 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Hold POS
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Resume trigger list */}
            <button
              onClick={() => setShowResumeModal(true)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:border-black text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
              <span>Resume ({bills.filter(b => b.status === 'on_hold').length})</span>
            </button>
          </div>

          <div className="h-8 border-r border-gray-100 hidden sm:block"></div>

          {/* Customer Edit Fields */}
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

          {/* GST Toggle Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">GST Breakdown</span>
            <button
              onClick={() => setGstEnabled(!gstEnabled)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                gstEnabled ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-200 ${
                gstEnabled ? 'translate-x-4.5' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          <div className="h-8 border-r border-gray-100 hidden sm:block"></div>

          {/* Core Product Search Engine */}
          <div className="relative">
            <label className="text-[10px] text-gray-400 font-medium block">Search Product / Scan Barcode (F2)</label>
            <div className="relative mt-1">
              <input
                ref={productSearchInputRef}
                type="text"
                placeholder="Name, SKU, Barcode, HSN..."
                value={productSearch}
                onChange={(e) => handleProductSearchChange(e.target.value)}
                onKeyDown={handleProductSearchKeys}
                className="w-64 text-xs font-semibold border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-black bg-white"
              />
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2" />
            </div>

            {/* Product Suggestions Overlay */}
            {(productSuggestionsOpen && (productSuggestions.length > 0 || productSearch.trim() !== '')) && (
              <div ref={el => productSuggestionsRef.current = el} className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-40 max-h-72 overflow-y-auto">
                <div className="p-2 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Product Code</span>
                  <span className="text-[10px] text-gray-400 font-mono">Use Arrow Keys &amp; Enter</span>
                </div>
                {productSuggestions.map((prod, idx) => (
                  <button
                    key={prod.id}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      addProductRow(prod);
                      setProductSuggestionsOpen(false);
                      setProductSuggestions([]);
                    }}
                    className={`w-full text-left p-3 flex justify-between items-center border-b border-gray-50 ${
                      idx === selectedSuggestionIdx ? 'bg-neutral-50 border-l-2 border-black' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="truncate pr-3">
                      <div className="text-xs font-bold text-gray-800 truncate">
                        {prod.name} <span className={`text-[10px] font-bold ${prod.stock <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>(Stock: {prod.stock})</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        SKU: {prod.sku} &middot; HSN: {prod.hsnCode}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-gray-900">₹{prod.sellingPrice}</div>
                      <div className="text-[9px] font-bold text-emerald-600 font-mono">Stock: {prod.stock}</div>
                    </div>
                  </button>
                ))}
                {productSearch.trim() !== '' && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      startGlobalQuickCreate(productSearch);
                    }}
                    className="w-full text-left p-3 text-xs transition-colors bg-neutral-50 hover:bg-neutral-100 text-neutral-700 flex items-center gap-2 font-bold border-t border-gray-100 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      Not found? Quick Create <span className="text-black font-semibold">"{productSearch}"</span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 2. Spreadsheet POS Table */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* Dynamic Metadata Fields based on Document Type */}
        {['challan'].includes(docType) && (
          <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 grid grid-cols-3 gap-3 text-xs animate-fade-in">
            <div>
              <label className="text-[10px] text-blue-800 font-bold block uppercase tracking-wider">Vehicle Number</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. TN-37-BY-1234"
                className="w-full border border-blue-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 bg-white mt-1 uppercase text-blue-900 font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] text-blue-800 font-bold block uppercase tracking-wider">Delivery Person Name</label>
              <input
                type="text"
                value={deliveryPerson}
                onChange={(e) => setDeliveryPerson(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full border border-blue-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 bg-white mt-1 text-blue-900 font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] text-blue-800 font-bold block uppercase tracking-wider">Received By (Signature Line)</label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Recipient name / company"
                className="w-full border border-blue-200 rounded-lg p-2 focus:outline-none focus:border-blue-500 bg-white mt-1 text-blue-900 font-semibold"
              />
            </div>
          </div>
        )}

        {['sales_return', 'credit_note', 'debit_note'].includes(docType) && (
          <div className="bg-red-50 border border-red-150 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs animate-fade-in">
            <div>
              <label className="text-[10px] text-red-800 font-bold block uppercase tracking-wider">Original Linked Invoice Number</label>
              <input
                type="text"
                value={linkedInvoiceNumber}
                onChange={(e) => setLinkedInvoiceNumber(e.target.value)}
                placeholder="e.g. SE-001234"
                className="w-full border border-red-200 rounded-lg p-2 focus:outline-none focus:border-red-500 bg-white mt-1 uppercase text-red-900 font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] text-red-800 font-bold block uppercase tracking-wider">Return / Adjustment Explanation Reason</label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Defective items / quantity error / billing mistake..."
                className="w-full border border-red-200 rounded-lg p-2 focus:outline-none focus:border-red-500 bg-white mt-1 text-red-900 font-semibold"
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-w-[900px] h-full flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="w-10 p-3 text-center">#</th>
                  <th className="w-2/5 p-3">Item Details</th>
                  <th className="w-20 p-3 text-center">Quantity</th>
                  <th className="w-16 p-3">Unit</th>
                  <th className="w-28 p-3">Rate (₹)</th>
                  <th className="w-20 p-3 text-center">Disc (%)</th>
                  <th className="w-16 p-3 text-center">GST %</th>
                  <th className="w-28 p-3 text-right">Amount (₹)</th>
                  <th className="w-40 p-3 text-center">Row Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                {rows.map((row, idx) => {
                  const isActive = row.productId !== '';

                  return (
                    <tr key={row.id} className={`hover:bg-gray-50/50 ${isActive ? 'bg-white' : 'bg-gray-50/10'}`}>
                      {/* S No */}
                      <td className="p-2.5 text-center font-mono text-gray-400 text-[10px]">{idx + 1}</td>

                      {/* Name */}
                      <td className="p-2.5 relative min-w-[200px]">
                        <input
                          type="text"
                          placeholder="Search product..."
                          data-row-id={row.id}
                          value={inlineSearchRowId === row.id ? inlineSearchQuery : row.productName}
                          onChange={(e) => handleInlineSearchChange(row.id, e.target.value)}
                          onFocus={() => {
                            setInlineSearchRowId(row.id);
                            setInlineSearchQuery(row.productName || '');
                            if (row.productId) {
                              // Pre-populate suggestions for current query
                              handleInlineSearchChange(row.id, row.productName || '');
                            }
                          }}
                          onBlur={() => {
                            // Delay slightly to allow suggestion click
                            setTimeout(() => {
                              if (inlineSearchRowId === row.id) {
                                setInlineSearchRowId(null);
                                setInlineSearchSuggestions([]);
                              }
                            }, 200);
                          }}
                          onKeyDown={(e) => handleInlineSearchKeys(e, row.id)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white font-semibold text-gray-800"
                        />
                        {isActive && (
                          <div className="text-[9px] text-gray-400 font-mono mt-0.5 ml-1 flex items-center gap-2">
                            <span>HSN: {row.hsnCode}</span>
                            <span>&middot;</span>
                            <span className="text-emerald-600 font-bold">Bal Qty: {products.find(p => p.id === row.productId)?.stock ?? 0}</span>
                          </div>
                        )}
                        {inlineSearchRowId === row.id && (inlineSearchSuggestions.length > 0 || inlineSearchQuery.trim() !== '') && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-100 z-50">
                            {inlineSearchSuggestions.map((prod, pIdx) => (
                              <button
                                key={prod.id}
                                type="button"
                                onMouseDown={() => {
                                  selectProductForInlineRow(row.id, prod);
                                  setInlineSearchRowId(null);
                                  setInlineSearchQuery('');
                                  setInlineSearchSuggestions([]);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors flex justify-between items-center ${
                                  pIdx === inlineSearchIdx ? 'bg-neutral-100 text-black font-semibold' : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="truncate">
                                  <div className="font-bold">
                                    {prod.name} <span className={`text-[10px] font-bold ${prod.stock <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>(Stock: {prod.stock})</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-mono">Code: {prod.productCode} | HSN: {prod.hsnCode}</div>
                                </div>
                                <div className="text-right ml-2 shrink-0">
                                  <div className="font-semibold text-neutral-900">₹{(prod.sellingPrice ?? 0).toFixed(2)}</div>
                                  <div className={`text-[9px] font-mono ${prod.stock <= 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                    Stock: {prod.stock}
                                  </div>
                                </div>
                              </button>
                            ))}
                            {inlineSearchQuery.trim() !== '' && (
                              <button
                                type="button"
                                onMouseDown={() => {
                                  createProductDirectlyFromBilling(inlineSearchQuery, row.id);
                                }}
                                className="w-full text-left px-3 py-2 text-xs transition-colors bg-neutral-50 hover:bg-neutral-100 text-neutral-700 flex items-center gap-2 font-bold border-t border-gray-100 cursor-pointer"
                              >
                                <Plus className="h-4 w-4 text-emerald-600 shrink-0" />
                                <div className="truncate">
                                  Create brand-new product <span className="text-black font-semibold">"{inlineSearchQuery}"</span>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="p-2.5 text-center">
                          {isActive ? (
                          <input
                            data-qty-row={row.id}
                            type="number"
                            step="any"
                            min="0"
                            value={row.quantity}
                            onChange={(e) => handleRowChange(row.id, 'quantity', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                // Move focus to next row's product input
                                const nextIdx = Math.min(rows.length - 1, idx + 1);
                                const nextRowId = rows[nextIdx]?.id;
                                if (nextRowId) {
                                  const prodInput = document.querySelector(`input[data-row-id="${nextRowId}"]`) as HTMLInputElement | null;
                                  prodInput?.focus();
                                  prodInput?.select();
                                }
                              }
                            }}
                            className="w-16 border border-gray-200 rounded px-1.5 py-1 text-center font-mono focus:outline-none focus:border-black bg-white font-semibold"
                          />
                        ) : null}
                      </td>

                      {/* Unit */}
                      <td className="p-2.5 font-mono text-gray-500 text-[11px] font-bold">{isActive ? row.unit : ''}</td>

                      {/* Rate */}
                      <td className="p-2.5 relative">
                        {isActive ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={row.rate}
                              onChange={(e) => handleRowChange(row.id, 'rate', e.target.value)}
                              className="w-24 border border-gray-200 rounded px-1.5 py-1 font-mono focus:outline-none focus:border-black bg-white font-semibold"
                            />
                            {row.isRateEdited && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" title={`Original standard rate: ₹${row.originalRate}`} />
                            )}
                          </div>
                        ) : null}
                      </td>

                      {/* Item Discount */}
                      <td className="p-2.5 text-center">
                        {isActive ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.discountPercent}
                            onChange={(e) => handleRowChange(row.id, 'discountPercent', e.target.value)}
                            className="w-14 border border-gray-200 rounded px-1.5 py-1 text-center font-mono focus:outline-none focus:border-black bg-white font-semibold"
                          />
                        ) : null}
                      </td>

                      {/* GST */}
                      <td className="p-2.5 text-center font-mono text-gray-500 text-[11px] font-bold">
                        {isActive ? `${row.gstPercent ?? 0}%` : ''}
                      </td>

                      {/* Amount */}
                      <td className="p-2.5 text-right font-mono font-bold text-gray-800 pr-4">
                        {isActive ? `₹${(row.total ?? 0).toFixed(2)}` : ''}
                      </td>

                      {/* Actions (Insert, Duplicate, Move Up/Down, Clear, Delete) */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isActive ? (
                            <>
                              <button
                                onClick={() => duplicateRowAt(idx)}
                                className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors"
                                title="Duplicate Row Item"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => moveRowUp(idx)}
                                disabled={idx === 0}
                                className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                title="Move Row Up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => moveRowDown(idx)}
                                disabled={idx === rows.length - 1}
                                className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                                title="Move Row Down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => clearRowAt(idx)}
                                className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Clear Item Slot"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => removeRow(row.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Delete Row"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => insertRowAt(idx)}
                              className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="Insert Blank Row"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="sticky bottom-0 z-20 flex justify-center border-t border-gray-200 bg-white/95 p-2 backdrop-blur-sm">
              <button
                type="button"
                onClick={appendRow}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:border-black hover:bg-gray-50 hover:text-black"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Summary Workspace and Payment Control Drawer */}
      <div className="bg-white border-t border-gray-150 p-4 shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-md z-10 text-xs overflow-y-auto max-h-[35%]">
        
        {/* Left column: Payment options (Section 10, Section 11, Section 12) */}
        <div className="space-y-3.5">
          <div>
            <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Payment Modality</label>
            <div className="grid grid-cols-5 gap-1 mt-1.5">
              {(['cash', 'upi', 'card', 'split', 'credit'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-center border cursor-pointer transition-all ${
                    paymentMode === mode
                      ? 'bg-black text-white border-black shadow-xs font-extrabold'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Split Payment Panel with Cash, UPI, Card, Bank, Cheque, Credit */}
          {paymentMode === 'split' && (
            <div className="bg-neutral-50 p-3 rounded-xl border border-gray-200 space-y-2 animate-fade-in">
              <span className="font-extrabold text-gray-600 text-[9px] uppercase tracking-wider block">Split Currency Allocations</span>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                <div>
                  <label className="text-[9px] text-gray-400 block">Cash (₹)</label>
                  <input
                    type="number"
                    value={cashPaid}
                    onChange={(e) => setCashPaid(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded p-1 text-center focus:outline-none focus:border-black bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 block">UPI (₹)</label>
                  <input
                    type="number"
                    value={upiPaid}
                    onChange={(e) => setUpiPaid(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded p-1 text-center focus:outline-none focus:border-black bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 block">Card (₹)</label>
                  <input
                    type="number"
                    value={cardPaid}
                    onChange={(e) => setCardPaid(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded p-1 text-center focus:outline-none focus:border-black bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 block">Bank (₹)</label>
                  <input
                    type="number"
                    value={bankPaid}
                    onChange={(e) => setBankPaid(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded p-1 text-center focus:outline-none focus:border-black bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 block">Cheque (₹)</label>
                  <input
                    type="number"
                    value={chequePaid}
                    onChange={(e) => setChequePaid(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded p-1 text-center focus:outline-none focus:border-black bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 block">Credit (₹)</label>
                  <input
                    type="number"
                    value={creditPaid}
                    onChange={(e) => setCreditPaid(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded p-1 text-center focus:outline-none focus:border-black bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold font-mono pt-1 border-t border-dashed border-gray-200 text-gray-500">
                <span>Sum: ₹{((parseFloat(cashPaid)||0) + (parseFloat(upiPaid)||0) + (parseFloat(cardPaid)||0) + (parseFloat(bankPaid)||0) + (parseFloat(chequePaid)||0) + (parseFloat(creditPaid)||0)).toFixed(2)}</span>
                <span className="text-gray-400">Target: ₹{(sum.grandTotal ?? 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {paymentMode === 'credit' && (
            <div className="bg-amber-50 border border-amber-150 p-3 rounded-xl flex items-start gap-2 text-xs animate-fade-in">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-800 text-[10px] uppercase">Client Credit Ledger Account</span>
                <p className="text-[9px] text-amber-700 leading-relaxed mt-0.5">
                  The final total of ₹{(sum.grandTotal ?? 0).toFixed(2)} will be loaded to ledger. Walk-in accounts are blocked.
                </p>
              </div>
            </div>
          )}

          {/* Expanding notes section */}
          <div className="border border-gray-150 rounded-xl overflow-hidden text-[10px]">
            <div className="bg-gray-50 px-2.5 py-1.5 border-b border-gray-150 font-bold text-gray-500 uppercase tracking-wide flex justify-between items-center">
              <span>Invoice Notes &amp; Terms</span>
            </div>
            <div className="p-2 space-y-1 bg-white">
              <input
                type="text"
                placeholder="Customer Terms / Invoice Note..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full border-none p-1 focus:outline-none bg-gray-50 rounded"
              />
              <input
                type="text"
                placeholder="Internal Accountant Memo..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full border-none p-1 focus:outline-none bg-gray-50 rounded"
              />
            </div>
          </div>
        </div>

        {/* Center column: Discounts, Additional Charges, & Round-Offs (Section 7, Section 8, Section 9) */}
        <div className="space-y-3">
          <span className="font-extrabold text-gray-500 text-[10px] uppercase tracking-wider block">Discounts &amp; Surcharges</span>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-gray-400 font-bold block">Bill Flat Disc (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={flatBillDiscountPercent}
                onChange={(e) => setFlatBillDiscountPercent(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-1.5 font-semibold font-mono text-center bg-white mt-1"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-400 font-bold block">Bill Flat Disc (₹)</label>
              <input
                type="number"
                min="0"
                value={flatBillDiscountAmount}
                onChange={(e) => setFlatBillDiscountAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-1.5 font-semibold font-mono text-center bg-white mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-400 font-bold block">Cash Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={cashDiscount}
                onChange={(e) => setCashDiscount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-1.5 font-semibold font-mono text-center bg-white mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-400 font-bold block">Scheme Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={schemeDiscount}
                onChange={(e) => setSchemeDiscount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-1.5 font-semibold font-mono text-center bg-white mt-1"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Dynamic Additional Charges (Section 9) */}
          <div className="bg-gray-50 p-2 border border-gray-200 rounded-xl space-y-1.5">
            <span className="font-extrabold text-[9px] text-gray-500 uppercase tracking-wider block">Additional Logistics Charges (₹)</span>
            <div className="grid grid-cols-3 gap-1 font-mono text-[9px]">
              <div>
                <label className="text-[8px] text-gray-400 block">Freight</label>
                <input
                  type="number"
                  value={additionalCharges.freight}
                  onChange={(e) => setAdditionalCharges(prev => ({ ...prev, freight: e.target.value }))}
                  className="w-full border border-gray-100 rounded bg-white p-0.5 text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-gray-400 block">Packing</label>
                <input
                  type="number"
                  value={additionalCharges.packing}
                  onChange={(e) => setAdditionalCharges(prev => ({ ...prev, packing: e.target.value }))}
                  className="w-full border border-gray-100 rounded bg-white p-0.5 text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-gray-400 block">Loading</label>
                <input
                  type="number"
                  value={additionalCharges.loading}
                  onChange={(e) => setAdditionalCharges(prev => ({ ...prev, loading: e.target.value }))}
                  className="w-full border border-gray-100 rounded bg-white p-0.5 text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-gray-400 block">Transport</label>
                <input
                  type="number"
                  value={additionalCharges.transport}
                  onChange={(e) => setAdditionalCharges(prev => ({ ...prev, transport: e.target.value }))}
                  className="w-full border border-gray-100 rounded bg-white p-0.5 text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-gray-400 block">Handling</label>
                <input
                  type="number"
                  value={additionalCharges.handling}
                  onChange={(e) => setAdditionalCharges(prev => ({ ...prev, handling: e.target.value }))}
                  className="w-full border border-gray-100 rounded bg-white p-0.5 text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-gray-400 block">Other</label>
                <input
                  type="number"
                  value={additionalCharges.other}
                  onChange={(e) => setAdditionalCharges(prev => ({ ...prev, other: e.target.value }))}
                  className="w-full border border-gray-100 rounded bg-white p-0.5 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Calculations Summary Card (Section 8, Section 10) */}
        <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-200 flex flex-col justify-between">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between font-mono text-gray-500">
              <span>Items Total ({sum.totalItems} rows)</span>
              <span>₹{(sum.subtotal ?? 0).toFixed(2)}</span>
            </div>
            {sum.discountAmount > 0 && (
              <div className="flex justify-between font-mono text-red-500 font-semibold">
                <span>POS Deductions</span>
                <span>-₹{(sum.discountAmount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-mono text-gray-500">
              <span>Base Taxable Amount</span>
              <span>₹{(sum.taxableAmount ?? 0).toFixed(2)}</span>
            </div>
            {gstEnabled && (
              <>
                <div className="flex justify-between font-mono text-gray-500 text-[11px]">
                  <span>CGST (Central Tax)</span>
                  <span>₹{(sum.cgst ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-gray-500 text-[11px]">
                  <span>SGST (State Tax)</span>
                  <span>₹{(sum.sgst ?? 0).toFixed(2)}</span>
                </div>
              </>
            )}

            {/* Editable Round-Off Toggle Override (Section 8) */}
            <div className="border-t border-dashed border-gray-200 pt-1.5 mt-1.5 flex justify-between items-center">
              <button
                onClick={() => setIsManualRoundOff(!isManualRoundOff)}
                className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${
                  isManualRoundOff ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'
                }`}
                title="Toggle manual round-off adjustment"
              >
                {isManualRoundOff ? 'Manual R-Off' : 'Auto R-Off'}
              </button>
              {isManualRoundOff ? (
                <input
                  type="number"
                  step="0.01"
                  value={manualRoundOffValue}
                  onChange={(e) => setManualRoundOffValue(e.target.value)}
                  className="w-16 border border-gray-300 rounded px-1 py-0.5 text-right font-mono text-[10px]"
                />
              ) : (
                <span className="font-mono text-gray-500">
                  {sum.roundOff > 0 ? '+' : ''}₹{(sum.roundOff ?? 0).toFixed(2)}
                </span>
              )}
            </div>
            
            <div className="border-t border-gray-300 pt-2 flex justify-between items-end">
              <span className="font-bold text-gray-800 text-sm">Grand Total</span>
              <span className="font-mono font-extrabold text-lg text-black">
                ₹{(sum.grandTotal ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Core POS Save Triggers */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={clearBill}
              className="py-2 px-3 border border-gray-200 hover:border-gray-400 rounded-xl text-xs font-semibold bg-white cursor-pointer hover:bg-gray-50 text-center transition-colors"
            >
              Clear POS
            </button>
            <button
              id="pos-save-and-print"
              onClick={() => handleSaveBill(true)}
              className="py-2 px-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer flex items-center justify-center gap-1 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Checkout F10</span>
            </button>
          </div>
        </div>

      </div>

      {/* Resume Held Bills Dialog overlay */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-500 animate-spin-slow" />
                <span>Resume Held Drafts ({bills.filter(b => b.status === 'on_hold').length})</span>
              </h3>
              <button onClick={() => setShowResumeModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto">
              {bills.filter(b => b.status === 'on_hold').length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">No held POS sessions found</div>
              ) : (
                bills.filter(b => b.status === 'on_hold').map((holdBill) => (
                  <div 
                    key={holdBill.id} 
                    className="border border-gray-200 hover:border-gray-400 p-3.5 rounded-xl flex justify-between items-center bg-gray-50/50 hover:bg-white transition-all text-xs"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{holdBill.customerName}</div>
                      <div className="text-[10px] text-gray-400 mt-1 font-mono">
                        Held: {holdBill.holdReason || 'No reason'} &middot; {holdBill.items.length} items &middot; ₹{(holdBill.grandTotal ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">
                        Time: {holdBill.time}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResumeBill(holdBill)}
                      className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      Restore Draft
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-5 pt-4 border-t border-gray-150 flex justify-end">
              <button
                onClick={() => setShowResumeModal(false)}
                className="py-2 px-4 border border-gray-200 hover:border-gray-400 rounded-xl text-xs font-semibold bg-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Dialog overlay */}
      {showAddCustModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="text-sm font-bold text-gray-900">Add Customer Quick Profile</h3>
              <button onClick={() => setShowAddCustModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomerQuick} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  placeholder="e.g. Mani Electricals"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  placeholder="10-digit primary mobile"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Address Location</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  placeholder="Street and Area info"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  value={newCustGst}
                  onChange={(e) => setNewCustGst(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white uppercase"
                  placeholder="33AAAAA1234XX"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Customer Channel Type</label>
                <select
                  value={newCustType}
                  onChange={(e) => setNewCustType(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                >
                  <option value="retail">Retail Client</option>
                  <option value="wholesale">Wholesale Dealer</option>
                  <option value="contractor">Sub-Contractor</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-colors text-center"
              >
                Register &amp; Apply Client
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Auto Create Product Dialog overlay */}
      {showAutoCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150">
              <h3 className="text-sm font-bold text-gray-900">Create New Product Master</h3>
              <button onClick={() => setShowAutoCreateModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAutoCreatedProduct} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={autoCreateData.name}
                  onChange={(e) => setAutoCreateData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-gray-50 text-gray-600"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    value={autoCreateData.sellingPrice}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:border-black bg-white font-semibold text-gray-900 text-xs"
                    placeholder="e.g. 150"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Purchase Price</label>
                  <input
                    type="number"
                    step="any"
                    value={autoCreateData.purchasePrice}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:border-black bg-white text-gray-900 font-medium text-xs"
                    placeholder="e.g. 110"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">GST Rate *</label>
                  <select
                    value={autoCreateData.gstPercent}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, gstPercent: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:border-black bg-white text-xs"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={autoCreateData.hsnCode}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, hsnCode: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                    placeholder="e.g. 8536"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Unit of Measure</label>
                  <select
                    value={autoCreateData.unit}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Piece">Piece</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Meter">Meter</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Feet">Feet</option>
                    <option value="Roll">Roll</option>
                    <option value="Coil">Coil</option>
                    <option value="Box">Box</option>
                    <option value="Packet">Packet</option>
                    <option value="Bundle">Bundle</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Category</label>
                  <input
                    type="text"
                    value={autoCreateData.category}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={autoCreateData.brand}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={autoCreateData.openingStock}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, openingStock: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white text-gray-900 font-medium"
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={autoCreateData.minStock}
                    onChange={(e) => setAutoCreateData(prev => ({ ...prev, minStock: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white text-gray-900 font-medium"
                    placeholder="e.g. 5"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Barcode</label>
                <input
                  type="text"
                  value={autoCreateData.barcode}
                  onChange={(e) => setAutoCreateData(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white text-gray-900 font-medium"
                  placeholder="Optional barcode scan"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold cursor-pointer transition-colors text-center"
              >
                Create &amp; Add to Bill (Enter)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Draft restore prompt */}
      {showDraftRestorePrompt && draftBill && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-gray-100">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Unfinished Bill Found</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">A saved draft from a previous session was found. Would you like to continue where you left off?</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                Draft: <strong>{draftBill.billNumber}</strong> • {draftBill.items?.length || 0} items • Saved at {new Date(draftBill.createdAt || Date.now()).toLocaleString()}
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    restoreDraft(draftBill);
                    setShowDraftRestorePrompt(false);
                  }}
                  className="flex-1 bg-black text-white hover:bg-neutral-800 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  Continue Billing
                </button>
                <button
                  onClick={() => {
                    try { saveDraft(null); } catch (e) {}
                    setShowDraftRestorePrompt(false);
                    pushNotify('warn', 'Discarded unfinished draft. Starting a fresh bill.');
                  }}
                  className="flex-1 bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 py-3 rounded-xl font-bold text-sm transition-all"
                >
                  Start New Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Preview Modal (Exact Print preview) */}
      
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
                            sellingPrice: update.rate,
                            mrp: Math.round(update.rate * 1.25)
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

      {showInvoiceModal && invoiceToPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto print:static print:bg-transparent print:p-0 print:overflow-visible print:justify-start">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] print:max-h-none print:w-full print:p-0 print:rounded-none print:border-none print:shadow-none print:overflow-visible">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150 shrink-0">
              <h3 className="text-sm font-bold text-gray-900">POS Sales Receipt Preview</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6">
              {/* Lazy loading the bill preview component inside */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 shadow-inner">
                <BillPreview bill={invoiceToPreview} />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-150 shrink-0 flex justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="py-2 px-4 border border-gray-200 hover:border-gray-400 rounded-xl text-xs font-semibold bg-white cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={async () => { await printA4Element(); try { saveDraft(null); } catch (e) {} }}
                className="py-2 px-5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Send to Printer Device
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Lazy loaded preview layout to ensure perfect rendering symmetry
import { BillPreview, printA4Element } from './BillPreview';

