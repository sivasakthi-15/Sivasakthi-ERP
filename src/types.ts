export interface Business {
  id: string;
  name: string;
  description?: string;
  logoPlaceholder: string;
  tags: string[];
}

export interface BusinessDetails {
  id?: string;
  name: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  altPhone: string;
  email: string;
  website: string;
  gstNumber: string;
  panNumber: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  invoicePrefix: string;
  termsAndConditions: string[];
  declaration: string;
  authorizedSignature: string;
  roundOff: boolean;
  decimalPlaces: number;
  tradingName?: string;
  proprietorName?: string;
  doorNumber?: string;
  street?: string;
  area?: string;
  district?: string;
  country?: string;
  msmeNumber?: string;
  cin?: string;
  startingInvoiceNumber?: number;
  invoiceFooterMessage?: string;
  signatureImage?: string;
  companySeal?: string;
  staticUpiQr?: string;
  dynamicPaymentQr?: boolean;
  banks?: BankAccount[];
  defaultBankAccountId?: string;
  appearance?: InvoiceAppearance;
}

export interface BankAccount {
  id: string;
  beneficiaryName: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  upiId: string;
}

export interface InvoiceAppearance {
  showLogo: boolean;
  showGst: boolean;
  showQr: boolean;
  showBankDetails: boolean;
  showSignature: boolean;
  showSeal: boolean;
  showFooter: boolean;
  showProprietorName: boolean;
  showLogoOnThermal: boolean;
}

export interface Product {
  id: string;
  shopId: string; // Isolated per shop
  name: string;
  productCode: string;
  barcode: string;
  sku: string;
  hsnCode: string;
  category: string;
  brand: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number; // Base rate
  latestSellingPrice?: number;
  mrp?: number;
  gstPercent: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  reorderLevel: number;
  description?: string;
  isActive?: boolean;
  
  // Advanced Extensions
  batchNumber?: string;
  expiryDate?: string;
  variants?: string[];
  imageUrl?: string;
  openingStock?: number;
  latestPurchaseCost?: number;
  avgPurchaseCost?: number;
  lastPurchaseDate?: string;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  
  // Barcode, Unit Conversion, Serials & Warranty Extensions
  purchaseUnit?: string;
  sellingUnit?: string;
  baseUnit?: string;
  conversionFactor?: number;
  warrantyPeriodMonths?: number;
  isSerialTracked?: boolean;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  organizationName?: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  email: string;
  creditLimit: number;
  outstandingAmount: number; // Positive means customer owes shop, negative means advance
  notes: string;
  type: 'retail' | 'wholesale' | 'contractor';
  
  // Advanced CRM Extensions
  rewardPoints?: number;
  priceListType?: 'retail' | 'wholesale' | 'contractor';
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  companyName?: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  email: string;
  outstandingAmount: number; // Positive means shop owes supplier
  notes: string;
  bankDetails: string;
}

export interface BillItem {
  id: string;
  productId: string;
  name: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number; // Price charged (tax inclusive or exclusive depending on context)
  discountPercent: number;
  discountAmount: number;
  gstPercent: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  isRateEdited?: boolean;
  originalRate?: number;
  openingStock?: number;
  category?: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  productCode?: string;
}

export type BillStatus = 'draft' | 'saved' | 'printed' | 'paid' | 'partially_paid' | 'credit' | 'cancelled' | 'on_hold';

export interface Bill {
  _id?: string;
  id: string;
  shopId: string;
  billNumber: string;
  billType: 'normal' | 'contractor';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  customerId: string;
  customerName: string;
  customerOrganizationName?: string;
  customerMobile?: string; // snapshot
  customerGst?: string; // snapshot
  customerAddress?: string; // snapshot
  items: BillItem[];
  gstEnabled: boolean;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque' | 'credit' | 'split';
  splitPayments?: {
    cash: number;
    upi: number;
    card: number;
    bank: number;
  };
  status: BillStatus;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
  
  // Advanced Document & POS Extensions
  docType?: 'invoice' | 'non_gst' | 'quotation' | 'challan' | 'proforma' | 'sales_return' | 'purchase_return' | 'credit_note' | 'debit_note';
  vehicleNumber?: string;
  deliveryPerson?: string;
  receivedBy?: string;
  validityDays?: number;
  linkedInvoiceId?: string;
  linkedInvoiceNumber?: string;
  returnReason?: string;
  isConverted?: boolean;
  convertedToInvoiceId?: string;
  holdReason?: string;
  isHold?: boolean;
  notes?: string;
  cashierName?: string;
  cashDiscount?: number;
  schemeDiscount?: number;
  customerNotes?: string;
  internalNotes?: string;
  deliveryNotes?: string;
  invoiceNotes?: string;
  additionalCharges?: {
    packing?: string | number;
    loading?: string | number;
    transport?: string | number;
    freight?: string | number;
    handling?: string | number;
    other?: string | number;
  };
}

export interface PurchaseItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  purchaseRate: number;
  gstPercent: number;
  taxableValue: number;
  total: number;
}

export interface PurchaseBill {
  id: string;
  shopId: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
  createdAt: string;
  supplierInvoiceNumber?: string;
  discountPercent?: number;
  discountAmount?: number;
  transportCharges?: number;
  loadingCharges?: number;
  packingCharges?: number;
  otherCharges?: number;
  roundOff?: number;
  notes?: string;
}

export interface SalesReturn {
  id: string;
  shopId: string;
  returnNumber: string;
  originalBillId: string;
  originalBillNumber: string;
  date: string;
  time?: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    gstPercent: number;
    taxableValue: number;
    total: number;
  }[];
  grandTotal: number;
  reason: string;
  exchangeItems?: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    gstPercent: number;
    taxableValue: number;
    total: number;
  }[];
  exchangeTotal?: number;
  differenceAmount?: number;
  refundMode?: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit_adjustment' | 'no_refund';
  refundAmount?: number;
  creditNoteNumber?: string;
  creditNoteAmount?: number;
  user?: string;
}

export interface Expense {
  id: string;
  shopId: string;
  date: string;
  category: 'rent' | 'salary' | 'transport' | 'fuel' | 'electricity' | 'internet' | 'office_supplies' | 'repairs' | 'miscellaneous';
  amount: number;
  description?: string;
  paymentMode: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  shopId: string;
  date: string;
  time: string;
  quantity: number; // positive or negative
  type: 'sale' | 'purchase' | 'sales_return' | 'purchase_return' | 'adjustment';
  reason: string;
  refId: string; // Bill ID, Purchase ID, etc.
  stockBefore: number;
  stockAfter: number;
  user: string;
}

export interface PaymentTransaction {
  id: string;
  shopId: string;
  date: string;
  partyId: string; // CustomerId or SupplierId
  partyName: string;
  partyType: 'customer' | 'supplier';
  amount: number;
  paymentMode: string;
  type: 'receipt' | 'payment'; // receipt from customer, payment to supplier
  refId?: string; // Associated Bill/Purchase ID
  notes: string;
}

export interface AuditLog {
  id: string;
  shopId: string;
  date: string;
  time: string;
  user: string;
  action: string;
  details: string;
}

export interface PurchaseOrder {
  id: string;
  shopId: string;
  poNumber: string;
  supplierMobile?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  subtotal?: number;
  grandTotal?: number;
  items: {
    productId: string;
    name: string;
    quantity: number;
    receivedQuantity: number;
    unit: string;
    expectedRate: number;
    total: number;
  }[];
  notes: string;
  status: 'draft' | 'pending' | 'partially_received' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface GRN {
  id: string;
  shopId: string;
  grnNumber: string;
  poId?: string;
  poNumber?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  grandTotal?: number;
  isConvertedToInvoice?: boolean;
  items: {
    productId: string;
    name: string;
    quantityReceived: number;
    unit: string;
    rate: number;
    total: number;
  }[];
  notes: string;
  status: 'pending' | 'converted';
  purchaseInvoiceId?: string;
  createdAt: string;
}

export interface PurchaseReturn {
  id: string;
  shopId: string;
  returnNumber: string;
  purchaseInvoiceId: string;
  purchaseInvoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    purchaseRate: number;
    gstPercent: number;
    taxableValue: number;
    total: number;
  }[];
  grandTotal: number;
  reason: string;
  creditNoteNumber?: string;
  createdAt: string;
  notes?: string;
}

export interface SupplierCreditNote {
  id: string;
  shopId: string;
  creditNoteNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseReturnId: string;
  purchaseReturnNumber: string;
  invoiceReference: string;
  date: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    rate: number;
    total: number;
  }[];
  amount: number;
  reason: string;
  createdAt: string;
}

export interface SupplierDebitNote {
  id: string;
  shopId: string;
  debitNoteNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceReference?: string;
  date: string;
  items?: {
    name: string;
    quantity: number;
    rate: number;
    total: number;
  }[];
  amount: number;
  reason: string;
  createdAt: string;
  notes?: string;
}

export interface Warehouse {
  id: string;
  shopId: string;
  name: string; // e.g. 'Main Store', 'Warehouse A', 'Godown B', 'Branch Store'
  location?: string;
  isDefault?: boolean;
}

export interface WarehouseStock {
  id: string;
  shopId: string;
  productId: string;
  warehouseId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
}

export interface StockTransfer {
  id: string;
  shopId: string;
  transferNumber: string;
  transferDate: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface SerialNumber {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  serialNumber: string;
  purchaseInvoiceId?: string;
  purchaseInvoiceNo?: string;
  supplierId?: string;
  supplierName?: string;
  saleInvoiceId?: string;
  saleInvoiceNo?: string;
  customerId?: string;
  customerName?: string;
  warrantyPeriodMonths?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  status: 'available' | 'sold' | 'returned' | 'damaged';
  notes?: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  shopId: string;
  adjustmentNumber: string;
  date: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  previousQuantity: number;
  updatedQuantity: number;
  adjustedQuantity: number; // difference: positive or negative
  reason: 'physical_count' | 'damage' | 'lost' | 'theft' | 'correction' | 'opening_balance';
  notes?: string;
  user: string;
  createdAt: string;
}

// Security, User & Role Management Types
export type SystemRole = 'owner' | 'admin' | 'manager' | 'cashier' | 'accountant' | 'store_keeper' | string;

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  print?: boolean;
  export?: boolean;
}

export interface UserPermissions {
  billing: ModulePermissions;
  purchase: ModulePermissions;
  inventory: {
    view: boolean;
    stockAdjustment: boolean;
    stockTransfer: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
  };
  accounting: {
    view: boolean;
    edit: boolean;
  };
  settings: {
    fullControl: boolean;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  photo?: string;
  email: string;
  phone: string;
  role: SystemRole;
  branch: string; // "sivasakthi_elec" | "meenatchi_pipes" | "all"
  status: 'active' | 'inactive';
  lastLogin?: string;
  failedAttempts?: number;
  lockedUntil?: string; // ISO date string
  permittedBranches: string[]; // e.g. ["sivasakthi_elec"] or ["sivasakthi_elec", "meenatchi_pipes"]
  createdAt: string;
  passwordHash?: string; // Client-side hashed password
}

export interface RoleConfig {
  name: SystemRole;
  label: string;
  description?: string;
  permissions: UserPermissions;
  isSystem?: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: SystemRole;
  branch: string;
  loginTime: string;
  ipAddress?: string;
  device?: string;
  isActive?: boolean;
}

export interface ExtendedAuditLog extends AuditLog {
  ipAddress?: string;
  oldValue?: string;
  newValue?: string;
}

export interface SecurityNotification {
  id: string;
  type: 'low_stock' | 'failed_login' | 'password_changed' | 'user_created';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}


