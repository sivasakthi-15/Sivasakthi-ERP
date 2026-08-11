import { Schema, model, Document, Types } from 'mongoose';

// ------------------------------------------------------------------
// 1. Roles & Permissions Schemas
// ------------------------------------------------------------------

const ModulePermissionsSchema = new Schema({
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  print: { type: Boolean, default: false },
  export: { type: Boolean, default: false }
}, { _id: false });

const UserPermissionsSchema = new Schema({
  billing: ModulePermissionsSchema,
  purchase: ModulePermissionsSchema,
  inventory: {
    view: { type: Boolean, default: false },
    stockAdjustment: { type: Boolean, default: false },
    stockTransfer: { type: Boolean, default: false }
  },
  reports: {
    view: { type: Boolean, default: false },
    export: { type: Boolean, default: false }
  },
  accounting: {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false }
  },
  settings: {
    fullControl: { type: Boolean, default: false }
  }
}, { _id: false });

export const RoleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  description: { type: String },
  permissions: { type: UserPermissionsSchema, required: true },
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

export const Role = model('Role', RoleSchema);

// ------------------------------------------------------------------
// 2. User & Session Schemas
// ------------------------------------------------------------------

export const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, required: true, ref: 'Role' },
  branch: { type: String, required: true }, // "sivasakthi_elec" | "meenatchi_pipes" | "all"
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  permittedBranches: [{ type: String }],
  photo: { type: String },
  lastLogin: { type: Date },
  failedAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date }
}, { timestamps: true });

export const User = model('User', UserSchema);

export const SessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  branch: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
  ipAddress: { type: String },
  device: { type: String },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String }
}, { timestamps: true });

export const Session = model('Session', SessionSchema);

// ------------------------------------------------------------------
// 3. Products & Stock Schemas
// ------------------------------------------------------------------

export const ProductSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  productCode: { type: String, required: true, unique: true, index: true },
  barcode: { type: String, default: '' },
  sku: { type: String, default: '' },
  hsnCode: { type: String, default: '8544' },
  category: { type: String, required: true, index: true },
  brand: { type: String, default: '' },
  unit: { type: String, default: 'Nos' },
  purchasePrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  latestSellingPrice: { type: Number },
  mrp: { type: Number, required: true, default: 0 },
  gstPercent: { type: Number, required: true, default: 18 },
  stock: { type: Number, required: true, default: 0 },
  minStock: { type: Number, default: 5 },
  maxStock: { type: Number, default: 500 },
  reorderLevel: { type: Number, default: 10 },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  
  // Advanced Extensions
  batchNumber: { type: String },
  expiryDate: { type: String },
  variants: [{ type: String }],
  imageUrl: { type: String },
  openingStock: { type: Number, default: 0 },
  latestPurchaseCost: { type: Number },
  avgPurchaseCost: { type: Number },
  lastPurchaseDate: { type: String },
  preferredSupplierId: { type: String },
  preferredSupplierName: { type: String },
  
  // Unit conversion, serials
  purchaseUnit: { type: String },
  sellingUnit: { type: String },
  baseUnit: { type: String },
  conversionFactor: { type: Number, default: 1 },
  warrantyPeriodMonths: { type: Number, default: 0 },
  isSerialTracked: { type: Boolean, default: false }
}, { timestamps: true });

export const Product = model('Product', ProductSchema);

// ------------------------------------------------------------------
// 4. Customers & Suppliers Schemas
// ------------------------------------------------------------------

export const CustomerSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  mobile: { type: String, required: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  creditLimit: { type: Number, default: 0 },
  outstandingAmount: { type: Number, default: 0 }, // positive: customer owes, negative: advance
  notes: { type: String, default: '' },
  type: { type: String, enum: ['retail', 'wholesale', 'contractor'], default: 'retail' },
  rewardPoints: { type: Number, default: 0 },
  priceListType: { type: String, enum: ['retail', 'wholesale', 'contractor'], default: 'retail' }
}, { timestamps: true });

export const Customer = model('Customer', CustomerSchema);

export const SupplierSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  mobile: { type: String, required: true },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  outstandingAmount: { type: Number, default: 0 }, // positive: shop owes supplier
  notes: { type: String, default: '' },
  bankDetails: { type: String, default: '' }
}, { timestamps: true });

export const Supplier = model('Supplier', SupplierSchema);

// ------------------------------------------------------------------
// 5. Billing & Invoicing Schemas
// ------------------------------------------------------------------

const BillItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  hsnCode: { type: String, default: '8544' },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 18 },
  taxableValue: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  total: { type: Number, required: true }
}, { _id: false });

export const BillSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  billNumber: { type: String, required: true, unique: true, index: true },
  billType: { type: String, enum: ['normal', 'contractor'], default: 'normal' },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  time: { type: String, required: true },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  customerGst: { type: String },
  customerAddress: { type: String },
  items: [BillItemSchema],
  gstEnabled: { type: Boolean, default: true },
  subtotal: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  paymentMode: { type: String, required: true },
  splitPayments: {
    cash: { type: Number, default: 0 },
    upi: { type: Number, default: 0 },
    card: { type: Number, default: 0 },
    bank: { type: Number, default: 0 }
  },
  status: { type: String, required: true, index: true },
  cancelReason: { type: String },
  cancelledAt: { type: String },
  docType: { type: String, default: 'invoice' },
  vehicleNumber: { type: String },
  deliveryPerson: { type: String },
  receivedBy: { type: String },
  validityDays: { type: Number },
  linkedInvoiceId: { type: String },
  linkedInvoiceNumber: { type: String },
  returnReason: { type: String },
  isConverted: { type: Boolean, default: false },
  convertedToInvoiceId: { type: String },
  holdReason: { type: String },
  isHold: { type: Boolean, default: false },
  notes: { type: String },
  cashierName: { type: String },
  id: { type: String, index: true },
  cashDiscount: { type: Number, default: 0 },
  schemeDiscount: { type: Number, default: 0 },
  customerNotes: { type: String },
  internalNotes: { type: String },
  deliveryNotes: { type: String },
  invoiceNotes: { type: String },
  additionalCharges: {
    packing: { type: Number, default: 0 },
    loading: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    freight: { type: Number, default: 0 },
    handling: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  }
}, { timestamps: true });

export const Bill = model('Bill', BillSchema);

// ------------------------------------------------------------------
// 6. Purchases & PO & GRN Schemas
// ------------------------------------------------------------------

const PurchaseItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  purchaseRate: { type: Number, required: true },
  gstPercent: { type: Number, default: 18 },
  taxableValue: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

export const PurchaseBillSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  purchaseNumber: { type: String, required: true, unique: true, index: true },
  supplierId: { type: String, required: true, index: true },
  supplierName: { type: String, required: true },
  date: { type: String, required: true, index: true },
  items: [PurchaseItemSchema],
  subtotal: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  paymentMode: { type: String, required: true },
  supplierInvoiceNumber: { type: String },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  transportCharges: { type: Number, default: 0 },
  loadingCharges: { type: Number, default: 0 },
  packingCharges: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  notes: { type: String }
}, { timestamps: true });

export const PurchaseBill = model('PurchaseBill', PurchaseBillSchema);

export const PurchaseOrderSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  poNumber: { type: String, required: true, unique: true, index: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  date: { type: String, required: true },
  expectedDeliveryDate: { type: String },
  subtotal: { type: Number },
  grandTotal: { type: Number },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    receivedQuantity: { type: Number, default: 0 },
    unit: { type: String, default: 'Nos' },
    expectedRate: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }],
  notes: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'pending', 'partially_received', 'completed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

export const PurchaseOrder = model('PurchaseOrder', PurchaseOrderSchema);

export const GRNSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  grnNumber: { type: String, required: true, unique: true, index: true },
  poId: { type: String },
  poNumber: { type: String },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  date: { type: String, required: true },
  grandTotal: { type: Number },
  isConvertedToInvoice: { type: Boolean, default: false },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantityReceived: { type: Number, required: true },
    unit: { type: String, default: 'Nos' },
    rate: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'converted'], default: 'pending' },
  purchaseInvoiceId: { type: String }
}, { timestamps: true });

export const GRN = model('GRN', GRNSchema);

// ------------------------------------------------------------------
// 7. Returns & Credit/Debit Notes Schemas
// ------------------------------------------------------------------

export const SalesReturnSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  returnNumber: { type: String, required: true, unique: true, index: true },
  originalBillId: { type: String, required: true },
  originalBillNumber: { type: String, required: true },
  date: { type: String, required: true, index: true },
  time: { type: String },
  customerId: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    rate: { type: Number, required: true },
    gstPercent: { type: Number, default: 18 },
    taxableValue: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  grandTotal: { type: Number, required: true },
  reason: { type: String, required: true },
  exchangeItems: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    rate: { type: Number, required: true },
    gstPercent: { type: Number, default: 18 },
    taxableValue: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  exchangeTotal: { type: Number, default: 0 },
  differenceAmount: { type: Number, default: 0 },
  refundMode: { type: String },
  refundAmount: { type: Number, default: 0 },
  creditNoteNumber: { type: String },
  creditNoteAmount: { type: Number, default: 0 },
  user: { type: String }
}, { timestamps: true });

export const SalesReturn = model('SalesReturn', SalesReturnSchema);

export const PurchaseReturnSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  returnNumber: { type: String, required: true, unique: true, index: true },
  purchaseInvoiceId: { type: String, required: true },
  purchaseInvoiceNumber: { type: String, required: true },
  supplierId: { type: String, required: true, index: true },
  supplierName: { type: String, required: true },
  date: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    purchaseRate: { type: Number, required: true },
    gstPercent: { type: Number, default: 18 },
    taxableValue: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  grandTotal: { type: Number, required: true },
  reason: { type: String, required: true },
  creditNoteNumber: { type: String },
  notes: { type: String }
}, { timestamps: true });

export const PurchaseReturn = model('PurchaseReturn', PurchaseReturnSchema);

export const SupplierCreditNoteSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  creditNoteNumber: { type: String, required: true, unique: true, index: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  purchaseReturnId: { type: String, required: true },
  purchaseReturnNumber: { type: String, required: true },
  invoiceReference: { type: String, required: true },
  date: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'Nos' },
    rate: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  amount: { type: Number, required: true },
  reason: { type: String, required: true }
}, { timestamps: true });

export const SupplierCreditNote = model('SupplierCreditNote', SupplierCreditNoteSchema);

export const SupplierDebitNoteSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  debitNoteNumber: { type: String, required: true, unique: true, index: true },
  supplierId: { type: String, required: true },
  supplierName: { type: String, required: true },
  invoiceReference: { type: String },
  date: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  notes: { type: String }
}, { timestamps: true });

export const SupplierDebitNote = model('SupplierDebitNote', SupplierDebitNoteSchema);

// ------------------------------------------------------------------
// 8. Advanced Inventory Schemas
// ------------------------------------------------------------------

export const WarehouseSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  location: { type: String },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export const Warehouse = model('Warehouse', WarehouseSchema);

export const WarehouseStockSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  warehouseId: { type: String, required: true, index: true },
  currentStock: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, default: 0 },
  availableStock: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export const WarehouseStock = model('WarehouseStock', WarehouseStockSchema);

export const StockTransferSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  transferNumber: { type: String, required: true, unique: true, index: true },
  transferDate: { type: String, required: true },
  fromWarehouseId: { type: String, required: true },
  fromWarehouseName: { type: String, required: true },
  toWarehouseId: { type: String, required: true },
  toWarehouseName: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Nos' },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

export const StockTransfer = model('StockTransfer', StockTransferSchema);

export const SerialNumberSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  serialNumber: { type: String, required: true, index: true },
  purchaseInvoiceId: { type: String },
  purchaseInvoiceNo: { type: String },
  supplierId: { type: String },
  supplierName: { type: String },
  saleInvoiceId: { type: String },
  saleInvoiceNo: { type: String },
  customerId: { type: String },
  customerName: { type: String },
  warrantyPeriodMonths: { type: Number, default: 0 },
  warrantyStartDate: { type: String },
  warrantyEndDate: { type: String },
  status: { type: String, enum: ['available', 'sold', 'returned', 'damaged'], default: 'available' },
  notes: { type: String }
}, { timestamps: true });

export const SerialNumber = model('SerialNumber', SerialNumberSchema);

export const StockAdjustmentSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  adjustmentNumber: { type: String, required: true, unique: true, index: true },
  date: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  warehouseId: { type: String, required: true },
  warehouseName: { type: String, required: true },
  previousQuantity: { type: Number, required: true },
  updatedQuantity: { type: Number, required: true },
  adjustedQuantity: { type: Number, required: true },
  reason: { type: String, required: true },
  notes: { type: String },
  user: { type: String, required: true }
}, { timestamps: true });

export const StockAdjustment = model('StockAdjustment', StockAdjustmentSchema);

// ------------------------------------------------------------------
// 9. Finance, Expenses, Ledger, Accounting Schemas
// ------------------------------------------------------------------

export const ExpenseSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  paymentMode: { type: String, required: true }
}, { timestamps: true });

export const Expense = model('Expense', ExpenseSchema);

export const StockMovementSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  time: { type: String, required: true },
  quantity: { type: Number, required: true },
  type: { type: String, required: true, index: true },
  reason: { type: String, required: true },
  refId: { type: String, required: true },
  stockBefore: { type: Number, required: true },
  stockAfter: { type: Number, required: true },
  user: { type: String, required: true }
}, { timestamps: true });

export const StockMovement = model('StockMovement', StockMovementSchema);

export const PaymentTransactionSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  partyId: { type: String, required: true, index: true },
  partyName: { type: String, required: true },
  partyType: { type: String, enum: ['customer', 'supplier'], required: true },
  amount: { type: Number, required: true },
  paymentMode: { type: String, required: true },
  type: { type: String, enum: ['receipt', 'payment'], required: true },
  refId: { type: String },
  notes: { type: String, default: '' }
}, { timestamps: true });

export const PaymentTransaction = model('PaymentTransaction', PaymentTransactionSchema);

// ------------------------------------------------------------------
// 10. Ledger, General Ledger, Journals, Cash/Bank Book Schemas
// ------------------------------------------------------------------

export const JournalEntrySchema = new Schema({
  shopId: { type: String, required: true, index: true },
  journalNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true, index: true },
  narrative: { type: String, required: true },
  refNo: { type: String },
  createdBy: { type: String, required: true },
  entries: [{
    accountName: { type: String, required: true },
    type: { type: String, enum: ['debit', 'credit'], required: true },
    amount: { type: Number, required: true }
  }]
}, { timestamps: true });

export const JournalEntry = model('JournalEntry', JournalEntrySchema);

// ------------------------------------------------------------------
// 11. Security, Audit Log & Notification Schemas
// ------------------------------------------------------------------

export const AuditLogSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  time: { type: String, required: true },
  user: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  details: { type: String, required: true },
  ipAddress: { type: String },
  oldValue: { type: String },
  newValue: { type: String }
}, { timestamps: true });

export const AuditLog = model('AuditLog', AuditLogSchema);

export const SecurityNotificationSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export const SecurityNotification = model('SecurityNotification', SecurityNotificationSchema);

// ------------------------------------------------------------------
// 12. Business Settings Schemas
// ------------------------------------------------------------------

export const BusinessDetailsSchema = new Schema({
  shopId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  logo: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  phone: { type: String, default: '' },
  altPhone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  bankName: { type: String, default: '' },
  accountHolder: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  branch: { type: String, default: '' },
  upiId: { type: String, default: '' },
  invoicePrefix: { type: String, default: 'INV' },
  invoiceCounter: { type: Number, default: 0 },
  termsAndConditions: [{ type: String }],
  declaration: { type: String, default: '' },
  authorizedSignature: { type: String, default: 'Proprietor' },
  tradingName: { type: String, default: '' },
  proprietorName: { type: String, default: '' },
  doorNumber: { type: String, default: '' },
  street: { type: String, default: '' },
  area: { type: String, default: '' },
  district: { type: String, default: '' },
  country: { type: String, default: 'India' },
  msmeNumber: { type: String, default: '' },
  cin: { type: String, default: '' },
  startingInvoiceNumber: { type: Number, default: 1 },
  invoiceFooterMessage: { type: String, default: '' },
  signatureImage: { type: String, default: '' },
  companySeal: { type: String, default: '' },
  staticUpiQr: { type: String, default: '' },
  dynamicPaymentQr: { type: Boolean, default: false },
  banks: [{
    id: String,
    beneficiaryName: String,
    bankName: String,
    branch: String,
    accountNumber: String,
    ifscCode: String,
    accountType: String,
    upiId: String
  }],
  defaultBankAccountId: { type: String, default: '' },
  appearance: {
    showLogo: { type: Boolean, default: true },
    showGst: { type: Boolean, default: true },
    showQr: { type: Boolean, default: true },
    showBankDetails: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true },
    showSeal: { type: Boolean, default: true },
    showFooter: { type: Boolean, default: true },
    showProprietorName: { type: Boolean, default: true },
    showLogoOnThermal: { type: Boolean, default: false }
  },
  roundOff: { type: Boolean, default: true },
  decimalPlaces: { type: Number, default: 2 }
}, { timestamps: true });

export const BusinessDetailsModel = model('BusinessDetails', BusinessDetailsSchema);

// ------------------------------------------------------------------
// 13. Employees & Attendance Schemas
// ------------------------------------------------------------------

export const EmployeeSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, default: '' },
  department: { type: String, default: 'Sales' },
  designation: { type: String, default: '' },
  doj: { type: String, required: true },
  baseSalary: { type: Number, required: true, default: 0 },
  pfEnabled: { type: Boolean, default: false },
  esiEnabled: { type: Boolean, default: false },
  profTaxEnabled: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export const Employee = model('Employee', EmployeeSchema);

export const AttendanceSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  employeeId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  status: { type: String, enum: ['Present', 'Absent', 'Half Day', 'On Leave'], default: 'Present' },
  shift: { type: String, enum: ['General', 'Morning', 'Night'], default: 'General' }
}, { timestamps: true });

export const Attendance = model('Attendance', AttendanceSchema);

// ------------------------------------------------------------------
// 14. Fixed Assets Schemas
// ------------------------------------------------------------------

export const FixedAssetSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  cost: { type: Number, required: true, default: 0 },
  purchaseDate: { type: String, required: true },
  depreciationRate: { type: Number, required: true, default: 15 },
  salvageValue: { type: Number, default: 0 },
  lifeYears: { type: Number, default: 5 }
}, { timestamps: true });

export const FixedAsset = model('FixedAsset', FixedAssetSchema);

// ------------------------------------------------------------------
// 15. Repository Documents Schemas
// ------------------------------------------------------------------

export const RepoDocumentSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['KYC', 'Invoices', 'Agreements', 'Warranties'], required: true },
  size: { type: String, default: '0 B' },
  uploadedOn: { type: String, required: true },
  uploadedBy: { type: String, required: true }
}, { timestamps: true });

export const RepoDocument = model('RepoDocument', RepoDocumentSchema);

// ------------------------------------------------------------------
// 16. Custom Ledgers & Manual Vouchers Schemas
// ------------------------------------------------------------------

export const CustomLedgerSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  group: { type: String, required: true },
  openingBalance: { type: Number, required: true, default: 0 },
  balanceType: { type: String, enum: ['Debit', 'Credit'], default: 'Debit' }
}, { timestamps: true });

export const CustomLedger = model('CustomLedger', CustomLedgerSchema);

export const ManualVoucherSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  time: { type: String },
  voucherNo: { type: String, required: true, unique: true },
  voucherType: { type: String, required: true },
  reference: { type: String, default: '' },
  narration: { type: String, default: '' },
  debits: [{
    ledgerId: { type: String, required: true },
    ledgerName: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  credits: [{
    ledgerId: { type: String, required: true },
    ledgerName: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  isAutomatic: { type: Boolean, default: false }
}, { timestamps: true });

export const ManualVoucher = model('ManualVoucher', ManualVoucherSchema);

// ------------------------------------------------------------------
// 17. Master Categories & Brands Schemas
// ------------------------------------------------------------------

export const CategorySchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true }
}, { timestamps: true });

export const Category = model('Category', CategorySchema);

export const BrandSchema = new Schema({
  shopId: { type: String, required: true, index: true },
  name: { type: String, required: true }
}, { timestamps: true });

export const Brand = model('Brand', BrandSchema);
