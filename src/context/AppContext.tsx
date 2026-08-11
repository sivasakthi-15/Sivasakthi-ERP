import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { 
  Product, Customer, Supplier, Bill, BillItem, PurchaseBill, PurchaseItem, 
  Expense, StockMovement, PaymentTransaction, AuditLog, Business, BusinessDetails,
  BillStatus, SalesReturn, PurchaseOrder, GRN, PurchaseReturn, SupplierCreditNote, SupplierDebitNote,
  Warehouse, WarehouseStock, StockTransfer, SerialNumber, StockAdjustment,
  UserProfile, RoleConfig, UserSession, ExtendedAuditLog, SecurityNotification, SystemRole, UserPermissions
} from '../types';
import { 
  BUSINESSES, SIVASAKTHI_PRODUCTS, MEENATCHI_PRODUCTS, 
  INITIAL_CUSTOMERS, INITIAL_SUPPLIERS 
} from '../data/initialData';


interface AppContextType {
  // Navigation & Business Select States
  currentBusiness: Business | null;
  selectBusiness: (bizId: string) => void;
  currentBillType: 'normal' | 'contractor' | null;
  setBillType: (type: 'normal' | 'contractor' | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resetToWelcome: () => void;
  editingBillId: string | null;
  setEditingBillId: (id: string | null) => void;

  // Master Data
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  bills: Bill[];
  purchases: PurchaseBill[];
  salesReturns: SalesReturn[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  payments: PaymentTransaction[];
  auditLogs: ExtendedAuditLog[];
  businessDetails: BusinessDetails;

  // Advanced Inventory States & Actions
  warehouses: Warehouse[];
  warehouseStocks: WarehouseStock[];
  stockTransfers: StockTransfer[];
  serialNumbers: SerialNumber[];
  stockAdjustments: StockAdjustment[];
  
  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'shopId'>) => void;
  updateWarehouseStock: (productId: string, warehouseId: string, currentStock: number, reservedStock?: number) => void;
  createStockTransfer: (transfer: Omit<StockTransfer, 'id' | 'shopId' | 'transferNumber' | 'createdAt'>) => void;
  addSerialNumber: (sn: Omit<SerialNumber, 'id' | 'shopId' | 'createdAt'>) => void;
  updateSerialNumber: (id: string, updated: Partial<SerialNumber>) => void;
  adjustStockProfessional: (adj: Omit<StockAdjustment, 'id' | 'shopId' | 'adjustmentNumber' | 'createdAt'>) => void;

  // Master Actions
  addProduct: (product: Omit<Product, 'id' | 'shopId'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  addCustomer: (customer: Omit<Customer, 'id' | 'shopId' | 'outstandingAmount'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => boolean;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'shopId' | 'outstandingAmount'>) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;

  // Invoice / Billing Actions
  nextBillNumber: string;
  createBill: (billData: Omit<Bill, 'id' | 'shopId' | 'billNumber' | 'createdAt' | 'time'>) => Bill;
  updateBill: (id: string, updatedData: Partial<Bill>) => Promise<Bill>;
  cancelBill: (id: string, reason: string) => void;
  deleteBill: (id: string) => void;
  draftBill: Bill | null;
  saveDraft: (bill: Bill | null) => void;

  // Purchases
  createPurchase: (purchaseData: Omit<PurchaseBill, 'id' | 'shopId' | 'purchaseNumber' | 'createdAt'>) => void;
  updatePurchase: (id: string, purchaseData: Omit<PurchaseBill, 'id' | 'shopId' | 'purchaseNumber' | 'createdAt'>) => boolean;
  deletePurchase: (id: string) => boolean;
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  purchaseReturns: PurchaseReturn[];
  supplierCreditNotes: SupplierCreditNote[];
  supplierDebitNotes: SupplierDebitNote[];
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'shopId' | 'poNumber' | 'createdAt'>) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;
  updatePurchaseOrderReceivedQty: (id: string, productQuantities: Record<string, number>) => void;
  createGRN: (grn: Omit<GRN, 'id' | 'shopId' | 'grnNumber' | 'createdAt'>) => string;
  createPurchaseReturn: (pr: Omit<PurchaseReturn, 'id' | 'shopId' | 'returnNumber' | 'createdAt'>) => void;
  createSupplierDebitNote: (dn: Omit<SupplierDebitNote, 'id' | 'shopId' | 'debitNoteNumber' | 'createdAt'>) => void;
  
  // Sales Return
  createSalesReturn: (returnData: Omit<SalesReturn, 'id' | 'shopId' | 'returnNumber'>) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'shopId'>) => void;
  deleteExpense: (id: string) => void;

  // Payments / Ledgers
  recordPayment: (payment: Omit<PaymentTransaction, 'id' | 'shopId'>) => void;
  recordCustomerPayment: (customerId: string, amount: number, paymentMode: string, notes: string) => void;
  recordSupplierPayment: (supplierId: string, amount: number, paymentMode: string, notes: string) => void;

  // Settings Action
  updateSettings: (settings: Partial<BusinessDetails>) => void;
  updateBusinessDetails: (settings: Partial<BusinessDetails>) => void;
  importBackup: (backupStr: string) => boolean;
  exportBackup: () => string;

  // Stock Adjustments
  adjustStock: (productId: string, adjustQty: number, reason: string) => void;

  // ENTERPRISE AUTH & SECURITY PROPERTIES
  currentUser: UserProfile | null;
  users: UserProfile[];
  roles: RoleConfig[];
  sessions: UserSession[];
  securityNotifications: SecurityNotification[];
  loginHistory: { id: string; email: string; timestamp: string; action: string; device: string; ip: string }[];
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => { success: boolean; error?: string };
  resetPasswordByToken: (email: string, code: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  addUser: (userData: Omit<UserProfile, 'id' | 'createdAt'>, passwordRaw: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updated: Partial<UserProfile>) => void;
  deactivateUser: (id: string) => void;
  deleteUser: (id: string) => void;
  resetUserPasswordAdmin: (userId: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  addCustomRole: (role: RoleConfig) => void;
  updateCustomRole: (name: string, permissions: UserPermissions) => void;
  deleteCustomRole: (name: string) => void;
  hasPermission: (module: keyof UserPermissions, action: string) => boolean;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  triggerNotification: (type: SecurityNotification['type'], title: string, message: string) => void;
  secureApiCall: <T,>(actionName: string, reqPerm: { module: keyof UserPermissions; action: string }, payload: any, handler: () => T) => Promise<{ success: boolean; data?: T; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation state
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);
  const [currentBillType, setCurrentBillTypeState] = useState<'normal' | 'contractor' | null>(null);
  const [activeTab, setActiveTab] = useState<string>('billing');
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // Master states
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [purchases, setPurchases] = useState<PurchaseBill[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [supplierCreditNotes, setSupplierCreditNotes] = useState<SupplierCreditNote[]>([]);
  const [supplierDebitNotes, setSupplierDebitNotes] = useState<SupplierDebitNote[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Advanced Inventory states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  
  // Settings for currently active shop
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({} as BusinessDetails);

  const normalizeBusinessDetails = (details: Partial<BusinessDetails> | undefined, shopId: string): BusinessDetails => {
    const value = details || {};
    const appearance = {
      showLogo: true,
      showGst: true,
      showQr: true,
      showBankDetails: true,
      showSignature: true,
      showSeal: true,
      showFooter: true,
      showProprietorName: true,
      showLogoOnThermal: false,
      ...(value.appearance || {})
    };
    const banks = value.banks?.length ? value.banks : [{
      id: `bank_${shopId}`,
      beneficiaryName: value.accountHolder || '',
      bankName: value.bankName || '',
      branch: value.branch || '',
      accountNumber: value.accountNumber || '',
      ifscCode: value.ifscCode || '',
      accountType: 'Current',
      upiId: value.upiId || ''
    }];
    return {
      ...value,
      id: value.id || shopId,
      name: value.name || value.tradingName || '',
      logo: value.logo || '',
      address: value.address || '',
      city: value.city || '',
      state: value.state || '',
      pincode: value.pincode || '',
      phone: value.phone || '',
      altPhone: value.altPhone || '',
      email: value.email || '',
      website: value.website || '',
      gstNumber: value.gstNumber || '',
      panNumber: value.panNumber || '',
      bankName: value.bankName || banks[0].bankName,
      accountHolder: value.accountHolder || banks[0].beneficiaryName,
      accountNumber: value.accountNumber || banks[0].accountNumber,
      ifscCode: value.ifscCode || banks[0].ifscCode,
      branch: value.branch || banks[0].branch,
      upiId: value.upiId || banks[0].upiId,
      invoicePrefix: value.invoicePrefix || 'INV',
      termsAndConditions: value.termsAndConditions || [],
      declaration: value.declaration || '',
      authorizedSignature: value.authorizedSignature || 'Proprietor',
      roundOff: value.roundOff ?? true,
      decimalPlaces: value.decimalPlaces ?? 2,
      banks,
      defaultBankAccountId: value.defaultBankAccountId || banks[0].id,
      appearance
    } as BusinessDetails;
  };

  // Draft state (for autosave)
  const [draftBill, setDraftBill] = useState<Bill | null>(null);

  // Next bill number helper
  const [nextBillNumber, setNextBillNumber] = useState<string>('');

  // Enterprise Security States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = safeGetItem('enterprise_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [securityNotifications, setSecurityNotifications] = useState<SecurityNotification[]>([]);
  const [loginHistory, setLoginHistory] = useState<{ id: string; email: string; timestamp: string; action: string; device: string; ip: string }[]>([]);


  // 1. Initial State Hydration / Initialization from LocalStorage or seed data
  useEffect(() => {
    // We only hydrate state when a business is selected, keeping it isolated!
    if (!currentBusiness) return;

    const bizId = currentBusiness.id;

    // Helper to get with fallback to seed data
    const getLocal = <T,>(key: string, fallback: T): T => {
      const stored = safeGetItem(`${bizId}_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    };

    // Load products
    const defaultProducts = bizId === 'sivasakthi_elec' ? SIVASAKTHI_PRODUCTS : MEENATCHI_PRODUCTS;
    const loadedProducts = getLocal<Product[]>('products', defaultProducts);
    setProducts(loadedProducts);

    // Load customers
    const loadedCustomers = getLocal<Customer[]>('customers', INITIAL_CUSTOMERS);
    setCustomers(loadedCustomers);

    // Load suppliers
    const loadedSuppliers = getLocal<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
    setSuppliers(loadedSuppliers);

    // Load purchases
    const loadedPurchases = getLocal<PurchaseBill[]>('purchases', []);
    setPurchases(loadedPurchases);

    setPurchaseOrders(getLocal<PurchaseOrder[]>('purchase_orders', []));
    setGrns(getLocal<GRN[]>('grns', []));
    setPurchaseReturns(getLocal<PurchaseReturn[]>('purchase_returns', []));
    setSupplierCreditNotes(getLocal<SupplierCreditNote[]>('supplier_credit_notes', []));
    setSupplierDebitNotes(getLocal<SupplierDebitNote[]>('supplier_debit_notes', []));

    // Load sales returns
    const loadedSalesReturns = getLocal<SalesReturn[]>('sales_returns', []);
    setSalesReturns(loadedSalesReturns);

    // Load expenses
    const loadedExpenses = getLocal<Expense[]>('expenses', []);
    setExpenses(loadedExpenses);

    // Load stock movements
    const loadedStockMovements = getLocal<StockMovement[]>('stock_movements', []);
    setStockMovements(loadedStockMovements);

    // Load payments
    const loadedPayments = getLocal<PaymentTransaction[]>('payments', []);
    setPayments(loadedPayments);

    // Load audit logs
    const loadedAuditLogs = getLocal<AuditLog[]>('audit_logs', []);
    setAuditLogs(loadedAuditLogs);

    // Hydrate advanced inventory states
    const defaultWarehouses: Warehouse[] = [
      { id: 'wh_main', shopId: bizId, name: 'Main Store', location: 'Main Retail Counter', isDefault: true },
      { id: 'wh_warehouse', shopId: bizId, name: 'Main Warehouse', location: 'Industrial Area Unit 1' },
      { id: 'wh_godown', shopId: bizId, name: 'Godown Store', location: 'Outer Bypass Storage' },
      { id: 'wh_branch', shopId: bizId, name: 'Branch Store', location: 'Nagar Sub-branch' }
    ];
    const loadedWarehouses = getLocal<Warehouse[]>('warehouses', defaultWarehouses);
    setWarehouses(loadedWarehouses);

    const defaultStocks: WarehouseStock[] = [];
    loadedProducts.forEach(prod => {
      const mainStockVal = Math.floor(prod.stock * 0.7);
      const whStockVal = prod.stock - mainStockVal;
      defaultStocks.push({
        id: `ws_${prod.id}_wh_main`,
        shopId: bizId,
        productId: prod.id,
        warehouseId: 'wh_main',
        currentStock: mainStockVal,
        reservedStock: 0,
        availableStock: mainStockVal
      });
      defaultStocks.push({
        id: `ws_${prod.id}_wh_warehouse`,
        shopId: bizId,
        productId: prod.id,
        warehouseId: 'wh_warehouse',
        currentStock: whStockVal,
        reservedStock: 0,
        availableStock: whStockVal
      });
      defaultStocks.push({
        id: `ws_${prod.id}_wh_godown`,
        shopId: bizId,
        productId: prod.id,
        warehouseId: 'wh_godown',
        currentStock: 0,
        reservedStock: 0,
        availableStock: 0
      });
      defaultStocks.push({
        id: `ws_${prod.id}_wh_branch`,
        shopId: bizId,
        productId: prod.id,
        warehouseId: 'wh_branch',
        currentStock: 0,
        reservedStock: 0,
        availableStock: 0
      });
    });
    const loadedWarehouseStocks = getLocal<WarehouseStock[]>('warehouse_stocks', defaultStocks);
    setWarehouseStocks(loadedWarehouseStocks);

    setStockTransfers(getLocal<StockTransfer[]>('stock_transfers', []));

    const seedSerials: SerialNumber[] = [];
    loadedProducts.forEach((p, index) => {
      const isHighValue = ['fan', 'motor', 'pump', 'heater', 'geyser', 'wire'].some(keyword => p.name.toLowerCase().includes(keyword));
      if (isHighValue) {
        p.isSerialTracked = true;
        seedSerials.push({
          id: `sn_${p.id}_1`,
          shopId: bizId,
          productId: p.id,
          productName: p.name,
          serialNumber: `SN-${p.productCode}-001`,
          status: 'available',
          warrantyPeriodMonths: p.warrantyPeriodMonths || 12,
          createdAt: new Date().toISOString()
        });
        seedSerials.push({
          id: `sn_${p.id}_2`,
          shopId: bizId,
          productId: p.id,
          productName: p.name,
          serialNumber: `SN-${p.productCode}-002`,
          status: 'available',
          warrantyPeriodMonths: p.warrantyPeriodMonths || 12,
          createdAt: new Date().toISOString()
        });
      }
    });
    setSerialNumbers(getLocal<SerialNumber[]>('serial_numbers', seedSerials));

    setStockAdjustments(getLocal<StockAdjustment[]>('stock_adjustments', []));

    // Load settings details
    const activeBiz = BUSINESSES.find(b => b.id === bizId);
    const loadedDetails = getLocal<BusinessDetails>('settings', activeBiz?.defaultDetails as BusinessDetails);
    setBusinessDetails(normalizeBusinessDetails(loadedDetails, bizId));

    // Load draft
    const loadedDraft = safeGetItem(`${bizId}_draft_bill`);
    setDraftBill(loadedDraft ? JSON.parse(loadedDraft) : null);

    // Seed historical bills if empty, so dashboard looks beautiful right away!
    const loadedBills = getLocal<Bill[]>('bills', []);
    if (loadedBills.length === 0) {
      const seededBills = generateSeededHistory(bizId, loadedProducts, loadedCustomers);
      setBills(seededBills);
      safeSetItem(`${bizId}_bills`, JSON.stringify(seededBills));
      
      // Update inventory and stock movements for these seeded bills
      const updatedProds = [...loadedProducts];
      const movements: StockMovement[] = [];
      
      seededBills.forEach(b => {
        if (b.status !== 'cancelled') {
          b.items.forEach(item => {
            const prod = updatedProds.find(p => p.id === item.productId);
            if (prod) {
              const prevStock = prod.stock;
              prod.stock = Math.max(0, prod.stock - item.quantity);
              movements.push({
                id: `sm_seed_${b.id}_${item.productId}`,
                productId: item.productId,
                shopId: bizId,
                date: b.date,
                time: b.time,
                quantity: -item.quantity,
                type: 'sale',
                reason: `Sales Invoice ${b.billNumber}`,
                refId: b.id,
                stockBefore: prevStock,
                stockAfter: prod.stock,
                user: 'Administrator'
              });
            }
          });
        }
      });
      setProducts(updatedProds);
      safeSetItem(`${bizId}_products`, JSON.stringify(updatedProds));
      setStockMovements(movements);
      safeSetItem(`${bizId}_stock_movements`, JSON.stringify(movements));
    } else {
      setBills(loadedBills);
    }

  }, [currentBusiness]);

  // Live Database Sync via full-stack Express API
  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;

    const syncLiveDatabase = async () => {
      try {
        const [
          dbSettings, dbProducts, dbCustomers, dbSuppliers,
          dbInvoices, dbPurchases, dbReturns, dbExpenses,
          dbPayments, dbWHs, dbStocks, dbAudits, dbAlerts
        ] = await Promise.all([
          api.settings.get(bizId).catch(() => null),
          api.products.list(bizId).catch(() => []),
          api.customers.list(bizId).catch(() => []),
          api.suppliers.list(bizId).catch(() => []),
          api.invoices.list(bizId).catch(() => []),
          api.purchases.list(bizId).catch(() => []),
          api.returns.list(bizId).catch(() => []),
          api.expenses.list(bizId).catch(() => []),
          api.payments.list(bizId).catch(() => []),
          api.warehouses.list(bizId).catch(() => []),
          api.warehouses.listStock(bizId).catch(() => []),
          api.auditLogs.list(bizId).catch(() => []),
          api.auditLogs.notifications(bizId).catch(() => [])
        ]);

        const normalize = <T extends { id?: string; _id?: any }>(arr: T[]): T[] => {
          if (!arr || !Array.isArray(arr)) return [];
          return arr.filter(Boolean).map(item => ({
            ...item,
            id: item.id || (item._id ? item._id.toString() : '')
          }));
        };

        if (dbSettings && dbSettings.name) {
          setBusinessDetails(normalizeBusinessDetails({
            ...dbSettings,
            id: dbSettings.shopId || (dbSettings as any)._id?.toString() || bizId
          }, bizId));
        }
        if (dbProducts && dbProducts.length > 0) setProducts(normalize(dbProducts));
        if (dbCustomers && dbCustomers.length > 0) setCustomers(normalize(dbCustomers));
        if (dbSuppliers && dbSuppliers.length > 0) setSuppliers(normalize(dbSuppliers));
        if (dbInvoices && dbInvoices.length > 0) setBills(normalize(dbInvoices));
        if (dbPurchases && dbPurchases.length > 0) setPurchases(normalize(dbPurchases));
        if (dbReturns && dbReturns.length > 0) setSalesReturns(normalize(dbReturns));
        if (dbExpenses && dbExpenses.length > 0) setExpenses(normalize(dbExpenses));
        if (dbPayments && dbPayments.length > 0) setPayments(normalize(dbPayments));
        if (dbWHs && dbWHs.length > 0) setWarehouses(normalize(dbWHs));
        if (dbStocks && dbStocks.length > 0) setWarehouseStocks(normalize(dbStocks));
        if (dbAudits && dbAudits.length > 0) setAuditLogs(normalize(dbAudits));
        if (dbAlerts && dbAlerts.length > 0) setSecurityNotifications(normalize(dbAlerts));

        const nextNumData = await api.invoices.getNextNumber(bizId).catch(() => null);
        if (nextNumData) setNextBillNumber(nextNumData.nextBillNumber);
      } catch (err) {
        console.warn('API sync not available. Running in offline-first localStorage backup mode.', err);
      }
    };

    syncLiveDatabase();
  }, [currentBusiness]);

  // Reactive Client-Side Next Bill Number Fallback & Prefix Resolver
  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    const prefix = businessDetails?.invoicePrefix || (bizId === 'sivasakthi_elec' ? 'SE' : 'SM');
    
    const localInvoices = bills.filter(b => b.shopId === bizId && (b.docType === 'invoice' || !b.docType));
    const nextLocalNum = `${prefix}-${(localInvoices.length + 1).toString().padStart(6, '0')}`;
    
    if (!nextBillNumber || !nextBillNumber.startsWith(prefix)) {
      setNextBillNumber(nextLocalNum);
    }
  }, [bills, currentBusiness, businessDetails]); // Removed nextBillNumber to prevent infinite rendering loops

  // 2. Synchronize states back to local storage upon modification
  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_products`, JSON.stringify(products));
  }, [products, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_warehouses`, JSON.stringify(warehouses));
  }, [warehouses, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_warehouse_stocks`, JSON.stringify(warehouseStocks));
  }, [warehouseStocks, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_stock_transfers`, JSON.stringify(stockTransfers));
  }, [stockTransfers, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_serial_numbers`, JSON.stringify(serialNumbers));
  }, [serialNumbers, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_stock_adjustments`, JSON.stringify(stockAdjustments));
  }, [stockAdjustments, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_customers`, JSON.stringify(customers));
  }, [customers, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_suppliers`, JSON.stringify(suppliers));
  }, [suppliers, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_bills`, JSON.stringify(bills));
    generateNextBillNo(bizId, bills);
  }, [bills, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_purchases`, JSON.stringify(purchases));
  }, [purchases, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_purchase_orders`, JSON.stringify(purchaseOrders));
  }, [purchaseOrders, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_grns`, JSON.stringify(grns));
  }, [grns, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_purchase_returns`, JSON.stringify(purchaseReturns));
  }, [purchaseReturns, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_supplier_credit_notes`, JSON.stringify(supplierCreditNotes));
  }, [supplierCreditNotes, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_supplier_debit_notes`, JSON.stringify(supplierDebitNotes));
  }, [supplierDebitNotes, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_sales_returns`, JSON.stringify(salesReturns));
  }, [salesReturns, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_expenses`, JSON.stringify(expenses));
  }, [expenses, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_stock_movements`, JSON.stringify(stockMovements));
  }, [stockMovements, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_payments`, JSON.stringify(payments));
  }, [payments, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs, currentBusiness]);

  useEffect(() => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    safeSetItem(`${bizId}_settings`, JSON.stringify(businessDetails));
    generateNextBillNo(bizId, bills);
  }, [businessDetails, currentBusiness]);

  // Seeding default users, roles, history, sessions & notifications
  useEffect(() => {
    const initSecurity = async () => {
      // 1. Initialize Default Permissions
      const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
        owner: {
          billing: { view: true, create: true, edit: true, delete: true, print: true, export: true },
          purchase: { view: true, create: true, edit: true, delete: true, print: true, export: true },
          inventory: { view: true, stockAdjustment: true, stockTransfer: true },
          reports: { view: true, export: true },
          accounting: { view: true, edit: true },
          settings: { fullControl: true }
        },
        admin: {
          billing: { view: true, create: true, edit: true, delete: true, print: true, export: true },
          purchase: { view: true, create: true, edit: true, delete: true, print: true, export: true },
          inventory: { view: true, stockAdjustment: true, stockTransfer: true },
          reports: { view: true, export: true },
          accounting: { view: true, edit: true },
          settings: { fullControl: true }
        },
        manager: {
          billing: { view: true, create: true, edit: true, delete: false, print: true, export: true },
          purchase: { view: true, create: true, edit: true, delete: false, print: true, export: true },
          inventory: { view: true, stockAdjustment: true, stockTransfer: true },
          reports: { view: true, export: true },
          accounting: { view: true, edit: true },
          settings: { fullControl: false }
        },
        cashier: {
          billing: { view: true, create: true, edit: false, delete: false, print: true, export: false },
          purchase: { view: false, create: false, edit: false, delete: false, print: false, export: false },
          inventory: { view: true, stockAdjustment: false, stockTransfer: false },
          reports: { view: false, export: false },
          accounting: { view: false, edit: false },
          settings: { fullControl: false }
        },
        accountant: {
          billing: { view: true, create: false, edit: false, delete: false, print: false, export: true },
          purchase: { view: true, create: false, edit: false, delete: false, print: false, export: true },
          inventory: { view: true, stockAdjustment: false, stockTransfer: false },
          reports: { view: true, export: true },
          accounting: { view: true, edit: true },
          settings: { fullControl: false }
        },
        store_keeper: {
          billing: { view: false, create: false, edit: false, delete: false, print: false, export: false },
          purchase: { view: true, create: true, edit: false, delete: false, print: false, export: false },
          inventory: { view: true, stockAdjustment: true, stockTransfer: true },
          reports: { view: true, export: false },
          accounting: { view: false, edit: false },
          settings: { fullControl: false }
        }
      };

      // 2. Load Roles
      const savedRoles = safeGetItem('enterprise_roles');
      let loadedRoles: RoleConfig[] = [];
      if (savedRoles) {
        loadedRoles = JSON.parse(savedRoles);
      } else {
        loadedRoles = [
          { name: 'owner', label: 'Owner', description: 'Full access to all system business entities and configuration', permissions: DEFAULT_PERMISSIONS.owner, isSystem: true },
          { name: 'admin', label: 'Admin', description: 'Administrative access for branches, users and settings', permissions: DEFAULT_PERMISSIONS.admin, isSystem: true },
          { name: 'manager', label: 'Manager', description: 'Branch manager with operational and catalog access', permissions: DEFAULT_PERMISSIONS.manager, isSystem: true },
          { name: 'cashier', label: 'Cashier', description: 'Point of sale terminal sales, billing and printing operations', permissions: DEFAULT_PERMISSIONS.cashier, isSystem: true },
          { name: 'accountant', label: 'Accountant', description: 'Financial ledgers, bookkeeping and tax reports access', permissions: DEFAULT_PERMISSIONS.accountant, isSystem: true },
          { name: 'store_keeper', label: 'Store Keeper', description: 'Warehouse stocking, adjustments and transfers keeper', permissions: DEFAULT_PERMISSIONS.store_keeper, isSystem: true },
        ];
        safeSetItem('enterprise_roles', JSON.stringify(loadedRoles));
      }
      setRoles(loadedRoles);

      // 3. Load Users
      const savedUsers = safeGetItem('enterprise_users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        const defaultPasswordHash = await hashPassword('Password@123');
        const seededUsers: UserProfile[] = [
          {
            id: 'u_owner',
            name: 'Sivasakthi Owner',
            email: 'owner@enterprise.com',
            phone: '9876543210',
            role: 'owner',
            branch: 'all',
            status: 'active',
            permittedBranches: ['sivasakthi_elec', 'meenatchi_pipes'],
            createdAt: new Date().toISOString(),
            passwordHash: defaultPasswordHash,
          },
          {
            id: 'u_admin',
            name: 'System Administrator',
            email: 'admin@enterprise.com',
            phone: '9944556677',
            role: 'admin',
            branch: 'all',
            status: 'active',
            permittedBranches: ['sivasakthi_elec', 'meenatchi_pipes'],
            createdAt: new Date().toISOString(),
            passwordHash: defaultPasswordHash,
          },
          {
            id: 'u_manager',
            name: 'Sivasakthi Manager',
            email: 'manager@sivasakthi.com',
            phone: '9443211223',
            role: 'manager',
            branch: 'sivasakthi_elec',
            status: 'active',
            permittedBranches: ['sivasakthi_elec'],
            createdAt: new Date().toISOString(),
            passwordHash: defaultPasswordHash,
          },
          {
            id: 'u_cashier',
            name: 'Sivasakthi Cashier',
            email: 'cashier@sivasakthi.com',
            phone: '9443211224',
            role: 'cashier',
            branch: 'sivasakthi_elec',
            status: 'active',
            permittedBranches: ['sivasakthi_elec'],
            createdAt: new Date().toISOString(),
            passwordHash: defaultPasswordHash,
          },
          {
            id: 'u_accountant',
            name: 'Sivasakthi Accountant',
            email: 'accountant@sivasakthi.com',
            phone: '9443211225',
            role: 'accountant',
            branch: 'sivasakthi_elec',
            status: 'active',
            permittedBranches: ['sivasakthi_elec'],
            createdAt: new Date().toISOString(),
            passwordHash: defaultPasswordHash,
          },
          {
            id: 'u_storekeeper',
            name: 'Sivasakthi Store Keeper',
            email: 'storekeeper@sivasakthi.com',
            phone: '9443211226',
            role: 'store_keeper',
            branch: 'sivasakthi_elec',
            status: 'active',
            permittedBranches: ['sivasakthi_elec'],
            createdAt: new Date().toISOString(),
            passwordHash: defaultPasswordHash,
          },
          {
            id: 'u_m_manager',
            name: 'Meenatchi Manager',
            email: 'manager@meenatchi.com',
            phone: '9443211227',
            role: 'manager',
            branch: 'meenatchi_pipes',
            status: 'active',
            permittedBranches: ['meenatchi_pipes'],
            createdAt: new Date().toISOString(),
            passwordHash: defaultPasswordHash,
          }
        ];
        safeSetItem('enterprise_users', JSON.stringify(seededUsers));
        setUsers(seededUsers);
      }

      // 4. Load Sessions
      const savedSessions = safeGetItem('enterprise_sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }

      // 5. Load History
      const savedHistory = safeGetItem('enterprise_login_history');
      if (savedHistory) {
        setLoginHistory(JSON.parse(savedHistory));
      }

      // 6. Load Notifications
      const savedNotifs = safeGetItem('enterprise_notifications');
      if (savedNotifs) {
        setSecurityNotifications(JSON.parse(savedNotifs));
      } else {
        const initialNotif: SecurityNotification = {
          id: 'notif_init',
          type: 'user_created',
          title: 'Security Engine Ready',
          message: 'Multi-user enterprise security, RBAC and Session logging have been activated successfully.',
          timestamp: new Date().toISOString(),
          read: false
        };
        safeSetItem('enterprise_notifications', JSON.stringify([initialNotif]));
        setSecurityNotifications([initialNotif]);
      }
    };
    initSecurity();
  }, []);

  // Sync Enterprise State Back to LocalStorage
  useEffect(() => {
    if (users.length > 0) {
      safeSetItem('enterprise_users', JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (roles.length > 0) {
      safeSetItem('enterprise_roles', JSON.stringify(roles));
    }
  }, [roles]);

  useEffect(() => {
    safeSetItem('enterprise_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    safeSetItem('enterprise_login_history', JSON.stringify(loginHistory));
  }, [loginHistory]);

  useEffect(() => {
    safeSetItem('enterprise_notifications', JSON.stringify(securityNotifications.slice(0, 100)));
  }, [securityNotifications]);

  useEffect(() => {
    if (currentUser) {
      safeSetItem('enterprise_current_user', JSON.stringify(currentUser));
    } else {
      safeRemoveItem('enterprise_current_user');
    }
  }, [currentUser]);

  // Session Timeout Auto-Logout (Section 6)
  useEffect(() => {
    if (!currentUser) return;
    
    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes of inactivity
    let lastActivity = Date.now();
    
    const updateActivity = () => {
      lastActivity = Date.now();
    };
    
    const checkTimeout = () => {
      if (Date.now() - lastActivity > TIMEOUT_DURATION) {
        logout();
        triggerNotification('failed_login', 'Session Timeout', 'You have been automatically logged out due to 15 minutes of inactivity.');
      }
    };
    
    const interval = setInterval(checkTimeout, 30000); // Check every 30 seconds
    
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, [currentUser]);

  // Low Stock monitor (Section 10)
  useEffect(() => {
    if (!products || products.length === 0) return;
    const lowStockProds = products.filter(p => p.isActive && p.stock <= p.minStock);
    if (lowStockProds.length > 0) {
      lowStockProds.forEach(p => {
        const key = `notified_low_${p.id}_${p.stock}`;
        if (!safeGetItem(key)) {
          triggerNotification('low_stock', 'Low Stock Alert', `Product ${p.name} has low stock (${p.stock} remaining, Reorder level: ${p.reorderLevel})`);
          safeSetItem(key, 'true');
        }
      });
    }
  }, [products]);


  // Handle draft autosave
  const saveDraft = (bill: Bill | null) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    setDraftBill(bill);
    if (bill) {
      safeSetItem(`${bizId}_draft_bill`, JSON.stringify(bill));
    } else {
      safeRemoveItem(`${bizId}_draft_bill`);
    }
  };

  // Helper: Create unique IDs
  const makeId = () => Math.random().toString(36).substring(2, 11);

  // Helper: Log audits
  const logAudit = (action: string, details: string, oldValue?: string, newValue?: string) => {
    if (!currentBusiness) return;
    const username = currentUser ? currentUser.name : 'System';
    const newLog: ExtendedAuditLog = {
      id: makeId(),
      shopId: currentBusiness.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      user: username,
      action,
      details,
      ipAddress: '192.168.1.101',
      oldValue,
      newValue
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Password Policy Validation (Section 8)
  const validatePasswordPolicy = (password: string): { valid: boolean; error?: string } => {
    if (password.length < 8) {
      return { valid: false, error: "Password must be at least 8 characters long." };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: "Password must contain at least one uppercase letter." };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: "Password must contain at least one lowercase letter." };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: "Password must contain at least one number." };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, error: "Password must contain at least one special character." };
    }
    return { valid: true };
  };

  // Helper to hash passwords using SHA-256 for secure comparison (Section 1)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "_salt_123");
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // JWT Generation simulation: Creates a standard structure [header].[payload].[signature] (Section 1)
  const generateJWT = (user: UserProfile): string => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      iat: Date.now(),
      exp: Date.now() + 30 * 60 * 1000 // 30 minutes expiration
    }));
    const signature = btoa(user.id + "_signature_secret");
    return `${header}.${payload}.${signature}`;
  };

  // Login (Section 1 & 6 & 9)
  const login = async (email: string, password: string, rememberMe: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Attempt real backend API login
      const res = await api.auth.login(email, password);
      if (res && res.success) {
        const loggedUser: UserProfile = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone || 'N/A',
          role: res.user.role,
          branch: res.user.branch,
          status: 'active',
          permittedBranches: res.user.permittedBranches || [],
          createdAt: res.user.createdAt || new Date().toISOString()
        };
        
        setCurrentUser(loggedUser);
        safeSetItem('enterprise_current_user', JSON.stringify(loggedUser));
        
        if (rememberMe) {
          safeSetItem('enterprise_remember_email', email);
        } else {
          safeRemoveItem('enterprise_remember_email');
        }

        // Trigger dynamic seed sync on successful login
        if (loggedUser.branch !== 'all') {
          const biz = BUSINESSES.find(b => b.id === loggedUser.branch);
          if (biz) setCurrentBusinessState(biz);
        }

        return { success: true };
      }
    } catch (err: any) {
      console.warn('Real API login failed, attempting local fallback...', err.message);
    }

    // 2. Local Fallback Validation (offline trial mode)
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const now = new Date();

    if (!user) {
      triggerNotification('failed_login', 'Failed Login Attempt', `Unrecognized email login attempt: ${email}`);
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.status === 'inactive') {
      return { success: false, error: 'This user account has been deactivated. Please contact your system administrator.' };
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > now) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - now.getTime()) / 60000);
      return { success: false, error: `Account locked due to multiple failed attempts. Try again in ${minutesLeft} minutes, or contact an administrator.` };
    }

    const hashedInput = await hashPassword(password);
    if (user.passwordHash !== hashedInput) {
      const attempts = (user.failedAttempts || 0) + 1;
      const updatedUser = { ...user, failedAttempts: attempts };
      
      if (attempts >= 5) {
        updatedUser.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        updatedUser.failedAttempts = 0;
        triggerNotification('failed_login', 'Account Locked', `User account ${user.email} has been locked due to 5 consecutive failed login attempts.`);
      }

      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      return { success: false, error: 'Invalid email or password.' };
    }

    // Login Succeeded
    const jwtToken = generateJWT(user);
    safeSetItem('enterprise_jwt_token', jwtToken);
    if (rememberMe) {
      safeSetItem('enterprise_remember_email', email);
    } else {
      safeRemoveItem('enterprise_remember_email');
    }

    setCurrentUser(user);
    return { success: true };
  };

  // Logout (Section 1 & 6)
  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Backend API logout offline', err);
    }
    setCurrentUser(null);
    safeRemoveItem('enterprise_jwt_token');
    safeRemoveItem('enterprise_refresh_token');
    safeRemoveItem('enterprise_current_user');
  };

  // Change Password (Section 1 & 8)
  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'No active session.' };

    const user = users.find(u => u.id === currentUser.id);
    if (!user) return { success: false, error: 'User not found.' };

    const oldHashed = await hashPassword(oldPassword);
    if (user.passwordHash !== oldHashed) {
      return { success: false, error: 'Incorrect old password.' };
    }

    const policyCheck = validatePasswordPolicy(newPassword);
    if (!policyCheck.valid) {
      return { success: false, error: policyCheck.error };
    }

    const newHashed = await hashPassword(newPassword);
    const updatedUser = { ...user, passwordHash: newHashed };
    
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    
    triggerNotification('password_changed', 'Password Changed', `Your account password has been changed successfully.`);
    logAudit('Change Password', `Password updated for user ${user.name}`);

    return { success: true };
  };

  // Forgot Password (Section 1)
  const forgotPassword = (email: string): { success: boolean; error?: string } => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'Email address not found.' };

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    safeSetItem(`reset_${email}`, JSON.stringify({ code: resetCode, expiry: Date.now() + 10 * 60 * 1000 }));
    
    triggerNotification('password_changed', 'Password Reset Requested', `A password reset code (${resetCode}) has been generated for ${email}.`);
    logAudit('Password Reset Requested', `Reset code generated for email ${email}`);

    return { success: true };
  };

  // Reset Password (Section 1)
  const resetPasswordByToken = async (email: string, code: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'User not found.' };

    const rawReset = safeGetItem(`reset_${email}`);
    if (!rawReset) return { success: false, error: 'No reset request found for this email.' };

    const resetData = JSON.parse(rawReset);
    if (resetData.code !== code) {
      return { success: false, error: 'Invalid reset code.' };
    }
    if (Date.now() > resetData.expiry) {
      return { success: false, error: 'Reset code expired. Please request a new one.' };
    }

    const policyCheck = validatePasswordPolicy(newPass);
    if (!policyCheck.valid) {
      return { success: false, error: policyCheck.error };
    }

    const newHashed = await hashPassword(newPass);
    setUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, passwordHash: newHashed, failedAttempts: 0, lockedUntil: undefined } : u));
    safeRemoveItem(`reset_${email}`);

    triggerNotification('password_changed', 'Password Reset Succeeded', `Account password reset successfully for ${email}`);
    logAudit('Password Reset', `Password reset successful for email ${email}`);

    return { success: true };
  };

  // Add User (Section 2)
  const addUser = async (userData: Omit<UserProfile, 'id' | 'createdAt'>, passwordRaw: string): Promise<{ success: boolean; error?: string }> => {
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      return { success: false, error: 'User with this email already exists.' };
    }

    const policyCheck = validatePasswordPolicy(passwordRaw);
    if (!policyCheck.valid) {
      return { success: false, error: policyCheck.error };
    }

    const passHash = await hashPassword(passwordRaw);
    const newUser: UserProfile = {
      ...userData,
      id: 'u_' + makeId(),
      createdAt: new Date().toISOString(),
      passwordHash: passHash,
      status: 'active'
    };

    setUsers(prev => [...prev, newUser]);
    triggerNotification('user_created', 'New User Created', `User ${newUser.name} has been added as a ${(newUser.role || '').toUpperCase()}.`);
    logAudit('Create User', `Created user ${newUser.name} with role ${newUser.role}`);
    return { success: true };
  };

  // Update User (Section 2)
  const updateUser = (id: string, updated: Partial<UserProfile>) => {
    const oldUser = users.find(u => u.id === id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    
    if (oldUser) {
      logAudit(
        'Update User', 
        `Updated user details for ${oldUser.name}`,
        JSON.stringify({ name: oldUser.name, role: oldUser.role, status: oldUser.status, branch: oldUser.branch }),
        JSON.stringify({ name: updated.name || oldUser.name, role: updated.role || oldUser.role, status: updated.status || oldUser.status, branch: updated.branch || oldUser.branch })
      );
    }
  };

  // Deactivate User (Section 2)
  const deactivateUser = (id: string) => {
    updateUser(id, { status: 'inactive' });
    triggerNotification('user_created', 'User Account Deactivated', `User account deactivated.`);
  };

  // Delete User (Section 2)
  const deleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    if (target) {
      setUsers(prev => prev.filter(u => u.id !== id));
      logAudit('Delete User', `Deleted user account ${target.name} (${target.email})`);
    }
  };

  // Reset User Password by Admin (Section 2)
  const resetUserPasswordAdmin = async (userId: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    const policyCheck = validatePasswordPolicy(newPass);
    if (!policyCheck.valid) {
      return { success: false, error: policyCheck.error };
    }

    const passHash = await hashPassword(newPass);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, passwordHash: passHash, failedAttempts: 0, lockedUntil: undefined, status: 'active' } : u));
    
    const target = users.find(u => u.id === userId);
    if (target) {
      triggerNotification('password_changed', 'User Password Reset by Admin', `Password for user ${target.name} has been reset by administrator.`);
      logAudit('Admin Password Reset', `Administrator reset the password for ${target.name}`);
    }
    return { success: true };
  };

  // Role Configurations (Section 3)
  const addCustomRole = (role: RoleConfig) => {
    setRoles(prev => [...prev, role]);
    logAudit('Create Role', `Created custom role ${role.label}`);
  };

  const updateCustomRole = (name: string, permissions: UserPermissions) => {
    setRoles(prev => prev.map(r => r.name === name ? { ...r, permissions } : r));
    logAudit('Update Role', `Updated permissions for custom role ${name}`);
  };

  const deleteCustomRole = (name: string) => {
    setRoles(prev => prev.filter(r => r.name !== name));
    logAudit('Delete Role', `Deleted custom role ${name}`);
  };

  // Permissions Validation Helper (Section 4)
  const hasPermission = (module: keyof UserPermissions, action: string): boolean => {
    if (!currentUser) return false;

    // Owner role bypass
    if (currentUser.role === 'owner') return true;

    const userRole = roles.find(r => r.name === currentUser.role);
    if (!userRole) return false;

    if (userRole.permissions.settings.fullControl) return true;

    const modulePerms = (userRole.permissions as any)[module];
    if (!modulePerms) return false;

    if (typeof modulePerms === 'object') {
      return !!modulePerms[action];
    }
    return false;
  };

  // Notifications Managers (Section 10)
  const markNotificationRead = (id: string) => {
    setSecurityNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setSecurityNotifications([]);
  };

  const triggerNotification = (type: SecurityNotification['type'], title: string, message: string) => {
    const newNotif: SecurityNotification = {
      id: 'notif_' + makeId(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setSecurityNotifications(prev => [newNotif, ...prev]);
  };

  // Secure API Simulator (Section 12)
  const secureApiCall = async <T,>(actionName: string, reqPerm: { module: keyof UserPermissions; action: string }, payload: any, handler: () => T): Promise<{ success: boolean; data?: T; error?: string }> => {
    const token = safeGetItem('enterprise_jwt_token');
    if (!token) {
      return { success: false, error: '401 Unauthorized: JWT token missing.' };
    }

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const user = users.find(u => u.id === decoded.sub);
      if (!user || user.status !== 'active') {
        return { success: false, error: '401 Unauthorized: User account inactive or invalid.' };
      }

      const isPermitted = hasPermission(reqPerm.module, reqPerm.action);
      if (!isPermitted) {
        logAudit('API Unauthorized Attempt', `Unauthorized attempt by user ${user.name} on ${actionName}`);
        return { success: false, error: '403 Forbidden: Insufficient permissions.' };
      }

      if (!actionName) {
        return { success: false, error: '400 Bad Request: Invalid endpoint name.' };
      }

      const result = handler();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: '500 Internal Server Error: Failed to complete secure API call.' };
    }
  };

  // 3. Selection Actions
  const selectBusiness = useCallback((bizId: string) => {
    const biz = BUSINESSES.find(b => b.id === bizId);
    if (biz) {
      setCurrentBusinessState(biz);
      setCurrentBillTypeState(null);
      setActiveTab('billing');
    }
  }, []);

  const setBillType = (type: 'normal' | 'contractor' | null) => {
    setCurrentBillTypeState(type);
    if (type) {
      setActiveTab('billing');
    }
  };

  const resetToWelcome = () => {
    setCurrentBusinessState(null);
    setCurrentBillTypeState(null);
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setBills([]);
    setPurchases([]);
    setSalesReturns([]);
    setExpenses([]);
    setStockMovements([]);
    setPayments([]);
    setAuditLogs([]);
    setDraftBill(null);
  };

  // Helper: Bill Number Generator
  const generateNextBillNo = (bizId: string, currentBillsList: Bill[]) => {
    const prefix = businessDetails.invoicePrefix || (bizId === 'sivasakthi_elec' ? 'SE' : 'MP');
    
    // Filter active/non-draft bills
    const savedBills = currentBillsList.filter(b => b.shopId === bizId);
    if (savedBills.length === 0) {
      setNextBillNumber(`${prefix}-000001`);
      return;
    }

    // Sort bills to find the highest number
    const numbers = savedBills.map(b => {
      const parts = b.billNumber.split('-');
      const numStr = parts[parts.length - 1];
      const parsed = parseInt(numStr, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

    const highest = Math.max(...numbers, 0);
    const nextNum = (highest + 1).toString().padStart(6, '0');
    setNextBillNumber(`${prefix}-${nextNum}`);
  };

  // 4. Products Master Actions
  const addProduct = (prodData: Omit<Product, 'id' | 'shopId'>): Product => {
    if (!currentBusiness) throw new Error('No business selected');

    // Prevent duplicate product creation
    const existing = products.find(p => 
      p.shopId === currentBusiness.id && 
      (p.productCode?.trim().toLowerCase() === prodData.productCode?.trim().toLowerCase() || 
       p.name.trim().toLowerCase() === prodData.name.trim().toLowerCase())
    );
    if (existing) {
      console.warn('Product already exists, skipping duplicate creation:', prodData.productCode || prodData.name);
      return existing;
    }

    const tempId = 'p_' + makeId();
    const newProd: Product = {
      ...prodData,
      id: tempId,
      shopId: currentBusiness.id,
    };
    setProducts(prev => [newProd, ...prev]);
    logAudit('Add Product', `Created product ${newProd.name} (Code: ${newProd.productCode})`);

    // Background server replication
    api.products.create({ ...prodData, shopId: currentBusiness.id })
      .then(saved => {
        setProducts(prev => prev.map(p => p.id === tempId ? { ...saved, id: saved.id || (saved as any)._id?.toString() || tempId } : p));
      })
      .catch(err => {
        console.warn('Failed to save product to server database', err);
      });

    return newProd;
  };

  const updateProduct = async (id: string, updated: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    logAudit('Update Product', `Updated product ID: ${id}`);

    try {
      await api.products.update(id, updated);
    } catch (err) {
      console.warn('Failed to update product on server database', err);
    }
  };

  const deleteProduct = async (id: string) => {
    // Check if used in any saved bill or purchase
    const isUsed = bills.some(b => b.items.some(i => i.productId === id)) || 
                   purchases.some(p => p.items.some(i => i.productId === id));
    
    if (isUsed) {
      // Deactivate instead
      updateProduct(id, { isActive: false });
      logAudit('Deactivate Product', `Deactivated product ID: ${id} as it has transaction history.`);
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
      logAudit('Delete Product', `Deleted product ID: ${id}`);
      try {
        await api.products.delete(id);
      } catch (err) {
        console.warn('Failed to delete product from server database', err);
      }
    }
  };

  const adjustStock = async (productId: string, adjustQty: number, reason: string) => {
    if (!currentBusiness) return;
    const target = products.find(p => p.id === productId);
    if (!target) return;

    const prevStock = target.stock;
    const nextStock = Math.max(0, prevStock + adjustQty);

    updateProduct(productId, { stock: nextStock });

    // Automatically sync to default 'Main Store' warehouse stock as well
    setWarehouseStocks(prevWS => prevWS.map(ws => {
      if (ws.productId === productId && ws.warehouseId === 'wh_main' && ws.shopId === currentBusiness.id) {
        const nextWSStock = Math.max(0, ws.currentStock + adjustQty);
        return { ...ws, currentStock: nextWSStock, availableStock: nextWSStock - ws.reservedStock };
      }
      return ws;
    }));

    const movement: StockMovement = {
      id: 'sm_' + makeId(),
      productId,
      shopId: currentBusiness.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      quantity: adjustQty,
      type: 'adjustment',
      reason,
      refId: 'Manual',
      stockBefore: prevStock,
      stockAfter: nextStock,
      user: currentUser?.name || 'Administrator'
    };

    setStockMovements(prev => [movement, ...prev]);
    logAudit('Manual Stock Adjustment', `Adjusted stock of ${target.name} by ${adjustQty > 0 ? '+' : ''}${adjustQty}. Reason: ${reason}`);

    try {
      await api.warehouses.adjust({
        productId,
        shopId: currentBusiness.id,
        warehouseId: 'wh_main',
        adjustmentType: adjustQty >= 0 ? 'addition' : 'deduction',
        quantity: Math.abs(adjustQty),
        reason,
        user: currentUser?.name || 'Administrator'
      });
    } catch (err) {
      console.warn('Failed to sync stock adjustment to server database', err);
    }
  };

  // 5. Customers Master Actions
  const addCustomer = (custData: Omit<Customer, 'id' | 'shopId' | 'outstandingAmount'>): Customer => {
    const normalizedNewName = (custData.name || '').trim().toLowerCase();
    const existing = customers.find(c => {
      // Match by GSTIN if available
      if (custData.gstNumber && custData.gstNumber.trim() && c.gstNumber && c.gstNumber.trim().toLowerCase() === custData.gstNumber.trim().toLowerCase()) {
        return true;
      }
      // Match by Mobile if available, not empty, and not the walkin mobile
      const hasValidNewMobile = custData.mobile && custData.mobile.trim() && custData.mobile !== '9999999999';
      const hasValidOldMobile = c.mobile && c.mobile.trim() && c.mobile !== '9999999999';
      if (hasValidNewMobile && hasValidOldMobile && c.mobile.trim() === custData.mobile.trim()) {
        return true;
      }
      // Match by Name + Mobile/GSTIN if matches, or simply Name if no other info is available/differs
      if (c.name.trim().toLowerCase() === normalizedNewName) {
        if (!hasValidNewMobile || !hasValidOldMobile || c.mobile.trim() === custData.mobile.trim()) {
          return true;
        }
      }
      return false;
    });
    if (existing) return existing;

    const tempId = 'c_' + makeId();
    const newCust: Customer = {
      ...custData,
      id: tempId,
      shopId: currentBusiness?.id || 'all',
      outstandingAmount: 0
    };
    setCustomers(prev => [newCust, ...prev]);
    logAudit('Add Customer', `Created customer ${newCust.name} (Mobile: ${newCust.mobile})`);

    api.customers.create({ ...custData, shopId: currentBusiness?.id || 'all' })
      .then(saved => {
        setCustomers(prev => prev.map(c => c.id === tempId ? { ...saved, id: saved.id || (saved as any)._id?.toString() || tempId } : c));
      })
      .catch(err => {
        console.warn('Failed to save customer to server database', err);
      });

    return newCust;
  };

  const updateCustomer = async (id: string, updated: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    logAudit('Update Customer', `Updated customer ID: ${id}`);

    try {
      await api.customers.update(id, updated);
    } catch (err) {
      console.warn('Failed to update customer on server database', err);
    }
  };

  const deleteCustomer = (id: string): boolean => {
    const cust = customers.find(c => c.id === id);
    if (!cust) return false;
    if (cust.outstandingAmount !== 0) {
      return false; // Prevent deleting customer with balance
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
    logAudit('Delete Customer', `Deleted customer ID: ${id}`);

    api.customers.delete(id).catch(err => {
      console.warn('Failed to delete customer from server database', err);
    });

    return true;
  };

  // 6. Suppliers Master Actions
  const addSupplier = (suppData: Omit<Supplier, 'id' | 'shopId' | 'outstandingAmount'>): Supplier => {
    const tempId = 's_' + makeId();
    const newSupp: Supplier = {
      ...suppData,
      id: tempId,
      shopId: currentBusiness?.id || 'all',
      outstandingAmount: 0
    };
    setSuppliers(prev => [newSupp, ...prev]);
    logAudit('Add Supplier', `Created supplier ${newSupp.name}`);

    api.suppliers.create({ ...suppData, shopId: currentBusiness?.id || 'all' })
      .then(saved => {
        setSuppliers(prev => prev.map(s => s.id === tempId ? { ...saved, id: saved.id || (saved as any)._id?.toString() || tempId } : s));
      })
      .catch(err => {
        console.warn('Failed to save supplier to server database', err);
      });

    return newSupp;
  };

  const updateSupplier = async (id: string, updated: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    logAudit('Update Supplier', `Updated supplier ID: ${id}`);

    try {
      await api.suppliers.update(id, updated);
    } catch (err) {
      console.warn('Failed to update supplier on server database', err);
    }
  };

  // 7. POS Billing Sales Logic
  const createBill = (billData: Omit<Bill, 'id' | 'shopId' | 'billNumber' | 'createdAt' | 'time'>): Bill => {
    if (!currentBusiness) throw new Error('No business selected');

    const bizId = currentBusiness.id;
    const docType = billData.docType || 'invoice';
    const isHold = billData.status === 'on_hold';

    // Compute independent document serial numbers if not standard invoice
    let finalBillNo = nextBillNumber;
    if (docType !== 'invoice') {
      const prefix = docType === 'quotation' ? 'QT' :
                     docType === 'challan' ? 'DC' :
                     docType === 'proforma' ? 'PI' :
                     docType === 'non_gst' ? 'CSH' :
                     docType === 'sales_return' ? 'SR' :
                     docType === 'purchase_return' ? 'PR' :
                     docType === 'credit_note' ? 'CN' :
                     docType === 'debit_note' ? 'DN' : 'DOC';
      
      const count = bills.filter(b => b.shopId === bizId && b.docType === docType).length + 1;
      finalBillNo = `${prefix}-${count.toString().padStart(6, '0')}`;
    }

    const completeBill: Bill = {
      ...billData,
      id: 'b_' + makeId(),
      shopId: bizId,
      billNumber: finalBillNo,
      time: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString()
    };

    // Add to state
    setBills(prev => [completeBill, ...prev]);

    // Check if inventory updates & accounting apply to this document type
    const skipInventoryAndAccounting = 
      isHold || 
      docType === 'quotation' || 
      docType === 'proforma' || 
      docType === 'challan';

    if (!skipInventoryAndAccounting) {
      // 1. UPDATE INVENTORY & Record Stock Movement
      const updatedProds = products.map(prod => {
        const billItem = completeBill.items.find(item => item.productId === prod.id);
        if (billItem) {
          const prevStock = prod.stock;
          let newStock = prevStock;
          let qtyChange = 0;
          let moveType: StockMovement['type'] = 'sale';
          let moveReason = `Sales Invoice ${finalBillNo}`;

          if (docType === 'sales_return' || docType === 'credit_note') {
            // Returns or credit notes add stock back
            qtyChange = billItem.quantity;
            newStock = prevStock + qtyChange;
            moveType = 'sales_return';
            moveReason = `${docType === 'credit_note' ? 'Credit Note' : 'Sales Return'} ${finalBillNo}`;
          } else {
            // Normal sales or debit notes deduct stock
            qtyChange = -billItem.quantity;
            newStock = Math.max(0, prevStock + qtyChange);
            moveType = docType === 'purchase_return' ? 'purchase_return' : 'sale';
            moveReason = `${docType === 'debit_note' ? 'Debit Note' : 'Sales Invoice'} ${finalBillNo}`;
          }

          // Record stock movement
          const movement: StockMovement = {
            id: 'sm_' + makeId(),
            productId: prod.id,
            shopId: bizId,
            date: completeBill.date,
            time: completeBill.time,
            quantity: qtyChange,
            type: moveType,
            reason: moveReason,
            refId: completeBill.id,
            stockBefore: prevStock,
            stockAfter: newStock,
            user: 'Administrator'
          };
          
          setStockMovements(prev => [movement, ...prev]);
          const nextProd = { ...prod, stock: newStock };
          if (billItem.rate && billItem.rate > 0) {
            nextProd.latestSellingPrice = billItem.rate;
          }
          return nextProd;
        }
        return prod;
      });
      setProducts(updatedProds);

      // 2. UPDATE CUSTOMER OUTSTANDING & Record Payments
      if (completeBill.customerId !== 'c_walkin') {
        setCustomers(prev => prev.map(cust => {
          if (cust.id === completeBill.customerId) {
            const prevOutstanding = cust.outstandingAmount;
            let newOutstanding = prevOutstanding;

            if (docType === 'sales_return' || docType === 'credit_note') {
              // Return credits reduce customer outstanding
              newOutstanding = prevOutstanding - completeBill.grandTotal;
            } else if (docType === 'debit_note') {
              // Debit notes increase customer outstanding
              newOutstanding = prevOutstanding + completeBill.grandTotal;
            } else {
              // Standard invoice increases customer outstanding by unpaid balance
              newOutstanding = prevOutstanding + completeBill.balanceAmount;
            }

            return { ...cust, outstandingAmount: newOutstanding };
          }
          return cust;
        }));

        // Record Ledger payment transaction if payment occurred
        if (completeBill.paidAmount > 0) {
          const isRefund = docType === 'sales_return' || docType === 'credit_note';
          const receiptTx: PaymentTransaction = {
            id: 'pay_' + makeId(),
            shopId: bizId,
            date: completeBill.date,
            partyId: completeBill.customerId,
            partyName: completeBill.customerName,
            partyType: 'customer',
            amount: completeBill.paidAmount,
            paymentMode: completeBill.paymentMode === 'split' ? 'split' : completeBill.paymentMode,
            type: isRefund ? 'payment' : 'receipt', // Refund is cash outgoing
            refId: completeBill.id,
            notes: isRefund 
              ? `Refund against ${docType === 'credit_note' ? 'Credit Note' : 'Return Slip'} ${finalBillNo}`
              : `Paid against Bill ${finalBillNo}`
          };
          setPayments(prev => [receiptTx, ...prev]);
        }
      }
    }

    const docLabel = docType === 'quotation' ? 'Quotation' :
                     docType === 'challan' ? 'Delivery Challan' :
                     docType === 'proforma' ? 'Proforma Invoice' :
                     docType === 'sales_return' ? 'Sales Return' :
                     docType === 'credit_note' ? 'Credit Note' :
                     docType === 'debit_note' ? 'Debit Note' : 'Invoice';

    logAudit('Create Document', `Created ${docLabel} ${finalBillNo} for ₹${(completeBill.grandTotal ?? 0).toFixed(2)}`);
    
    // Non-blocking Server Sync
    api.invoices.create(completeBill)
      .then(async saved => {
        setBills(prev => prev.map(b => b.id === completeBill.id ? { ...saved, id: saved.id || (saved as any)._id?.toString() || completeBill.id } : b));
        
        // Force synchronization of related collections (stock levels, latestSellingPrice, ledgers, etc.) to maintain absolute correctness
        if (currentBusiness) {
          const bizId = currentBusiness.id;
          const [dbProducts, dbCustomers, dbInvoices, dbPayments] = await Promise.all([
            api.products.list(bizId).catch(() => []),
            api.customers.list(bizId).catch(() => []),
            api.invoices.list(bizId).catch(() => []),
            api.payments.list(bizId).catch(() => [])
          ]);

          const normalize = (arr: any[]) => {
            return arr.map(item => ({
              ...item,
              id: item.id || item._id?.toString()
            }));
          };

          if (dbProducts && dbProducts.length > 0) setProducts(normalize(dbProducts));
          if (dbCustomers && dbCustomers.length > 0) setCustomers(normalize(dbCustomers));
          if (dbInvoices && dbInvoices.length > 0) setBills(normalize(dbInvoices));
          if (dbPayments && dbPayments.length > 0) setPayments(normalize(dbPayments));
        }
      })
      .catch(err => {
        console.warn('Failed to persist invoice on server database', err);
      });

    // Clear draft
    saveDraft(null);

    return completeBill;
  };

  const updateBill = async (id: string, updatedData: Partial<Bill>): Promise<Bill> => {
    // 1. Optimistic Local State Update
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } as Bill : b));

    const localBill = bills.find(b => b.id === id);
    const dbId = localBill?._id || updatedData._id || id;

    try {
      // 2. Persist to server
      const response = await api.invoices.update(dbId, {
        ...updatedData,
        _id: localBill?._id || updatedData._id
      });
      
      // 3. Update state with final server values (such as serial billNumbers generated, etc)
      const normalizedBill = {
        ...response,
        id: response.id || (response as any)._id?.toString() || id
      };
      setBills(prev => prev.map(b => b.id === id ? normalizedBill : b));

      // 4. Force synchronization of related collections (stock levels, ledgers, etc) to maintain absolute correctness
      if (currentBusiness) {
        const bizId = currentBusiness.id;
        const [dbProducts, dbCustomers, dbInvoices, dbPayments] = await Promise.all([
          api.products.list(bizId).catch(() => []),
          api.customers.list(bizId).catch(() => []),
          api.invoices.list(bizId).catch(() => []),
          api.payments.list(bizId).catch(() => [])
        ]);

        const normalize = <T extends { id?: string; _id?: any }>(arr: T[]): T[] => {
          if (!arr || !Array.isArray(arr)) return [];
          return arr.filter(Boolean).map(item => ({
            ...item,
            id: item.id || (item._id ? item._id.toString() : '')
          }));
        };

        if (dbProducts && dbProducts.length > 0) setProducts(normalize(dbProducts));
        if (dbCustomers && dbCustomers.length > 0) setCustomers(normalize(dbCustomers));
        if (dbInvoices && dbInvoices.length > 0) setBills(normalize(dbInvoices));
        if (dbPayments && dbPayments.length > 0) setPayments(normalize(dbPayments));
      }

      return normalizedBill;
    } catch (err) {
      console.error('Failed to update invoice on server', err);
      // Fallback to local optimistic bill for offline mode
      return { ...localBill, ...updatedData } as Bill;
    }
  };

  const cancelBill = (id: string, reason: string) => {
    const targetBill = bills.find(b => b.id === id);
    if (!targetBill) return;

    // Check if already cancelled
    if (targetBill.status === 'cancelled') return;

    // 1. UPDATE BILL STATUS
    setBills(prev => prev.map(b => b.id === id ? { 
      ...b, 
      status: 'cancelled', 
      cancelReason: reason,
      cancelledAt: new Date().toISOString()
    } : b));

    // 2. RESTORE INVENTORY & Record Stock Movements
    const updatedProds = products.map(prod => {
      const billItem = targetBill.items.find(item => item.productId === prod.id);
      if (billItem) {
        const prevStock = prod.stock;
        const newStock = prod.stock + billItem.quantity;

        // Record stock movement (positive stock restoral)
        const movement: StockMovement = {
          id: 'sm_' + makeId(),
          productId: prod.id,
          shopId: targetBill.shopId,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString(),
          quantity: billItem.quantity,
          type: 'sales_return',
          reason: `Cancelled Bill ${targetBill.billNumber}`,
          refId: targetBill.id,
          stockBefore: prevStock,
          stockAfter: newStock,
          user: currentUser?.name || 'Administrator'
        };

        setStockMovements(prev => [movement, ...prev]);
        return { ...prod, stock: newStock };
      }
      return prod;
    });
    setProducts(updatedProds);

    // 3. RESTORE CUSTOMER OUTSTANDING
    if (targetBill.customerId !== 'c_walkin') {
      const outstandingReduction = targetBill.balanceAmount;
      setCustomers(prev => prev.map(cust => {
        if (cust.id === targetBill.customerId) {
          return { 
            ...cust, 
            outstandingAmount: cust.outstandingAmount - outstandingReduction 
          };
        }
        return cust;
      }));

      // Cancel associated receipts (remove them or reverse them)
      setPayments(prev => prev.filter(p => !(p.refId === targetBill.id && p.type === 'receipt')));
    }

    logAudit('Cancel Bill', `Cancelled Invoice ${targetBill.billNumber}. Reason: ${reason}`);

    // Sync to backend
    api.invoices.cancel(targetBill._id || id, reason, currentUser?.name || 'Administrator')
      .catch(err => {
        console.warn('Failed to cancel invoice on server database', err);
      });
  };

  const deleteBill = (id: string) => {
    const targetBill = bills.find(b => b.id === id);
    if (!targetBill) return;

    // If not already cancelled, run restoration calculations
    if (targetBill.status !== 'cancelled') {
      cancelBill(id, 'System Deletion');
    }

    // Now remove from list
    setBills(prev => prev.filter(b => b.id !== id));
    logAudit('Delete Bill', `Permanently deleted Bill ${targetBill.billNumber} from logs.`);

    // Sync to backend
    api.invoices.delete(targetBill._id || id).catch(err => {
      console.warn('Failed to delete invoice from server database', err);
    });
  };

  // 8. Purchases
  const createPurchase = (pData: Omit<PurchaseBill, 'id' | 'shopId' | 'purchaseNumber' | 'createdAt'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;

    // Sequential purchase numbering
    const prefix = 'PUR';
    const num = (purchases.length + 1).toString().padStart(6, '0');
    const pNo = `${prefix}-${num}`;

    const completePurchase: PurchaseBill = {
      ...pData,
      id: 'pur_' + makeId(),
      shopId: bizId,
      purchaseNumber: pNo,
      createdAt: new Date().toISOString()
    };

    setPurchases(prev => [completePurchase, ...prev]);
    processPurchaseStockAndLedger(completePurchase);

    logAudit('Add Purchase', `Created Purchase Inward ${pNo} for ₹${(completePurchase.grandTotal ?? 0).toFixed(2)}`);

    api.purchases.create(completePurchase).catch(err => {
      console.warn('Failed to save purchase on server database', err);
    });
  };

  const updatePurchase = (id: string, pData: Omit<PurchaseBill, 'id' | 'shopId' | 'purchaseNumber' | 'createdAt'>) => {
    if (!currentBusiness) return false;
    const existing = purchases.find(p => p.id === id);
    if (!existing) return false;
    const bizId = currentBusiness.id;

    // Reverse old stock movements
    reversePurchaseStock(existing);

    const updatedPurchase: PurchaseBill = {
      ...existing,
      ...pData,
      items: pData.items,
      subtotal: pData.subtotal,
      gstAmount: pData.gstAmount,
      grandTotal: pData.grandTotal,
      paidAmount: pData.paidAmount,
      balanceAmount: pData.balanceAmount,
      paymentMode: pData.paymentMode,
      supplierInvoiceNumber: pData.supplierInvoiceNumber,
      discountPercent: pData.discountPercent,
      discountAmount: pData.discountAmount,
      transportCharges: pData.transportCharges,
      loadingCharges: pData.loadingCharges,
      packingCharges: pData.packingCharges,
      otherCharges: pData.otherCharges,
      roundOff: pData.roundOff,
      notes: pData.notes
    };

    setPurchases(prev => prev.map(p => p.id === id ? updatedPurchase : p));
    processPurchaseStockAndLedger(updatedPurchase, true);

    if (updatedPurchase.balanceAmount !== existing.balanceAmount) {
      const diff = updatedPurchase.balanceAmount - existing.balanceAmount;
      setSuppliers(prev => prev.map(supp => {
        if (supp.id === updatedPurchase.supplierId) {
          return { ...supp, outstandingAmount: supp.outstandingAmount + diff };
        }
        return supp;
      }));
    }

    if (updatedPurchase.paidAmount !== existing.paidAmount) {
      const paidDiff = updatedPurchase.paidAmount - existing.paidAmount;
      if (paidDiff !== 0) {
        const paymentTx: PaymentTransaction = {
          id: 'pay_' + makeId(),
          shopId: bizId,
          date: updatedPurchase.date,
          partyId: updatedPurchase.supplierId,
          partyName: updatedPurchase.supplierName,
          partyType: 'supplier',
          amount: Math.abs(paidDiff),
          paymentMode: updatedPurchase.paymentMode,
          type: paidDiff > 0 ? 'payment' : 'receipt',
          refId: updatedPurchase.id,
          notes: paidDiff > 0 ? `Additional payment on Purchase Bill ${updatedPurchase.purchaseNumber}` : `Refund adjustment on Purchase Bill ${updatedPurchase.purchaseNumber}`
        };
        setPayments(prev => [paymentTx, ...prev]);
      }
    }
    logAudit('Edit Purchase', `Updated Purchase ${updatedPurchase.purchaseNumber} from ₹${existing.grandTotal.toFixed(2)} to ₹${updatedPurchase.grandTotal.toFixed(2)}`);
    return true;
  };

  const deletePurchase = (id: string) => {
    const existing = purchases.find(p => p.id === id);
    if (!existing) return false;

    reversePurchaseStock(existing);
    setPurchases(prev => prev.filter(p => p.id !== id));
    logAudit('Delete Purchase', `Deleted Purchase ${existing.purchaseNumber} and reversed inventory for ${existing.items.length} products.`);
    return true;
  };

  const processPurchaseStockAndLedger = (purchase: PurchaseBill, isUpdate = false) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;

    setProducts(prev => prev.map(prod => {
      const item = purchase.items.find(i => i.productId === prod.id);
      if (!item) return prod;

      const prevStock = prod.stock;
      const newStock = isUpdate ? Math.max(0, prevStock + item.quantity) : prevStock + item.quantity;

      const currentAvg = prod.avgPurchaseCost || prod.purchasePrice || 0;
      const currentStockVal = Math.max(0, prevStock) * currentAvg;
      const nextStockVal = item.quantity * item.purchaseRate;
      const totalQty = Math.max(0, prevStock) + item.quantity;
      const computedAvg = totalQty > 0 ? (currentStockVal + nextStockVal) / totalQty : item.purchaseRate;

      return {
        ...prod,
        stock: newStock,
        purchasePrice: item.purchaseRate,
        latestPurchaseCost: item.purchaseRate,
        avgPurchaseCost: Number(computedAvg.toFixed(2)),
        lastPurchaseDate: purchase.date,
        preferredSupplierId: purchase.supplierId,
        preferredSupplierName: purchase.supplierName
      };
    }));

    purchase.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const prevStock = prod ? prod.stock : 0;
      const newStock = prevStock + item.quantity;
      const movement: StockMovement = {
        id: 'sm_' + makeId(),
        productId: item.productId,
        shopId: bizId,
        date: purchase.date,
        time: new Date().toLocaleTimeString(),
        quantity: item.quantity,
        type: 'purchase',
        reason: `Purchase Bill ${purchase.purchaseNumber}`,
        refId: purchase.id,
        stockBefore: prevStock,
        stockAfter: newStock,
        user: 'Administrator'
      };
      setStockMovements(prev => [movement, ...prev]);
    });
  };

  const reversePurchaseStock = (purchase: PurchaseBill) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;

    setProducts(prev => prev.map(prod => {
      const item = purchase.items.find(i => i.productId === prod.id);
      if (!item) return prod;
      return { ...prod, stock: Math.max(0, prod.stock - item.quantity) };
    }));

    purchase.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const prevStock = prod ? prod.stock : 0;
      const newStock = Math.max(0, prevStock - item.quantity);
      const movement: StockMovement = {
        id: 'sm_' + makeId(),
        productId: item.productId,
        shopId: bizId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        quantity: -item.quantity,
        type: 'adjustment',
        reason: `Reversed Purchase ${purchase.purchaseNumber}`,
        refId: purchase.id,
        stockBefore: prevStock,
        stockAfter: newStock,
        user: 'Administrator'
      };
      setStockMovements(prev => [movement, ...prev]);
    });
  };

  // Purchase Management Helpers
  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'shopId' | 'poNumber' | 'createdAt'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    const poNum = `PO-${(purchaseOrders.length + 1).toString().padStart(6, '0')}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: 'po_' + makeId(),
      shopId: bizId,
      poNumber: poNum,
      createdAt: new Date().toISOString()
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    logAudit('Add PO', `Created Purchase Order ${poNum} for supplier ${newPO.supplierName}`);
  };

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status } : po));
    logAudit('Update PO Status', `Updated PO ID ${id} status to ${status}`);
  };

  const updatePurchaseOrderReceivedQty = (id: string, productQuantities: Record<string, number>) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id) {
        const updatedItems = po.items.map(item => {
          const addQty = productQuantities[item.productId] || 0;
          const nextReceived = item.receivedQuantity + addQty;
          return { ...item, receivedQuantity: nextReceived };
        });
        
        // Determine status based on quantities
        const allCompleted = updatedItems.every(it => it.receivedQuantity >= it.quantity);
        const partiallyReceived = updatedItems.some(it => it.receivedQuantity > 0);
        let status = po.status;
        if (allCompleted) {
          status = 'completed';
        } else if (partiallyReceived) {
          status = 'partially_received';
        }

        return { ...po, items: updatedItems, status };
      }
      return po;
    }));
  };

  const createGRN = (grnData: Omit<GRN, 'id' | 'shopId' | 'grnNumber' | 'createdAt'>) => {
    if (!currentBusiness) return '';
    const bizId = currentBusiness.id;
    const grnId = 'grn_' + makeId();
    const grnNum = `GRN-${(grns.length + 1).toString().padStart(6, '0')}`;
    const newGRN: GRN = {
      ...grnData,
      id: grnId,
      shopId: bizId,
      grnNumber: grnNum,
      createdAt: new Date().toISOString()
    };
    setGrns(prev => [newGRN, ...prev]);
    logAudit('Add GRN', `Created Goods Receipt Note ${grnNum} for supplier ${newGRN.supplierName}`);
    return grnId;
  };

  const createPurchaseReturn = (prData: Omit<PurchaseReturn, 'id' | 'shopId' | 'returnNumber' | 'createdAt'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    const prId = 'pr_' + makeId();
    const prNum = `PR-${(purchaseReturns.length + 1).toString().padStart(6, '0')}`;
    const newPR: PurchaseReturn = {
      ...prData,
      id: prId,
      shopId: bizId,
      returnNumber: prNum,
      createdAt: new Date().toISOString()
    };

    // 1. Reduce Stock and create stock movements
    const updatedProds = products.map(prod => {
      const prItem = newPR.items.find(item => item.productId === prod.id);
      if (prItem) {
        const prevStock = prod.stock;
        const newStock = Math.max(0, prod.stock - prItem.quantity);

        const movement: StockMovement = {
          id: 'sm_' + makeId(),
          productId: prod.id,
          shopId: bizId,
          date: newPR.date,
          time: new Date().toLocaleTimeString(),
          quantity: -prItem.quantity,
          type: 'purchase_return',
          reason: `Purchase Return ${prNum} against Invoice ${newPR.purchaseInvoiceNumber}`,
          refId: prId,
          stockBefore: prevStock,
          stockAfter: newStock,
          user: 'Administrator'
        };
        setStockMovements(prev => [movement, ...prev]);
        return { ...prod, stock: newStock };
      }
      return prod;
    });
    setProducts(updatedProds);

    // 2. Reduce Supplier Outstanding
    setSuppliers(prev => prev.map(supp => {
      if (supp.id === newPR.supplierId) {
        const nextOutstanding = Math.max(0, supp.outstandingAmount - newPR.grandTotal);
        return { ...supp, outstandingAmount: nextOutstanding };
      }
      return supp;
    }));

    // 3. Auto-generate Supplier Credit Note
    const scnNum = `SCN-${(supplierCreditNotes.length + 1).toString().padStart(6, '0')}`;
    const newCreditNote: SupplierCreditNote = {
      id: 'scn_' + makeId(),
      shopId: bizId,
      creditNoteNumber: scnNum,
      supplierId: newPR.supplierId,
      supplierName: newPR.supplierName,
      purchaseReturnId: prId,
      purchaseReturnNumber: prNum,
      invoiceReference: newPR.purchaseInvoiceNumber,
      date: newPR.date,
      items: newPR.items.map(it => ({
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        unit: it.unit,
        rate: it.purchaseRate,
        total: it.total
      })),
      amount: newPR.grandTotal,
      reason: newPR.reason,
      createdAt: new Date().toISOString()
    };
    
    setSupplierCreditNotes(prev => [newCreditNote, ...prev]);
    setPurchaseReturns(prev => [newPR, ...prev]);

    logAudit('Purchase Return', `Processed Purchase Return ${prNum} and generated Supplier Credit Note ${scnNum} for ₹${(newPR.grandTotal ?? 0).toFixed(2)}`);
  };

  const createSupplierDebitNote = (dnData: Omit<SupplierDebitNote, 'id' | 'shopId' | 'debitNoteNumber' | 'createdAt'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    const dnId = 'dn_' + makeId();
    const dnNum = `SDN-${(supplierDebitNotes.length + 1).toString().padStart(6, '0')}`;
    const newDN: SupplierDebitNote = {
      ...dnData,
      id: dnId,
      shopId: bizId,
      debitNoteNumber: dnNum,
      createdAt: new Date().toISOString()
    };

    // Update supplier outstanding: Debit Note debits supplier, which means we owe them less: outstanding goes down
    setSuppliers(prev => prev.map(supp => {
      if (supp.id === newDN.supplierId) {
        const nextOutstanding = Math.max(0, supp.outstandingAmount - newDN.amount);
        return { ...supp, outstandingAmount: nextOutstanding };
      }
      return supp;
    }));

    setSupplierDebitNotes(prev => [newDN, ...prev]);
    logAudit('Supplier Debit Note', `Generated Supplier Debit Note ${dnNum} for ₹${(newDN.amount ?? 0).toFixed(2)}`);
  };

  // 9. Sales Return
  const createSalesReturn = (srData: Omit<SalesReturn, 'id' | 'shopId' | 'returnNumber'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;

    const returnCount = salesReturns.filter(sr => sr.shopId === bizId).length + 1;
    const srNo = `SR-${returnCount.toString().padStart(6, '0')}`;
    
    // Generate Credit Note number if applicable
    let cnNo = undefined;
    if (srData.refundMode === 'credit_adjustment') {
      const cnCount = salesReturns.filter(sr => sr.shopId === bizId && sr.refundMode === 'credit_adjustment').length + 1;
      cnNo = `CN-${cnCount.toString().padStart(6, '0')}`;
    }

    const returnId = 'sr_' + makeId();
    const newReturn: SalesReturn = {
      ...srData,
      id: returnId,
      shopId: bizId,
      returnNumber: srNo,
      creditNoteNumber: cnNo,
      creditNoteAmount: srData.refundMode === 'credit_adjustment' ? Math.max(0, -(srData.differenceAmount || 0)) : undefined,
    };

    setSalesReturns(prev => [newReturn, ...prev]);

    // 1. INCREASE STOCK FOR RETURNED ITEMS & REDUCE STOCK FOR EXCHANGED ITEMS
    const updatedProds = products.map(prod => {
      const retItem = newReturn.items.find(item => item.productId === prod.id);
      const exchItem = newReturn.exchangeItems?.find(item => item.productId === prod.id);
      
      let finalStock = prod.stock;
      
      if (retItem) {
        const prevStock = finalStock;
        finalStock = finalStock + retItem.quantity;

        // Record stock movement (positive)
        const movement: StockMovement = {
          id: 'sm_' + makeId(),
          productId: prod.id,
          shopId: bizId,
          date: newReturn.date,
          time: new Date().toLocaleTimeString(),
          quantity: retItem.quantity,
          type: 'sales_return',
          reason: `Sales Return ${srNo} (Invoice: ${newReturn.originalBillNumber})`,
          refId: returnId,
          stockBefore: prevStock,
          stockAfter: finalStock,
          user: 'Administrator'
        };

        setStockMovements(prev => [movement, ...prev]);
      }
      
      if (exchItem) {
        const prevStock = finalStock;
        finalStock = Math.max(0, finalStock - exchItem.quantity);

        // Record stock movement (negative)
        const movement: StockMovement = {
          id: 'sm_' + makeId(),
          productId: prod.id,
          shopId: bizId,
          date: newReturn.date,
          time: new Date().toLocaleTimeString(),
          quantity: -exchItem.quantity,
          type: 'sale',
          reason: `Exchange Issue in Return ${srNo} (Invoice: ${newReturn.originalBillNumber})`,
          refId: returnId,
          stockBefore: prevStock,
          stockAfter: finalStock,
          user: 'Administrator'
        };

        setStockMovements(prev => [movement, ...prev]);
      }

      if (retItem || exchItem) {
        return { ...prod, stock: finalStock };
      }
      return prod;
    });
    setProducts(updatedProds);

    // 2. LEDGER ADJUSTMENTS
    if (newReturn.customerId !== 'c_walkin') {
      const diff = newReturn.differenceAmount || 0; // exchangeTotal - grandTotal

      // If refundMode is credit_adjustment, reduce outstanding by returned amount, and increase by exchange amount (net: add difference)
      if (newReturn.refundMode === 'credit_adjustment') {
        setCustomers(prev => prev.map(cust => {
          if (cust.id === newReturn.customerId) {
            const nextOutstanding = Math.max(0, cust.outstandingAmount + diff);
            return { 
              ...cust, 
              outstandingAmount: nextOutstanding 
            };
          }
          return cust;
        }));

        // Log a payment transaction for ledger tracking of the adjustment
        const tx: PaymentTransaction = {
          id: 'tx_' + makeId(),
          shopId: bizId,
          date: newReturn.date,
          partyId: newReturn.customerId,
          partyName: newReturn.customerName,
          partyType: 'customer',
          amount: Math.abs(diff),
          paymentMode: 'credit_adjustment',
          type: diff < 0 ? 'payment' : 'receipt', // payment is refund/reduction, receipt is charge/extra
          refId: returnId,
          notes: `Credit Ledger adjustment for Return ${srNo} (Invoice: ${newReturn.originalBillNumber})`
        };
        setPayments(prev => [tx, ...prev]);
      } else {
        // If they did a cash/UPI/etc refund or extra payment, outstanding is unchanged as the difference is settled immediately.
      }
    }

    // 3. RECORD CASH/UPI/CARD REFUNDS OR RECEIPT TRANSACTIONS
    const diffAmt = newReturn.differenceAmount || 0;
    const mode = newReturn.refundMode || 'no_refund';
    if (mode !== 'credit_adjustment' && mode !== 'no_refund') {
      if (diffAmt < 0) {
        // Refunded to customer
        const refundTx: PaymentTransaction = {
          id: 'tx_' + makeId(),
          shopId: bizId,
          date: newReturn.date,
          partyId: newReturn.customerId,
          partyName: newReturn.customerName,
          partyType: 'customer',
          amount: Math.abs(diffAmt),
          paymentMode: mode,
          type: 'payment', // payment goes out
          refId: returnId,
          notes: `Refund for Sales Return ${srNo} (Invoice: ${newReturn.originalBillNumber})`
        };
        setPayments(prev => [refundTx, ...prev]);
      } else if (diffAmt > 0) {
        // Customer paid us extra
        const receiveTx: PaymentTransaction = {
          id: 'tx_' + makeId(),
          shopId: bizId,
          date: newReturn.date,
          partyId: newReturn.customerId,
          partyName: newReturn.customerName,
          partyType: 'customer',
          amount: diffAmt,
          paymentMode: mode,
          type: 'receipt', // receipt comes in
          refId: returnId,
          notes: `Additional cash received for Exchange in Return ${srNo} (Invoice: ${newReturn.originalBillNumber})`
        };
        setPayments(prev => [receiveTx, ...prev]);
      }
    }

    logAudit('Sales Return', `Created Sales Return ${srNo} (CN: ${cnNo || 'N/A'}) for Invoice ${newReturn.originalBillNumber}. Net Refund: ₹${Math.abs(diffAmt).toFixed(2)} via ${mode}`);

    api.returns.create(newReturn).catch(err => {
      console.warn('Failed to save sales return on server database', err);
    });
  };

  // 10. Expenses
  const addExpense = (expData: Omit<Expense, 'id' | 'shopId'>) => {
    if (!currentBusiness) return;
    const tempId = 'exp_' + makeId();
    const newExp: Expense = {
      ...expData,
      id: tempId,
      shopId: currentBusiness.id
    };
    setExpenses(prev => [newExp, ...prev]);
    logAudit('Add Expense', `Recorded expense for ${newExp.category} of ₹${newExp.amount}`);

    api.expenses.create(newExp)
      .then(saved => {
        setExpenses(prev => prev.map(e => e.id === tempId ? { ...saved, id: saved.id || (saved as any)._id?.toString() || tempId } : e));
      })
      .catch(err => {
        console.warn('Failed to save expense on server database', err);
      });
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    logAudit('Delete Expense', `Deleted expense ID: ${id}`);

    api.expenses.delete(id).catch(err => {
      console.warn('Failed to delete expense from server database', err);
    });
  };

  // 11. Payments / Ledger Settlements
  const recordPayment = (txData: Omit<PaymentTransaction, 'id' | 'shopId'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;

    const newTx: PaymentTransaction = {
      ...txData,
      id: 'tx_' + makeId(),
      shopId: bizId
    };

    setPayments(prev => [newTx, ...prev]);

    // Update respective ledger outstanding
    if (newTx.partyType === 'customer') {
      setCustomers(prev => prev.map(cust => {
        if (cust.id === newTx.partyId) {
          // If customer pays us (receipt), they owe us less: outstanding goes down
          const adjustment = newTx.type === 'receipt' ? -newTx.amount : newTx.amount;
          return { ...cust, outstandingAmount: cust.outstandingAmount + adjustment };
        }
        return cust;
      }));
      logAudit('Customer Payment', `Recorded ${newTx.type} of ₹${newTx.amount} from customer ${newTx.partyName}`);
    } else {
      setSuppliers(prev => prev.map(supp => {
        if (supp.id === newTx.partyId) {
          // If we pay supplier (payment), we owe them less: outstanding goes down
          const adjustment = newTx.type === 'payment' ? -newTx.amount : newTx.amount;
          return { ...supp, outstandingAmount: supp.outstandingAmount + adjustment };
        }
        return supp;
      }));
      logAudit('Supplier Payment', `Recorded ${newTx.type} of ₹${newTx.amount} to supplier ${newTx.partyName}`);
    }

    api.payments.create(newTx).catch(err => {
      console.warn('Failed to save payment transaction on server database', err);
    });
  };

  const recordCustomerPayment = (customerId: string, amount: number, paymentMode: string, notes: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;
    recordPayment({
      date: new Date().toISOString().split('T')[0],
      partyId: customerId,
      partyName: cust.name,
      partyType: 'customer',
      amount,
      paymentMode,
      type: 'receipt',
      notes
    });
  };

  const recordSupplierPayment = (supplierId: string, amount: number, paymentMode: string, notes: string) => {
    const supp = suppliers.find(s => s.id === supplierId);
    if (!supp) return;
    recordPayment({
      date: new Date().toISOString().split('T')[0],
      partyId: supplierId,
      partyName: supp.name,
      partyType: 'supplier',
      amount,
      paymentMode,
      type: 'payment',
      notes
    });
  };

  const addWarehouse = (whData: Omit<Warehouse, 'id' | 'shopId'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    const tempId = 'wh_' + makeId();
    const newWh: Warehouse = {
      ...whData,
      id: tempId,
      shopId: bizId
    };
    setWarehouses(prev => [...prev, newWh]);
    logAudit('Add Warehouse', `Created warehouse ${newWh.name}`);

    api.warehouses.create({ ...whData, shopId: bizId })
      .then(saved => {
        setWarehouses(prev => prev.map(w => w.id === tempId ? { ...saved, id: saved.id || (saved as any)._id?.toString() || tempId } : w));
      })
      .catch(err => {
        console.warn('Failed to save warehouse on server database', err);
      });
  };

  const updateWarehouseStock = (productId: string, warehouseId: string, currentStock: number, reservedStock: number = 0) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    setWarehouseStocks(prev => {
      const existingIdx = prev.findIndex(ws => ws.productId === productId && ws.warehouseId === warehouseId && ws.shopId === bizId);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...prev[existingIdx],
          currentStock,
          reservedStock,
          availableStock: currentStock - reservedStock
        };
        return updated;
      } else {
        const newStock: WarehouseStock = {
          id: `ws_${productId}_${warehouseId}`,
          shopId: bizId,
          productId,
          warehouseId,
          currentStock,
          reservedStock,
          availableStock: currentStock - reservedStock
        };
        return [...prev, newStock];
      }
    });
  };

  const createStockTransfer = (transferData: Omit<StockTransfer, 'id' | 'shopId' | 'transferNumber' | 'createdAt'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    const transNo = `ST-${(stockTransfers.length + 1).toString().padStart(6, '0')}`;
    const tempId = 'st_' + makeId();
    
    const newTransfer: StockTransfer = {
      ...transferData,
      id: tempId,
      shopId: bizId,
      transferNumber: transNo,
      createdAt: new Date().toISOString()
    };

    setStockTransfers(prev => [newTransfer, ...prev]);

    if (newTransfer.status === 'completed') {
      // 1. Deduct from 'from' warehouse
      setWarehouseStocks(prev => {
        return prev.map(ws => {
          if (ws.productId === newTransfer.productId && ws.warehouseId === newTransfer.fromWarehouseId && ws.shopId === bizId) {
            const nextStock = Math.max(0, ws.currentStock - newTransfer.quantity);
            return { ...ws, currentStock: nextStock, availableStock: nextStock - ws.reservedStock };
          }
          return ws;
        });
      });

      // 2. Add to 'to' warehouse
      setWarehouseStocks(prev => {
        const existing = prev.find(ws => ws.productId === newTransfer.productId && ws.warehouseId === newTransfer.toWarehouseId && ws.shopId === bizId);
        if (existing) {
          return prev.map(ws => ws.id === existing.id ? {
            ...ws,
            currentStock: ws.currentStock + newTransfer.quantity,
            availableStock: ws.currentStock + newTransfer.quantity - ws.reservedStock
          } : ws);
        } else {
          const newStock: WarehouseStock = {
            id: `ws_${newTransfer.productId}_${newTransfer.toWarehouseId}`,
            shopId: bizId,
            productId: newTransfer.productId,
            warehouseId: newTransfer.toWarehouseId,
            currentStock: newTransfer.quantity,
            reservedStock: 0,
            availableStock: newTransfer.quantity
          };
          return [...prev, newStock];
        }
      });
    }

    logAudit('Warehouse Stock Transfer', `Transferred ${newTransfer.quantity} units of product ID: ${newTransfer.productId} from ${newTransfer.fromWarehouseName} to ${newTransfer.toWarehouseName} (Status: ${newTransfer.status})`);

    api.warehouses.transfer(newTransfer)
      .then(saved => {
        setStockTransfers(prev => prev.map(st => st.id === tempId ? { ...saved, id: saved.id || (saved as any)._id?.toString() || tempId } : st));
      })
      .catch(err => {
        console.warn('Failed to save stock transfer on server database', err);
      });
  };

  const addSerialNumber = (snData: Omit<SerialNumber, 'id' | 'shopId' | 'createdAt'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    const newSN: SerialNumber = {
      ...snData,
      id: 'sn_' + makeId(),
      shopId: bizId,
      createdAt: new Date().toISOString()
    };
    setSerialNumbers(prev => [...prev, newSN]);
    logAudit('Add Serial Number', `Added Serial ${newSN.serialNumber} for product ID: ${newSN.productId}`);
  };

  const updateSerialNumber = (id: string, updated: Partial<SerialNumber>) => {
    setSerialNumbers(prev => prev.map(sn => sn.id === id ? { ...sn, ...updated } : sn));
    logAudit('Update Serial Number', `Updated Serial Number ID ${id}`);
  };

  const adjustStockProfessional = (adjData: Omit<StockAdjustment, 'id' | 'shopId' | 'adjustmentNumber' | 'createdAt'>) => {
    if (!currentBusiness) return;
    const bizId = currentBusiness.id;
    const adjNo = `ADJ-${(stockAdjustments.length + 1).toString().padStart(6, '0')}`;
    const tempId = 'adj_' + makeId();
    
    const newAdjustment: StockAdjustment = {
      ...adjData,
      id: tempId,
      shopId: bizId,
      adjustmentNumber: adjNo,
      createdAt: new Date().toISOString()
    };

    setStockAdjustments(prev => [newAdjustment, ...prev]);

    setWarehouseStocks(prev => {
      const existing = prev.find(ws => ws.productId === newAdjustment.productId && ws.warehouseId === newAdjustment.warehouseId && ws.shopId === bizId);
      if (existing) {
        return prev.map(ws => ws.id === existing.id ? {
          ...ws,
          currentStock: newAdjustment.updatedQuantity,
          availableStock: newAdjustment.updatedQuantity - ws.reservedStock
        } : ws);
      } else {
        const newStock: WarehouseStock = {
          id: `ws_${newAdjustment.productId}_${newAdjustment.warehouseId}`,
          shopId: bizId,
          productId: newAdjustment.productId,
          warehouseId: newAdjustment.warehouseId,
          currentStock: newAdjustment.updatedQuantity,
          reservedStock: 0,
          availableStock: newAdjustment.updatedQuantity
        };
        return [...prev, newStock];
      }
    });

    setProducts(prev => prev.map(p => {
      if (p.id === newAdjustment.productId) {
        const nextStock = Math.max(0, p.stock + newAdjustment.adjustedQuantity);
        return { ...p, stock: nextStock };
      }
      return p;
    }));

    const movement: StockMovement = {
      id: 'sm_' + makeId(),
      productId: newAdjustment.productId,
      shopId: bizId,
      date: newAdjustment.date,
      time: new Date().toLocaleTimeString(),
      quantity: newAdjustment.adjustedQuantity,
      type: 'adjustment',
      reason: `Stock Adjustment ${adjNo}: ${newAdjustment.reason} (${newAdjustment.notes || ''})`,
      refId: newAdjustment.id,
      stockBefore: newAdjustment.previousQuantity,
      stockAfter: newAdjustment.updatedQuantity,
      user: newAdjustment.user
    };
    setStockMovements(prev => [movement, ...prev]);

    logAudit('Professional Stock Adjustment', `Adjusted product ${newAdjustment.productName} inside warehouse ${newAdjustment.warehouseName} by ${newAdjustment.adjustedQuantity > 0 ? '+' : ''}${newAdjustment.adjustedQuantity}. Reason: ${newAdjustment.reason}`);

    api.warehouses.adjust({
      productId: newAdjustment.productId,
      shopId: bizId,
      warehouseId: newAdjustment.warehouseId,
      adjustmentType: newAdjustment.adjustedQuantity >= 0 ? 'addition' : 'deduction',
      quantity: Math.abs(newAdjustment.adjustedQuantity),
      reason: newAdjustment.reason,
      user: newAdjustment.user
    })
      .then(saved => {
        setStockAdjustments(prev => prev.map(sa => sa.id === tempId ? { ...saved, id: saved.id || (saved as any)._id?.toString() || tempId } : sa));
      })
      .catch(err => {
        console.warn('Failed to save stock adjustment on server database', err);
      });
  };

  // 12. Settings Module Management
  const updateSettings = (updated: Partial<BusinessDetails>) => {
    const next = normalizeBusinessDetails({ ...businessDetails, ...updated }, currentBusiness?.id || businessDetails.id || 'current');
    setBusinessDetails(next);
    logAudit('Update Settings', `Updated shop configuration details.`);

    if (currentBusiness) {
      api.settings.update({
        ...next,
        shopId: currentBusiness.id,
        user: currentUser?.name || 'Administrator'
      }).catch(err => {
        console.warn('Failed to update settings on server database', err);
      });
    }
  };

  const updateBusinessDetails = updateSettings;

  // 13. System Utilities: Backup & Restore
  const exportBackup = (): string => {
    if (!currentBusiness) return '';
    const bizId = currentBusiness.id;
    const backupObj = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      shopId: bizId,
      products,
      customers,
      suppliers,
      bills,
      purchases,
      salesReturns,
      expenses,
      stockMovements,
      payments,
      auditLogs,
      businessDetails
    };
    logAudit('Export Database', `Exported full system backup JSON`);
    return btoa(unescape(encodeURIComponent(JSON.stringify(backupObj))));
  };

  const importBackup = (backupStr: string): boolean => {
    if (!currentBusiness) return false;
    try {
      const decoded = decodeURIComponent(escape(atob(backupStr)));
      const parsed = JSON.parse(decoded);
      
      if (parsed.shopId !== currentBusiness.id) {
        alert('Error: This backup belongs to another shop!');
        return false;
      }

      if (parsed.products) setProducts(parsed.products);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.bills) setBills(parsed.bills);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.salesReturns) setSalesReturns(parsed.salesReturns);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
      if (parsed.payments) setPayments(parsed.payments);
      if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      if (parsed.businessDetails) setBusinessDetails(parsed.businessDetails);

      logAudit('Import Database', `Imported database state from backup file`);

      api.backup.import(currentBusiness.id, backupStr, currentUser?.name || 'Administrator')
        .catch(err => {
          console.warn('Failed to import backup to server database', err);
        });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      currentBusiness, selectBusiness,
      currentBillType, setBillType,
      activeTab, setActiveTab, resetToWelcome,
      editingBillId, setEditingBillId,
      products, customers, suppliers, bills, purchases, salesReturns, expenses, stockMovements, payments, auditLogs, businessDetails,
      purchaseOrders, grns, purchaseReturns, supplierCreditNotes, supplierDebitNotes,
      warehouses, warehouseStocks, stockTransfers, serialNumbers, stockAdjustments,
      addWarehouse, updateWarehouseStock, createStockTransfer, addSerialNumber, updateSerialNumber, adjustStockProfessional,
      addProduct, updateProduct, deleteProduct,
      addCustomer, updateCustomer, deleteCustomer,
      addSupplier, updateSupplier,
      nextBillNumber, createBill, updateBill, cancelBill, deleteBill,
      draftBill, saveDraft,
      createPurchase, updatePurchase, deletePurchase, createSalesReturn,
      createPurchaseOrder, updatePurchaseOrderStatus, updatePurchaseOrderReceivedQty, createGRN, createPurchaseReturn, createSupplierDebitNote,
      addExpense, deleteExpense,
      recordPayment, recordCustomerPayment, recordSupplierPayment, updateSettings, updateBusinessDetails, importBackup, exportBackup, adjustStock,

      // Security (Multi-User, Auth, RBAC)
      currentUser, users, roles, sessions, securityNotifications, loginHistory,
      login, logout, changePassword, forgotPassword, resetPasswordByToken,
      addUser, updateUser, deactivateUser, deleteUser, resetUserPasswordAdmin,
      addCustomRole, updateCustomRole, deleteCustomRole, hasPermission, secureApiCall,
      markNotificationRead, clearNotifications, triggerNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

// Helper: Seed initial historical data to populate charts/analytics nicely on first load
function generateSeededHistory(bizId: string, availableProducts: Product[], availableCustomers: Customer[]): Bill[] {
  const seeded: Bill[] = [];
  const today = new Date();
  
  // Create 4 realistic bills over the last 4 days
  const walkin = 'c_walkin';
  const c1 = availableCustomers.find(c => c.id === 'c1')?.id || walkin;
  const c2 = availableCustomers.find(c => c.id === 'c2')?.id || walkin;
  const c3 = availableCustomers.find(c => c.id === 'c3')?.id || walkin;

  const prefix = bizId === 'sivasakthi_elec' ? 'SE' : 'MP';
  
  // Day -3 Sales
  const d3 = new Date(today);
  d3.setDate(today.getDate() - 3);
  const d3Str = d3.toISOString().split('T')[0];

  // Day -2 Sales
  const d2 = new Date(today);
  d2.setDate(today.getDate() - 2);
  const d2Str = d2.toISOString().split('T')[0];

  // Day -1 Sales
  const d1 = new Date(today);
  d1.setDate(today.getDate() - 1);
  const d1Str = d1.toISOString().split('T')[0];

  // Today Sales
  const t0Str = today.toISOString().split('T')[0];

  // Generate 4 transactions
  const p1 = availableProducts[0];
  const p2 = availableProducts[1];
  const p3 = availableProducts[2];
  const p4 = availableProducts[3];

  if (p1 && p2 && p3) {
    // Bill 1: Walkin Retail Cash (Day -3)
    const items1: BillItem[] = [
      createSeededItem(p1, 2, 'normal'),
      createSeededItem(p3, 10, 'normal')
    ];
    const tot1 = items1.reduce((sum, i) => sum + i.total, 0);
    seeded.push({
      id: 'b_seed_1',
      shopId: bizId,
      billNumber: `${prefix}-000001`,
      billType: 'normal',
      date: d3Str,
      time: '11:15:30',
      customerId: walkin,
      customerName: 'Walk-in Customer',
      customerMobile: '9999999999',
      items: items1,
      gstEnabled: true,
      subtotal: tot1,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: items1.reduce((sum, i) => sum + i.taxableValue, 0),
      cgst: items1.reduce((sum, i) => sum + i.cgst, 0),
      sgst: items1.reduce((sum, i) => sum + i.sgst, 0),
      igst: 0,
      roundOff: 0,
      grandTotal: tot1,
      paidAmount: tot1,
      balanceAmount: 0,
      paymentMode: 'cash',
      status: 'saved',
      createdAt: `${d3Str}T11:15:30.000Z`
    });

    // Bill 2: Contractor GST (Day -2)
    const items2: BillItem[] = [
      createSeededItem(p2, 5, 'contractor'),
      createSeededItem(p4, 8, 'contractor')
    ];
    // Exclusive pricing since it's a contractor bill
    const itemsTotal = items2.reduce((sum, i) => sum + i.taxableValue, 0);
    const taxTotal = items2.reduce((sum, i) => sum + (i.cgst + i.sgst), 0);
    const gTot2 = Math.round(itemsTotal + taxTotal);
    
    seeded.push({
      id: 'b_seed_2',
      shopId: bizId,
      billNumber: `${prefix}-000002`,
      billType: 'contractor',
      date: d2Str,
      time: '15:45:00',
      customerId: c1,
      customerName: 'Balaji Builders (Contractor)',
      customerMobile: '9845612301',
      customerGst: '33AAAPB1234F1Z8',
      items: items2,
      gstEnabled: true,
      subtotal: itemsTotal,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: itemsTotal,
      cgst: items2.reduce((sum, i) => sum + i.cgst, 0),
      sgst: items2.reduce((sum, i) => sum + i.sgst, 0),
      igst: 0,
      roundOff: gTot2 - (itemsTotal + taxTotal),
      grandTotal: gTot2,
      paidAmount: 0, // credit purchase
      balanceAmount: gTot2,
      paymentMode: 'credit',
      status: 'saved',
      createdAt: `${d2Str}T15:45:00.000Z`
    });

    // Bill 3: Retail UPI Payment (Day -1)
    const items3: BillItem[] = [
      createSeededItem(p3, 15, 'normal'),
      createSeededItem(p1, 1, 'normal')
    ];
    const tot3 = items3.reduce((sum, i) => sum + i.total, 0);
    seeded.push({
      id: 'b_seed_3',
      shopId: bizId,
      billNumber: `${prefix}-000003`,
      billType: 'normal',
      date: d1Str,
      time: '18:22:10',
      customerId: c2,
      customerName: 'Karthik Electrician',
      customerMobile: '9443215890',
      items: items3,
      gstEnabled: true,
      subtotal: tot3,
      discountPercent: 5,
      discountAmount: Math.round(tot3 * 0.05),
      taxableAmount: items3.reduce((sum, i) => sum + i.taxableValue, 0) * 0.95,
      cgst: items3.reduce((sum, i) => sum + i.cgst, 0) * 0.95,
      sgst: items3.reduce((sum, i) => sum + i.sgst, 0) * 0.95,
      igst: 0,
      roundOff: 0,
      grandTotal: Math.round(tot3 * 0.95),
      paidAmount: Math.round(tot3 * 0.95),
      balanceAmount: 0,
      paymentMode: 'upi',
      status: 'saved',
      createdAt: `${d1Str}T18:22:10.000Z`
    });

    // Bill 4: Walk-in Card Sale (Today)
    const items4: BillItem[] = [
      createSeededItem(p2, 1, 'normal')
    ];
    const tot4 = items4.reduce((sum, i) => sum + i.total, 0);
    seeded.push({
      id: 'b_seed_4',
      shopId: bizId,
      billNumber: `${prefix}-000004`,
      billType: 'normal',
      date: t0Str,
      time: '09:40:00',
      customerId: walkin,
      customerName: 'Walk-in Customer',
      customerMobile: '9999999999',
      items: items4,
      gstEnabled: true,
      subtotal: tot4,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: items4.reduce((sum, i) => sum + i.taxableValue, 0),
      cgst: items4.reduce((sum, i) => sum + i.cgst, 0),
      sgst: items4.reduce((sum, i) => sum + i.sgst, 0),
      igst: 0,
      roundOff: 0,
      grandTotal: tot4,
      paidAmount: tot4,
      balanceAmount: 0,
      paymentMode: 'card',
      status: 'saved',
      createdAt: `${t0Str}T09:40:00.000Z`
    });
  }

  return seeded;
}

function createSeededItem(product: Product, quantity: number, type: 'normal' | 'contractor'): BillItem {
  const isContractor = type === 'contractor';
  // Contractor bills are GST exclusive (selling rate is product base, e.g., purchase price or sellingPrice divided by tax)
  // For simplicity, sellingPrice for contractors is purchasePrice + thin margin, or we use standard formula:
  const rate = isContractor ? product.purchasePrice : product.sellingPrice;
  const gstPercent = product.gstPercent;

  let taxableValue = 0;
  let taxAmount = 0;
  let total = 0;

  if (isContractor) {
    // exclusive
    taxableValue = rate * quantity;
    taxAmount = taxableValue * (gstPercent / 100);
    total = taxableValue + taxAmount;
  } else {
    // inclusive
    total = rate * quantity;
    taxableValue = total / (1 + gstPercent / 100);
    taxAmount = total - taxableValue;
  }

  const splitTax = taxAmount / 2;

  return {
    id: Math.random().toString(36).substring(2, 11),
    productId: product.id,
    name: product.name,
    hsnCode: product.hsnCode,
    quantity,
    unit: product.unit,
    rate,
    discountPercent: 0,
    discountAmount: 0,
    gstPercent,
    taxableValue,
    cgst: splitTax,
    sgst: splitTax,
    igst: 0,
    total
  };
}
