import { Request, Response } from 'express';
import { 
  Product, Customer, Supplier, Bill, PurchaseBill, SalesReturn, 
  Expense, StockMovement, PaymentTransaction, AuditLog, 
  PurchaseOrder, GRN, PurchaseReturn, SupplierCreditNote, SupplierDebitNote,
  Warehouse, WarehouseStock, StockTransfer, SerialNumber, StockAdjustment,
  SecurityNotification, BusinessDetailsModel,
  Employee, Attendance, FixedAsset, RepoDocument, CustomLedger, ManualVoucher, Category, Brand
} from '../models/erp-models';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';
import { getSystemMetrics } from '../utils/observability';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import qrcode from 'qrcode';
import { cache } from '../utils/cache';
import { backgroundQueue } from '../utils/queue';
import { exportToExcel, exportToCsv } from '../utils/import-export';
import { 
  validateGstNumber, validatePanNumber, validateIfscCode, 
  validateHsnCode, validatePhone, validateEmail, validatePincode 
} from '../utils/validation';

// Helper: generate stable/secure random IDs to mimic makeId()
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`;

// Helper: log audit entries
const logAudit = async (shopId: string, user: string, action: string, details: string, oldValue?: string, newValue?: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString();
    await AuditLog.create({
      shopId,
      date: today,
      time,
      user,
      action,
      details,
      oldValue,
      newValue
    });
  } catch (error: any) {
    logger.error(`Failed to record audit log: ${error.message}`);
  }
};

// Helper: Trigger Security Notification
const triggerSecurityNotification = async (shopId: string, type: string, title: string, message: string) => {
  try {
    await SecurityNotification.create({
      shopId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    });
  } catch (err: any) {
    logger.error(`Error triggering notification: ${err.message}`);
  }
};

// ==================================================================
// 1. Settings & Shop Configuration
// ==================================================================
export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) {
      res.status(400).json({ error: 'Shop ID required' });
      return;
    }
    let settings = await BusinessDetailsModel.findOne({ shopId: String(shopId) });
    if (!settings) {
      // Create defaults
      settings = await BusinessDetailsModel.create({
        shopId: String(shopId),
        name: shopId === 'sivasakthi_elec' ? 'SIVASAKTHI ELECTRICALS' : 'MEENATCHI PLUMBINGS',
        address: '12, Main Bazaar Road',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641001',
        phone: '9843210987',
        altPhone: '9443210987',
        email: 'info@electricalerp.com',
        website: 'www.electricalerp.com',
        gstNumber: shopId === 'sivasakthi_elec' ? '33AAAPS482915Z1' : '33BBAPS482915Z2',
        panNumber: 'AAAPS4829F',
        bankName: 'HDFC Bank',
        accountHolder: shopId === 'sivasakthi_elec' ? 'SIVASAKTHI ELECTRICAL STORES' : 'MEENATCHI PIPES AND PLUMBINGS',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0000123',
        branch: 'Coimbatore Main',
        upiId: '9843210987@hdfc',
        invoicePrefix: shopId === 'sivasakthi_elec' ? 'SE' : 'SM',
        termsAndConditions: [
          'Goods once sold will not be returned or exchanged.',
          'Interest at 18% will be charged if payment is not made within 15 days.',
          'All disputes are subject to local district jurisdiction only.'
        ],
        declaration: 'We declare that this invoice shows the actual price of goods described.',
        authorizedSignature: 'Proprietor',
        roundOff: true,
        decimalPlaces: 2
      });
    }
    res.json(settings);
  } catch (error: any) {
    logger.error(`getSettings error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve shop settings' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.body;
    if (!shopId) {
      res.status(400).json({ error: 'Shop ID required' });
      return;
    }
    const updated = await BusinessDetailsModel.findOneAndUpdate(
      { shopId },
      req.body,
      { new: true, upsert: true }
    );
    await logAudit(shopId, req.body.user || 'Administrator', 'Update Settings', 'Modified company settings and remittance details.');
    res.json(updated);
  } catch (error: any) {
    logger.error(`updateSettings error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// ==================================================================
// 2. Master Data: Products CRUD
// ==================================================================
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, id, productCode, barcode, bypassCache } = req.query;
    if (!shopId) {
      res.status(400).json({ error: 'Shop ID required' });
      return;
    }

    // Direct, un-cached query for a single product by ID, Code, or Barcode (Business Requirement 1 & 2)
    if (id) {
      const product = await Product.findById(id);
      if (product) {
        res.json(product);
        return;
      }
    }
    if (productCode) {
      const product = await Product.findOne({ productCode: String(productCode) });
      if (product) {
        res.json(product);
        return;
      }
    }
    if (barcode) {
      const product = await Product.findOne({ barcode: String(barcode) });
      if (product) {
        res.json(product);
        return;
      }
    }

    const cacheKey = `products_shared`;
    const cachedData = cache.get<any[]>(cacheKey);
    if (cachedData && bypassCache !== 'true') {
      res.json(cachedData);
      return;
    }
    const products = await Product.find({}).sort({ createdAt: -1 });
    if (bypassCache !== 'true') {
      cache.set(cacheKey, products, 120); // 2 min TTL
    }
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, name, productCode } = req.body;
    const existing = await Product.findOne({ productCode });
    if (existing) {
      res.status(400).json({ error: `Product code ${productCode} already exists in the shared Product Master` });
      return;
    }

    const payload = {
      ...req.body,
      barcode: req.body.barcode || productCode // fallback to product code for barcode
    };

    const newProd = await Product.create(payload);
    cache.invalidatePrefix('products_');
    await logAudit(shopId, req.body.user || 'Administrator', 'Create Product', `Created new item: ${name} (SKU: ${req.body.sku || 'N/A'})`);
    res.status(201).json(newProd);
  } catch (error: any) {
    res.status(500).json({ error: `Failed to create product: ${error.message}` });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { user, ...updates } = req.body;
    const prod = await Product.findById(id);
    if (!prod) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const updated = await Product.findByIdAndUpdate(id, updates, { new: true });
    cache.invalidatePrefix('products_');
    await logAudit(prod.shopId, user || 'Administrator', 'Update Product', `Updated product ${prod.name} information.`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prod = await Product.findById(id);
    if (!prod) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await Product.findByIdAndDelete(id);
    cache.invalidatePrefix('products_');
    await logAudit(prod.shopId, 'Administrator', 'Delete Product', `Deleted product ${prod.name}`);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// ==================================================================
// 3. Master Data: Customers & Suppliers CRUD
// ==================================================================
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) {
      res.status(400).json({ error: 'Shop ID required' });
      return;
    }
    const cacheKey = `customers_${shopId}`;
    const cachedData = cache.get<any[]>(cacheKey);
    if (cachedData) {
      res.json(cachedData);
      return;
    }
    const customers = await Customer.find({
      $or: [
        { shopId: String(shopId) },
        { shopId: { $exists: false } },
        { shopId: null },
        { shopId: '' }
      ]
    }).sort({ name: 1 });
    cache.set(cacheKey, customers, 120); // 2 min TTL
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, name, mobile } = req.body;
    const newCust = await Customer.create(req.body);
    cache.invalidatePrefix(`customers_${shopId}`);
    await logAudit(shopId, req.body.user || 'Administrator', 'Create Customer', `Added customer: ${name} (${mobile})`);
    res.status(201).json(newCust);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { user, ...updates } = req.body;
    const cust = await Customer.findById(id);
    if (!cust) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    const updated = await Customer.findByIdAndUpdate(id, updates, { new: true });
    cache.invalidatePrefix(`customers_${cust.shopId}`);
    await logAudit(cust.shopId, user || 'Administrator', 'Update Customer', `Modified profile for ${cust.name}`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
};


export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cust = await Customer.findById(id);
    if (!cust) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    await Customer.findByIdAndDelete(id);
    cache.invalidatePrefix(`customers_${cust.shopId}`);
    await logAudit(cust.shopId, 'Administrator', 'Delete Customer', `Removed customer: ${cust.name}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const suppliers = await Supplier.find({
      $or: [
        { shopId: String(shopId) },
        { shopId: { $exists: false } },
        { shopId: null },
        { shopId: '' }
      ]
    }).sort({ name: 1 });
    res.json(suppliers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, name } = req.body;
    const newSupp = await Supplier.create(req.body);
    await logAudit(shopId, req.body.user || 'Administrator', 'Create Supplier', `Added supplier: ${name}`);
    res.status(201).json(newSupp);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { user, ...updates } = req.body;
    const supp = await Supplier.findById(id);
    if (!supp) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }
    const updated = await Supplier.findByIdAndUpdate(id, updates, { new: true });
    await logAudit(supp.shopId, user || 'Administrator', 'Update Supplier', `Modified supplier profile for ${supp.name}`);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

// ==================================================================
// 4. Invoicing / Sales POS Engine
// ==================================================================
export const getNextInvoiceNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) {
      res.status(400).json({ error: 'Shop ID required' });
      return;
    }

    const settings = await BusinessDetailsModel.findOne({ shopId: String(shopId) });
    const prefix = settings ? settings.invoicePrefix : (shopId === 'sivasakthi_elec' ? 'SE' : 'SM');

    let nextSeq = 1;
    if (settings && typeof settings.invoiceCounter === 'number' && settings.invoiceCounter > 0) {
      nextSeq = settings.invoiceCounter + 1;
    } else {
      const totalCount = await Bill.countDocuments({
        shopId: String(shopId),
        status: { $nin: ['hold', 'on_hold'] },
        billNumber: { $regex: new RegExp('^' + prefix + '-') }
      });
      nextSeq = totalCount + 1;
    }

    const nextNum = `${prefix}-${nextSeq.toString().padStart(6, '0')}`;
    res.json({ nextBillNumber: nextNum });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate next bill number' });
  }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const invoices = await Bill.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, customerId, customerName, items, grandTotal, paidAmount, balanceAmount, paymentMode, user } = req.body;

    const isHold = req.body.status === 'hold' || req.body.status === 'on_hold' || req.body.isHold === true;
    const docType = req.body.docType || 'invoice';
    const skipInventoryAndAccounting = 
      isHold || 
      docType === 'quotation' || 
      docType === 'proforma' || 
      docType === 'challan';

    // Generate unique Invoice Number
    const settings = await BusinessDetailsModel.findOne({ shopId });
    const prefix = settings ? settings.invoicePrefix : (shopId === 'sivasakthi_elec' ? 'SE' : 'SM');
    
    let billNumber = req.body.billNumber;
    if (!billNumber || (!isHold && docType === 'invoice')) {
      if (isHold) {
        // Generate temporary Hold bill number
        billNumber = `HOLD-${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      } else if (docType !== 'invoice') {
        const docPrefix = docType === 'quotation' ? 'QT' :
                          docType === 'challan' ? 'DC' :
                          docType === 'proforma' ? 'PI' :
                          docType === 'non_gst' ? 'CSH' :
                          docType === 'sales_return' ? 'SR' :
                          docType === 'purchase_return' ? 'PR' :
                          docType === 'credit_note' ? 'CN' :
                          docType === 'debit_note' ? 'DN' : 'DOC';
        const docCount = await Bill.countDocuments({ shopId, docType });
        billNumber = `${docPrefix}-${(docCount + 1).toString().padStart(6, '0')}`;
      } else {
        const currentSettings = await BusinessDetailsModel.findOne({ shopId });
        const totalCount = await Bill.countDocuments({
          shopId,
          status: { $nin: ['hold', 'on_hold'] },
          billNumber: { $regex: new RegExp('^' + prefix + '-') }
        });

        const baseline = Math.max(currentSettings?.invoiceCounter || 0, totalCount);
        if (!currentSettings || (typeof currentSettings.invoiceCounter !== 'number' || currentSettings.invoiceCounter < baseline)) {
          await BusinessDetailsModel.updateOne(
            { shopId },
            {
              $set: {
                shopId,
                invoicePrefix: prefix,
                invoiceCounter: baseline
              }
            },
            { upsert: true }
          );
        }

        const updatedSettings = await BusinessDetailsModel.findOneAndUpdate(
          { shopId },
          { $inc: { invoiceCounter: 1 } },
          { new: true }
        );

        const nextSequence = updatedSettings?.invoiceCounter ?? baseline + 1;
        billNumber = `${prefix}-${nextSequence.toString().padStart(6, '0')}`;
      }
    }

    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString();

    // Create the invoice record
    const invoice = await Bill.create({
      ...req.body,
      billNumber,
      isHold,
      date,
      time
    });

    if (!skipInventoryAndAccounting) {
      // 1. UPDATE PRODUCT INVENTORY & CREATE STOCK MOVEMENTS
      for (const item of items) {
        const isIdValid = mongoose.Types.ObjectId.isValid(item.productId);
        let prod = isIdValid 
          ? await Product.findOne({ _id: item.productId }) 
          : null;

        if (!prod) {
          // Search Product Master by name, productCode, or barcode to prevent duplicates
          const queryConditions: any[] = [{ name: { $regex: new RegExp('^' + item.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } }];
          if (item.productCode) queryConditions.push({ productCode: item.productCode });
          if (item.barcode) queryConditions.push({ barcode: item.barcode });

          prod = await Product.findOne({
            shopId,
            $or: queryConditions
          });
        }

        if (!prod) {
          // Automatically create a new Product Master record if not found
          const uniqueCode = item.productCode || 'PRD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 10);
          const openStockVal = parseFloat(item.openingStock) || 0;
          prod = await Product.create({
            shopId,
            name: item.name,
            productCode: uniqueCode,
            barcode: item.barcode || '',
            sku: item.sku || '',
            hsnCode: item.hsnCode || '8536',
            category: item.category || 'Electricals',
            brand: item.brand || 'Generic',
            unit: item.unit || 'Nos',
            purchasePrice: Math.round((item.rate || 0) * 0.75),
            sellingPrice: item.rate || 0,
            latestSellingPrice: item.rate || 0,
            mrp: Math.round((item.rate || 0) * 1.25),
            gstPercent: item.gstPercent || 18,
            openingStock: openStockVal,
            stock: openStockVal, // will be decremented below
            isActive: true,
            description: 'Created automatically from Billing POS terminal'
          });

          await logAudit(
            shopId,
            user || 'Administrator',
            'Create Product',
            `Created new item: ${prod.name} (Code: ${prod.productCode}) from billing checkout`
          );
        }

        if (prod) {
          const prevStock = prod.stock;
          
          let qtyChange = 0;
          let nextStock = prevStock;
          let moveType: 'sale' | 'sales_return' | 'purchase_return' = 'sale';
          let moveReason = `Invoice ${billNumber} to ${customerName}`;
          const isReturnDoc = ['sales_return', 'credit_note', 'debit_note'].includes(req.body.docType || 'invoice');

          if (isReturnDoc) {
            qtyChange = item.quantity;
            nextStock = prevStock + qtyChange;
            moveType = 'sales_return';
            moveReason = `${req.body.docType === 'credit_note' ? 'Credit Note' : 'Sales Return'} ${billNumber} to ${customerName}`;
          } else {
            qtyChange = -item.quantity;
            nextStock = Math.max(0, prevStock + qtyChange);
            moveType = req.body.docType === 'purchase_return' ? 'purchase_return' : 'sale';
            moveReason = `${req.body.docType === 'debit_note' ? 'Debit Note' : 'Invoice'} ${billNumber} to ${customerName}`;
          }

          const updateFields: any = { stock: nextStock };
          if (item.rate && item.rate > 0) {
            updateFields.latestSellingPrice = item.rate;
          }
          await Product.updateOne({ _id: prod._id }, { $set: updateFields });

          // Record stock movement
          await StockMovement.create({
            shopId,
            productId: prod._id.toString(),
            date,
            time,
            quantity: qtyChange,
            type: moveType,
            reason: moveReason,
            refId: invoice._id.toString(),
            stockBefore: prevStock,
            stockAfter: nextStock,
            user: user || 'Administrator'
          });

          // Trigger stock threshold warning notification
          if (nextStock <= prod.reorderLevel) {
            await triggerSecurityNotification(
              shopId,
              'low_stock',
              'Critical Stock Shortage Warning',
              `Product "${prod.name}" has hit low threshold (${nextStock} ${prod.unit} left). Reorder immediately.`
            );
          }
        }
      }

      // 2. ADJUST CUSTOMER OUTSTANDING & LOG PAYMENT LEDGER
      if (customerId && customerId !== 'c_walkin') {
        const isCustIdValid = mongoose.Types.ObjectId.isValid(customerId);
        const custDoc = isCustIdValid 
          ? await Customer.findOne({ _id: customerId }) 
          : await Customer.findOne({ shopId, name: customerName });

        if (custDoc) {
          const updateCustFields: any = {};
          
          // Business Requirement 5: Automatically update Customer Master if details changed during billing
          if (customerName && customerName !== custDoc.name) {
            updateCustFields.name = customerName;
          }
          if (req.body.customerMobile && req.body.customerMobile !== custDoc.mobile) {
            updateCustFields.mobile = req.body.customerMobile;
          }
          if (req.body.customerGst && req.body.customerGst !== custDoc.gstNumber) {
            updateCustFields.gstNumber = req.body.customerGst;
          }
          if (req.body.customerAddress && req.body.customerAddress !== custDoc.address) {
            updateCustFields.address = req.body.customerAddress;
          }

          const updateQuery: any = {};
          if (Object.keys(updateCustFields).length > 0) {
            updateQuery.$set = updateCustFields;
          }
          if (balanceAmount > 0) {
            updateQuery.$inc = { outstandingAmount: balanceAmount };
          }

          if (Object.keys(updateQuery).length > 0) {
            await Customer.updateOne({ _id: custDoc._id }, updateQuery);
          }

          // Log receipt transaction if paid amount > 0
          if (paidAmount > 0) {
            await PaymentTransaction.create({
              shopId,
              date,
              partyId: custDoc._id.toString(),
              partyName: customerName,
              partyType: 'customer',
              amount: paidAmount,
              paymentMode,
              type: 'receipt',
              refId: invoice._id.toString(),
              notes: `POS partial/full cash receipt against Invoice ${billNumber}`
            });
          }
        } else {
          // Fallback: if customer is not found by ID or name, but they are a new customer, we create a record
          const newCustDoc = await Customer.create({
            shopId,
            name: customerName,
            mobile: req.body.customerMobile || '9999999999',
            address: req.body.customerAddress || '',
            gstNumber: req.body.customerGst || '',
            outstandingAmount: balanceAmount || 0,
            type: 'retail'
          });

          if (paidAmount > 0) {
            await PaymentTransaction.create({
              shopId,
              date,
              partyId: newCustDoc._id.toString(),
              partyName: customerName,
              partyType: 'customer',
              amount: paidAmount,
              paymentMode,
              type: 'receipt',
              refId: invoice._id.toString(),
              notes: `POS partial/full cash receipt against Invoice ${billNumber}`
            });
          }
        }
      }
    }

    cache.invalidatePrefix('products_');
    cache.invalidatePrefix('customers_');

    await logAudit(shopId, user || 'Administrator', 'Create Invoice', `Billed ${isHold ? 'On-Hold' : 'Invoice'} ${billNumber} for ₹${(grandTotal ?? 0).toFixed(2)} to ${customerName}`);
    res.status(201).json(invoice);
  } catch (error: any) {
    logger.error(`createInvoice error: ${error.message}`);
    res.status(500).json({ error: `Invoice billing failure: ${error.message}` });
  }
};

export const cancelInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, user } = req.body;
    
    let invoice = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      invoice = await Bill.findById(id);
    }
    if (!invoice && id) {
      invoice = await Bill.findOne({ billNumber: id });
    }
    if (!invoice && id) {
      invoice = await Bill.findOne({ id: id });
    }
    if (!invoice && req.body) {
      if (req.body._id && mongoose.Types.ObjectId.isValid(req.body._id)) {
        invoice = await Bill.findById(req.body._id);
      }
      if (!invoice && req.body.id) {
        if (mongoose.Types.ObjectId.isValid(req.body.id)) {
          invoice = await Bill.findById(req.body.id);
        }
        if (!invoice) {
          invoice = await Bill.findOne({ id: req.body.id });
        }
      }
      if (!invoice && req.body.billNumber) {
        invoice = await Bill.findOne({ billNumber: req.body.billNumber });
      }
    }

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (invoice.status === 'cancelled') {
      res.status(400).json({ error: 'Invoice is already cancelled' });
      return;
    }

    // Mark cancelled
    invoice.status = 'cancelled';
    invoice.cancelReason = reason || 'Unspecified cancellation';
    invoice.cancelledAt = new Date().toISOString();
    await invoice.save();

    // Revert inventory & record movements
    for (const item of invoice.items) {
      const isIdValid = mongoose.Types.ObjectId.isValid(item.productId);
      const prod = isIdValid 
        ? await Product.findOne({ _id: item.productId }) 
        : await Product.findOne({ name: item.name });
      if (prod) {
        const prevStock = prod.stock;
        const nextStock = prevStock + item.quantity;
        await Product.updateOne({ _id: prod._id }, { stock: nextStock });

        await StockMovement.create({
          shopId: invoice.shopId,
          productId: prod._id.toString(),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString(),
          quantity: item.quantity,
          type: 'sales_return',
          reason: `Cancelled Invoice Reversal ${invoice.billNumber}`,
          refId: invoice._id.toString(),
          stockBefore: prevStock,
          stockAfter: nextStock,
          user: user || 'Administrator'
        });
      }
    }

    // Revert customer ledger outstandings
    if (invoice.customerId && invoice.customerId !== 'c_walkin') {
      // Deduct grandTotal from customer outstanding
      await Customer.updateOne(
        { _id: invoice.customerId },
        { $inc: { outstandingAmount: -invoice.balanceAmount } }
      );

      // Record adjustment payment transaction
      if (invoice.paidAmount > 0) {
        await PaymentTransaction.create({
          shopId: invoice.shopId,
          date: new Date().toISOString().split('T')[0],
          partyId: invoice.customerId,
          partyName: invoice.customerName,
          partyType: 'customer',
          amount: invoice.paidAmount,
          paymentMode: 'reversal',
          type: 'payment', // payment out back to customer
          refId: invoice._id.toString(),
          notes: `Reversed cash payment due to cancellation of Invoice ${invoice.billNumber}`
        });
      }
    }

    cache.invalidatePrefix('products_');
    cache.invalidatePrefix('customers_');

    await logAudit(invoice.shopId, user || 'Administrator', 'Cancel Invoice', `Cancelled Invoice ${invoice.billNumber}. Reason: ${reason}`);
    res.json({ success: true, message: 'Invoice cancelled successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
};

export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let invoice = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      invoice = await Bill.findById(id);
    }
    if (!invoice && id) {
      invoice = await Bill.findOne({ billNumber: id });
    }
    if (!invoice && id) {
      invoice = await Bill.findOne({ id: id });
    }
    if (!invoice && req.body) {
      if (req.body._id && mongoose.Types.ObjectId.isValid(req.body._id)) {
        invoice = await Bill.findById(req.body._id);
      }
      if (!invoice && req.body.id) {
        if (mongoose.Types.ObjectId.isValid(req.body.id)) {
          invoice = await Bill.findById(req.body.id);
        }
        if (!invoice) {
          invoice = await Bill.findOne({ id: req.body.id });
        }
      }
      if (!invoice && req.body.billNumber) {
        invoice = await Bill.findOne({ billNumber: req.body.billNumber });
      }
    }

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const docType = invoice.docType || 'invoice';
    const isHold = invoice.status === 'hold' || invoice.status === 'on_hold' || invoice.isHold;
    const skipInventoryAndAccounting = 
      isHold || 
      docType === 'quotation' || 
      docType === 'proforma' || 
      docType === 'challan';

    // If the original bill was NOT cancelled and NOT hold/skipped, we must restore stock and ledger outstanding
    if (invoice.status !== 'cancelled' && !skipInventoryAndAccounting) {
      // Revert stock changes
      for (const item of invoice.items) {
        const isIdValid = mongoose.Types.ObjectId.isValid(item.productId);
        const prod = isIdValid 
          ? await Product.findOne({ _id: item.productId }) 
          : await Product.findOne({ shopId: invoice.shopId, name: item.name });
        
        if (prod) {
          const prevStock = prod.stock;
          let qtyChange = 0;
          let nextStock = prevStock;

          const isReturnDoc = ['sales_return', 'credit_note', 'debit_note'].includes(docType);
          if (isReturnDoc) {
            // It added stock, so deletion subtracts stock
            qtyChange = -item.quantity;
            nextStock = Math.max(0, prevStock + qtyChange);
          } else {
            // It subtracted stock, so deletion adds stock back
            qtyChange = item.quantity;
            nextStock = prevStock + qtyChange;
          }

          await Product.updateOne({ _id: prod._id }, { stock: nextStock });

          await StockMovement.create({
            shopId: invoice.shopId,
            productId: prod._id.toString(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString(),
            quantity: qtyChange,
            type: isReturnDoc ? 'sale' : 'sales_return',
            reason: `Deleted Invoice ${invoice.billNumber} Stock Restoration`,
            refId: invoice._id.toString(),
            stockBefore: prevStock,
            stockAfter: nextStock,
            user: 'Administrator'
          });
        }
      }

      // Revert customer outstanding
      if (invoice.customerId && invoice.customerId !== 'c_walkin') {
        const isReturnDoc = ['sales_return', 'credit_note'].includes(docType);
        const isDebitNote = docType === 'debit_note';
        let change = 0;

        if (isReturnDoc) {
          // returns reduce customer outstanding, so deletion increases it
          change = invoice.grandTotal;
        } else if (isDebitNote) {
          // debit note increases outstanding, so deletion reduces it
          change = -invoice.grandTotal;
        } else {
          // standard invoice increases outstanding by balanceAmount, so deletion reduces it
          change = -invoice.balanceAmount;
        }

        await Customer.updateOne(
          { _id: invoice.customerId },
          { $inc: { outstandingAmount: change } }
        );
      }

      // Delete payment transactions
      await PaymentTransaction.deleteMany({ refId: invoice._id.toString() });
    }

    await Bill.findByIdAndDelete(invoice._id);
    cache.invalidatePrefix('products_');
    cache.invalidatePrefix('customers_');
    await logAudit(invoice.shopId, 'Administrator', 'Delete Invoice', `Deleted Invoice ${invoice.billNumber} permanently. Stock and ledger entries restored.`);
    res.json({ success: true });
  } catch (error: any) {
    logger.error(`deleteInvoice error: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let originalBill = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      originalBill = await Bill.findById(id);
    }
    if (!originalBill && id) {
      originalBill = await Bill.findOne({ billNumber: id });
    }
    if (!originalBill && id) {
      originalBill = await Bill.findOne({ id: id });
    }
    if (!originalBill && req.body) {
      if (req.body._id && mongoose.Types.ObjectId.isValid(req.body._id)) {
        originalBill = await Bill.findById(req.body._id);
      }
      if (!originalBill && req.body.id) {
        if (mongoose.Types.ObjectId.isValid(req.body.id)) {
          originalBill = await Bill.findById(req.body.id);
        }
        if (!originalBill) {
          originalBill = await Bill.findOne({ id: req.body.id });
        }
      }
      if (!originalBill && req.body.billNumber) {
        originalBill = await Bill.findOne({ billNumber: req.body.billNumber });
      }
    }

    if (!originalBill) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (originalBill.status === 'cancelled') {
      res.status(400).json({ error: 'Cannot edit a cancelled invoice' });
      return;
    }

    const originalDocType = originalBill.docType || 'invoice';
    const originalIsHold = originalBill.status === 'hold' || originalBill.status === 'on_hold' || originalBill.isHold;
    const originalSkip = 
      originalIsHold || 
      originalDocType === 'quotation' || 
      originalDocType === 'proforma' || 
      originalDocType === 'challan';

    // 1. REVERT ORIGINAL BILL IMPACTS IF IT WAS NOT SKIPPED
    if (!originalSkip) {
      // Revert product stock
      for (const item of originalBill.items) {
        const isIdValid = mongoose.Types.ObjectId.isValid(item.productId);
        const prod = isIdValid 
          ? await Product.findOne({ _id: item.productId }) 
          : await Product.findOne({ shopId: originalBill.shopId, name: item.name });

        if (prod) {
          const prevStock = prod.stock;
          let qtyChange = 0;
          if (['sales_return', 'credit_note'].includes(originalDocType)) {
            // Revert return (which had added stock): deduct stock
            qtyChange = -item.quantity;
          } else {
            // Revert standard (which had deducted stock): add stock back
            qtyChange = item.quantity;
          }
          const nextStock = Math.max(0, prevStock + qtyChange);
          await Product.updateOne({ _id: prod._id }, { stock: nextStock });
        }
      }

      // Revert customer outstanding
      if (originalBill.customerId && originalBill.customerId !== 'c_walkin') {
        const isReturnDoc = ['sales_return', 'credit_note'].includes(originalDocType);
        const isDebitNote = originalDocType === 'debit_note';
        let outstandingChange = 0;

        if (isReturnDoc) {
          // Revert return (which reduced outstanding): add it back
          outstandingChange = originalBill.grandTotal;
        } else if (isDebitNote) {
          // Revert debit note (which increased outstanding): deduct it
          outstandingChange = -originalBill.grandTotal;
        } else {
          // Revert standard (which increased outstanding by balanceAmount): deduct it
          outstandingChange = -originalBill.balanceAmount;
        }

        await Customer.updateOne(
          { _id: originalBill.customerId },
          { $inc: { outstandingAmount: outstandingChange } }
        );
      }

      // Revert payment transactions
      await PaymentTransaction.deleteMany({ refId: originalBill._id.toString() });
    }

    // 2. COMPUTE NEW BILL PREFIX & GENERATE REAL BILL NUMBER IF TRANSITIONING FROM HOLD TO SAVED/PRINTED
    const newIsHold = req.body.status === 'hold' || req.body.status === 'on_hold' || req.body.isHold === true;
    const newDocType = req.body.docType || 'invoice';
    const newSkip = 
      newIsHold || 
      newDocType === 'quotation' || 
      newDocType === 'proforma' || 
      newDocType === 'challan';

    let finalBillNumber = originalBill.billNumber;

    // Check if previously on hold, and now saving as final
    const wasOnHold = originalBill.status === 'hold' || originalBill.status === 'on_hold' || originalBill.isHold || originalBill.billNumber.startsWith('HOLD-');
    const isNowFinal = req.body.status !== 'hold' && req.body.status !== 'on_hold' && !req.body.isHold && !['quotation', 'proforma', 'challan'].includes(newDocType);

    if (wasOnHold && isNowFinal) {
      // Transitioning hold/draft bill to final! We must allocate an official serial invoice number to ensure no gaps or duplicates
      const settings = await BusinessDetailsModel.findOne({ shopId: originalBill.shopId });
      const prefix = settings ? settings.invoicePrefix : (originalBill.shopId === 'sivasakthi_elec' ? 'SE' : 'SM');
      const totalCount = await Bill.countDocuments({ 
        shopId: originalBill.shopId, 
        status: { $nin: ['hold', 'on_hold'] },
        billNumber: { $regex: new RegExp('^' + prefix + '-') } // matching only final numbers
      });
      finalBillNumber = `${prefix}-${(totalCount + 1).toString().padStart(6, '0')}`;
    }

    // 3. APPLY NEW INVOICE IMPACTS IF NEW NOT SKIPPED
    if (!newSkip) {
      const { shopId, customerId, customerName, items, grandTotal, paidAmount, balanceAmount, paymentMode, user } = req.body;
      const date = req.body.date || new Date().toISOString().split('T')[0];
      const time = req.body.time || new Date().toLocaleTimeString();

      // Apply product stock
      for (const item of items) {
        const isIdValid = mongoose.Types.ObjectId.isValid(item.productId);
        let prod = isIdValid 
          ? await Product.findOne({ _id: item.productId }) 
          : await Product.findOne({ shopId: originalBill.shopId, name: item.name });

        if (!prod) {
          // Auto create product master if not found (same as in create)
          const uniqueCode = item.productCode || 'PRD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 10);
          const openStockVal = parseFloat(item.openingStock) || 0;
          prod = await Product.create({
            shopId: originalBill.shopId,
            name: item.name,
            productCode: uniqueCode,
            barcode: item.barcode || '',
            sku: item.sku || '',
            hsnCode: item.hsnCode || '8536',
            category: item.category || 'Electricals',
            brand: item.brand || 'Generic',
            unit: item.unit || 'Nos',
            purchasePrice: Math.round((item.rate || 0) * 0.75),
            sellingPrice: item.rate || 0,
            latestSellingPrice: item.rate || 0,
            mrp: Math.round((item.rate || 0) * 1.25),
            gstPercent: item.gstPercent || 18,
            openingStock: openStockVal,
            stock: openStockVal,
            isActive: true,
            description: 'Created automatically from Billing POS terminal during Edit'
          });
        }

        const prevStock = prod.stock;
        let qtyChange = 0;
        let moveType: 'sale' | 'sales_return' | 'purchase_return' = 'sale';
        let moveReason = `Edited Invoice ${finalBillNumber} to ${customerName}`;

        if (['sales_return', 'credit_note', 'debit_note'].includes(newDocType)) {
          qtyChange = item.quantity;
          moveType = 'sales_return';
          moveReason = `Edited Return ${finalBillNumber} to ${customerName}`;
        } else {
          qtyChange = -item.quantity;
          moveType = 'sale';
          moveReason = `Edited Invoice ${finalBillNumber} to ${customerName}`;
        }

        const nextStock = Math.max(0, prevStock + qtyChange);
        const updateFields: any = { stock: nextStock };
        if (item.rate && item.rate > 0) {
          updateFields.latestSellingPrice = item.rate;
        }
        await Product.updateOne({ _id: prod._id }, { $set: updateFields });

        // Record stock movement
        await StockMovement.create({
          shopId: originalBill.shopId,
          productId: prod._id.toString(),
          date,
          time,
          quantity: qtyChange,
          type: moveType,
          reason: moveReason,
          refId: originalBill._id.toString(),
          stockBefore: prevStock,
          stockAfter: nextStock,
          user: user || 'Administrator'
        });
      }

      // Apply customer outstanding
      if (customerId && customerId !== 'c_walkin') {
        const isCustIdValid = mongoose.Types.ObjectId.isValid(customerId);
        const custDoc = isCustIdValid 
          ? await Customer.findOne({ _id: customerId }) 
          : await Customer.findOne({ shopId: originalBill.shopId, name: customerName });

        if (custDoc) {
          const isReturnDoc = ['sales_return', 'credit_note'].includes(newDocType);
          const isDebitNote = newDocType === 'debit_note';
          let outstandingChange = 0;

          if (isReturnDoc) {
            outstandingChange = -grandTotal;
          } else if (isDebitNote) {
            outstandingChange = grandTotal;
          } else {
            outstandingChange = balanceAmount;
          }

          await Customer.updateOne(
            { _id: custDoc._id },
            { $inc: { outstandingAmount: outstandingChange } }
          );

          // Log payment transaction
          if (paidAmount > 0) {
            await PaymentTransaction.create({
              shopId: originalBill.shopId,
              date,
              partyId: custDoc._id.toString(),
              partyName: customerName,
              partyType: 'customer',
              amount: paidAmount,
              paymentMode,
              type: 'receipt',
              refId: originalBill._id.toString(),
              notes: `POS receipt against Edited Invoice ${finalBillNumber}`
            });
          }
        }
      }
    }

    // 4. PERFORM THE DATABASE UPDATE ON THE BILL
    const updatedInvoice = await Bill.findByIdAndUpdate(
      originalBill._id,
      {
        ...req.body,
        billNumber: finalBillNumber,
        isHold: newIsHold,
        status: req.body.status
      },
      { new: true }
    );

    cache.invalidatePrefix('products_');
    cache.invalidatePrefix('customers_');

    await logAudit(
      originalBill.shopId,
      req.body.user || 'Administrator',
      'Edit Invoice',
      `Updated Invoice ${finalBillNumber} from ₹${(originalBill.grandTotal ?? 0).toFixed(2)} to ₹${(req.body.grandTotal ?? 0).toFixed(2)}.`
    );

    res.json(updatedInvoice);
  } catch (error: any) {
    logger.error(`updateInvoice error: ${error.message}`);
    res.status(500).json({ error: `Invoice update failed: ${error.message}` });
  }
};

// ==================================================================
// 5. Procurement / Purchase System
// ==================================================================
export const getPurchases = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const purchases = await PurchaseBill.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
};

export const createPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, supplierId, supplierName, items, grandTotal, paidAmount, balanceAmount, paymentMode, user } = req.body;

    const totalCount = await PurchaseBill.countDocuments({ shopId });
    const purchaseNumber = `PB-${(totalCount + 1).toString().padStart(6, '0')}`;
    const date = new Date().toISOString().split('T')[0];

    const purchase = await PurchaseBill.create({
      ...req.body,
      purchaseNumber,
      date
    });

    // 1. ADD PRODUCTS INVENTORY & CREATE MOVEMENTS
    for (const item of items) {
      const isIdValid = mongoose.Types.ObjectId.isValid(item.productId);
      const prod = isIdValid 
        ? await Product.findOne({ _id: item.productId }) 
        : await Product.findOne({ name: item.name });
      if (prod) {
        const prevStock = prod.stock;
        const nextStock = prevStock + item.quantity;
        await Product.updateOne({ _id: prod._id }, { 
          stock: nextStock,
          latestPurchaseCost: item.purchaseRate,
          lastPurchaseDate: date
        });

        await StockMovement.create({
          shopId,
          productId: prod._id.toString(),
          date,
          time: new Date().toLocaleTimeString(),
          quantity: item.quantity,
          type: 'purchase',
          reason: `Procured stock via Purchase Bill ${purchaseNumber}`,
          refId: purchase._id.toString(),
          stockBefore: prevStock,
          stockAfter: nextStock,
          user: user || 'Administrator'
        });
      }
    }

    // 2. ADJUST SUPPLIER OUTSTANDING
    if (supplierId) {
      if (balanceAmount > 0) {
        await Supplier.updateOne({ _id: supplierId }, { $inc: { outstandingAmount: balanceAmount } });
      }

      if (paidAmount > 0) {
        await PaymentTransaction.create({
          shopId,
          date,
          partyId: supplierId,
          partyName: supplierName,
          partyType: 'supplier',
          amount: paidAmount,
          paymentMode,
          type: 'payment', // payment goes out to supplier
          refId: purchase._id.toString(),
          notes: `Paid supply balance against Purchase Bill ${purchaseNumber}`
        });
      }
    }

    await logAudit(shopId, user || 'Administrator', 'Create Purchase', `Recorded Purchase Bill ${purchaseNumber} for ₹${(grandTotal ?? 0).toFixed(2)} from ${supplierName}`);
    res.status(201).json(purchase);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record purchase bill' });
  }
};

// ==================================================================
// 6. Returns (Sales Return & Credit Notes)
// ==================================================================
export const getSalesReturns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const returns = await SalesReturn.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(returns);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch sales returns' });
  }
};

export const createSalesReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, customerId, customerName, items, originalBillNumber, differenceAmount, refundMode, refundAmount, user } = req.body;

    const returnCount = await SalesReturn.countDocuments({ shopId });
    const returnNumber = `SR-${(returnCount + 1).toString().padStart(6, '0')}`;
    const date = new Date().toISOString().split('T')[0];

    let creditNoteNumber = undefined;
    let creditNoteAmount = 0;

    if (refundMode === 'credit_adjustment') {
      const cnCount = await SalesReturn.countDocuments({ shopId, refundMode: 'credit_adjustment' });
      creditNoteNumber = `CN-${(cnCount + 1).toString().padStart(6, '0')}`;
      creditNoteAmount = Math.max(0, -differenceAmount);
    }

    const salesReturn = await SalesReturn.create({
      ...req.body,
      returnNumber,
      date,
      creditNoteNumber,
      creditNoteAmount
    });

    // Restore stock and log movements
    for (const item of items) {
      const isIdValid = mongoose.Types.ObjectId.isValid(item.productId);
      const prod = isIdValid 
        ? await Product.findOne({ _id: item.productId }) 
        : await Product.findOne({ name: item.name });
      if (prod) {
        const prevStock = prod.stock;
        const nextStock = prevStock + item.quantity;
        await Product.updateOne({ _id: prod._id }, { stock: nextStock });

        await StockMovement.create({
          shopId,
          productId: prod._id.toString(),
          date,
          time: new Date().toLocaleTimeString(),
          quantity: item.quantity,
          type: 'sales_return',
          reason: `Sales Return ${returnNumber} of Invoice ${originalBillNumber}`,
          refId: salesReturn._id.toString(),
          stockBefore: prevStock,
          stockAfter: nextStock,
          user: user || 'Administrator'
        });
      }
    }

    // Record credit refund in ledger
    if (customerId && customerId !== 'c_walkin') {
      if (refundMode === 'credit_adjustment') {
        await Customer.updateOne(
          { _id: customerId },
          { $inc: { outstandingAmount: differenceAmount } } // negative diff reduces outstanding
        );

        await PaymentTransaction.create({
          shopId,
          date,
          partyId: customerId,
          partyName: customerName,
          partyType: 'customer',
          amount: Math.abs(differenceAmount),
          paymentMode: 'credit_adjustment',
          type: differenceAmount < 0 ? 'payment' : 'receipt',
          refId: salesReturn._id.toString(),
          notes: `Ledger credit note adjustment for Return ${returnNumber}`
        });
      } else if (refundAmount > 0) {
        await PaymentTransaction.create({
          shopId,
          date,
          partyId: customerId,
          partyName: customerName,
          partyType: 'customer',
          amount: refundAmount,
          paymentMode: refundMode,
          type: 'payment',
          refId: salesReturn._id.toString(),
          notes: `Immediate refund payment for Sales Return ${returnNumber}`
        });
      }
    }

    await logAudit(shopId, user || 'Administrator', 'Sales Return', `Created sales return ${returnNumber} for Invoice ${originalBillNumber}. Refund: ₹${refundAmount}`);
    res.status(201).json(salesReturn);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record sales return' });
  }
};

// ==================================================================
// 7. Core Payments & Ledger Transactions
// ==================================================================
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const payments = await PaymentTransaction.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch financial payments' });
  }
};

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, partyId, partyName, partyType, amount, paymentMode, type, notes, user } = req.body;
    const date = new Date().toISOString().split('T')[0];

    const payment = await PaymentTransaction.create({
      ...req.body,
      date
    });

    if (partyType === 'customer') {
      // customer receipt reduces customer outstanding
      const adjustment = type === 'receipt' ? -amount : amount;
      await Customer.updateOne({ _id: partyId }, { $inc: { outstandingAmount: adjustment } });
      await logAudit(shopId, user || 'Administrator', 'Customer Payment', `Recorded ${type} of ₹${amount} from customer ${partyName}`);
    } else {
      // supplier payment reduces shop's outstanding to them
      const adjustment = type === 'payment' ? -amount : amount;
      await Supplier.updateOne({ _id: partyId }, { $inc: { outstandingAmount: adjustment } });
      await logAudit(shopId, user || 'Administrator', 'Supplier Payment', `Recorded ${type} of ₹${amount} to supplier ${partyName}`);
    }

    res.status(201).json(payment);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to record ledger payment' });
  }
};

// ==================================================================
// 8. Operational Expenses CRUD
// ==================================================================
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const expenses = await Expense.find({ shopId: String(shopId) }).sort({ date: -1 });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, category, amount, description, paymentMode, user } = req.body;
    const date = new Date().toISOString().split('T')[0];

    const expense = await Expense.create({
      shopId,
      date,
      category,
      amount,
      description,
      paymentMode
    });

    await logAudit(shopId, user || 'Administrator', 'Add Expense', `Recorded Operational expense: ${category} of ₹${amount}`);
    res.status(201).json(expense);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exp = await Expense.findById(id);
    if (!exp) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }
    await Expense.findByIdAndDelete(id);
    await logAudit(exp.shopId, 'Administrator', 'Delete Expense', `Deleted expense categorised: ${exp.category} of ₹${exp.amount}`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// ==================================================================
// 9. Advanced Inventory Management
// ==================================================================
export const getWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const WH = await Warehouse.find({ shopId: String(shopId) });
    res.json(WH);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
};

export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, name, location, isDefault, user } = req.body;
    const wh = await Warehouse.create(req.body);
    await logAudit(shopId, user || 'Administrator', 'Add Warehouse', `Configured Warehouse Store: ${name}`);
    res.status(201).json(wh);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
};

export const getWarehouseStocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const stocks = await WarehouseStock.find({ shopId: String(shopId) });
    res.json(stocks);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch warehouse stock levels' });
  }
};

export const createStockTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, fromWarehouseId, fromWarehouseName, toWarehouseId, toWarehouseName, productId, productName, quantity, user } = req.body;
    
    const count = await StockTransfer.countDocuments({ shopId });
    const transferNumber = `ST-${(count + 1).toString().padStart(6, '0')}`;
    const transferDate = new Date().toISOString().split('T')[0];

    const transfer = await StockTransfer.create({
      ...req.body,
      transferNumber,
      transferDate,
      status: 'completed'
    });

    // 1. Deduct from 'from' warehouse stock
    const fromStock = await WarehouseStock.findOne({ shopId, productId, warehouseId: fromWarehouseId });
    if (fromStock) {
      const nextStock = Math.max(0, fromStock.currentStock - quantity);
      await WarehouseStock.updateOne(
        { _id: fromStock._id },
        { currentStock: nextStock, availableStock: nextStock - fromStock.reservedStock }
      );
    }

    // 2. Add to 'to' warehouse stock
    const toStock = await WarehouseStock.findOne({ shopId, productId, warehouseId: toWarehouseId });
    if (toStock) {
      const nextStock = toStock.currentStock + quantity;
      await WarehouseStock.updateOne(
        { _id: toStock._id },
        { currentStock: nextStock, availableStock: nextStock - toStock.reservedStock }
      );
    } else {
      await WarehouseStock.create({
        shopId,
        productId,
        warehouseId: toWarehouseId,
        currentStock: quantity,
        reservedStock: 0,
        availableStock: quantity
      });
    }

    await logAudit(shopId, user || 'Administrator', 'Warehouse Stock Transfer', `Transferred ${quantity} Nos of ${productName} from ${fromWarehouseName} to ${toWarehouseName}`);
    res.status(201).json(transfer);
  } catch (error: any) {
    res.status(500).json({ error: 'Stock transfer operation failed' });
  }
};

export const createStockAdjustment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, productId, productName, warehouseId, warehouseName, previousQuantity, updatedQuantity, adjustedQuantity, reason, notes, user } = req.body;

    const count = await StockAdjustment.countDocuments({ shopId });
    const adjustmentNumber = `ADJ-${(count + 1).toString().padStart(6, '0')}`;
    const date = new Date().toISOString().split('T')[0];

    const adj = await StockAdjustment.create({
      ...req.body,
      adjustmentNumber,
      date
    });

    // Update warehouse stock
    const ws = await WarehouseStock.findOne({ shopId, productId, warehouseId });
    if (ws) {
      await WarehouseStock.updateOne(
        { _id: ws._id },
        { currentStock: updatedQuantity, availableStock: updatedQuantity - ws.reservedStock }
      );
    } else {
      await WarehouseStock.create({
        shopId,
        productId,
        warehouseId,
        currentStock: updatedQuantity,
        reservedStock: 0,
        availableStock: updatedQuantity
      });
    }

    // Update global product stock total
    await Product.updateOne(
      { _id: productId },
      { $inc: { stock: adjustedQuantity } }
    );

    // Record product movement
    await StockMovement.create({
      shopId,
      productId,
      date,
      time: new Date().toLocaleTimeString(),
      quantity: adjustedQuantity,
      type: 'adjustment',
      reason: `Manual Adjustment ${adjustmentNumber}: ${reason}`,
      refId: adj._id.toString(),
      stockBefore: previousQuantity,
      stockAfter: updatedQuantity,
      user: user || 'Administrator'
    });

    await logAudit(shopId, user || 'Administrator', 'Professional Stock Adjustment', `Adjusted product ${productName} inside warehouse ${warehouseName} by ${adjustedQuantity > 0 ? '+' : ''}${adjustedQuantity}`);
    res.status(201).json(adj);
  } catch (error: any) {
    res.status(500).json({ error: 'Manual Stock adjustment failed' });
  }
};

// ==================================================================
// 10. Audit Logs & System Notifications
// ==================================================================
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const logs = await AuditLog.find({ shopId: String(shopId) }).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
};

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    const notifications = await SecurityNotification.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notification alerts' });
  }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await SecurityNotification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to clear alert' });
  }
};

// ==================================================================
// 11. PDF Document Generation (PDFKit)
// ==================================================================
export const generateInvoicePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let bill = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      bill = await Bill.findById(id);
    }
    if (!bill && id) {
      bill = await Bill.findOne({ billNumber: id });
    }
    if (!bill && id) {
      bill = await Bill.findOne({ id: id });
    }
    if (!bill && req.body) {
      if (req.body._id && mongoose.Types.ObjectId.isValid(req.body._id)) {
        bill = await Bill.findById(req.body._id);
      }
      if (!bill && req.body.id) {
        if (mongoose.Types.ObjectId.isValid(req.body.id)) {
          bill = await Bill.findById(req.body.id);
        }
        if (!bill) {
          bill = await Bill.findOne({ id: req.body.id });
        }
      }
      if (!bill && req.body.billNumber) {
        bill = await Bill.findOne({ billNumber: req.body.billNumber });
      }
    }
    if (!bill) {
      res.status(404).send('Invoice not found');
      return;
    }

    const business = await BusinessDetailsModel.findOne({ shopId: bill.shopId });
    const biz = business || {
      name: bill.shopId === 'sivasakthi_elec' ? 'SIVASAKTHI ELECTRICALS' : 'MEENATCHI PLUMBINGS',
      address: '12, Main Bazaar Road, Coimbatore',
      phone: '9843210987',
      email: 'info@electricalerp.com',
      gstNumber: '33AAAPS482915Z1',
      bankName: 'HDFC Bank',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000123'
    };

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    
    // Set response headers to direct browser rendering / download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${bill.billNumber}.pdf"`);
    doc.pipe(res);

    // Header Branding Section
    doc.fillColor('#000000')
       .font('Helvetica-Bold')
       .fontSize(18)
       .text(biz.name.toUpperCase(), 40, 40);
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#4b5563')
       .text(biz.address, 40, 60)
       .text(`Phone: ${biz.phone} | Email: ${biz.email}`, 40, 72)
       .text(`GSTIN: ${biz.gstNumber}`, 40, 84);

    // Invoice Meta Information Block (Right-aligned)
    doc.fillColor('#000000')
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('TAX INVOICE', 400, 40, { align: 'right' });
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#4b5563')
       .text(`Invoice No: ${bill.billNumber}`, 400, 55, { align: 'right' })
       .text(`Date: ${bill.date}`, 400, 67, { align: 'right' })
       .text(`Payment Mode: ${bill.paymentMode.toUpperCase()}`, 400, 79, { align: 'right' });

    doc.moveTo(40, 105).lineTo(550, 105).strokeColor('#d1d5db').stroke();

    // Client/Party details
    doc.fillColor('#000000')
       .font('Helvetica-Bold')
       .fontSize(10)
       .text('BILL TO:', 40, 118);
    doc.font('Helvetica-Bold')
       .fontSize(11)
       .text(bill.customerName, 40, 130);
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#4b5563')
       .text(`Mobile: ${bill.customerMobile}`, 40, 143)
       if (bill.customerGst) {
         doc.text(`GSTIN: ${bill.customerGst}`, 40, 155);
       }

    doc.moveTo(40, 180).lineTo(550, 180).strokeColor('#e5e7eb').stroke();

    // Invoice Items Table Headers
    let y = 195;
    doc.fillColor('#1f2937')
       .font('Helvetica-Bold')
       .fontSize(9);
    doc.text('S.No', 40, y);
    doc.text('Item Specification', 80, y);
    doc.text('Qty', 300, y, { width: 40, align: 'center' });
    doc.text('Rate (Rs)', 350, y, { width: 60, align: 'right' });
    doc.text('GST %', 420, y, { width: 40, align: 'center' });
    doc.text('Total (Rs)', 470, y, { width: 80, align: 'right' });

    doc.moveTo(40, y + 15).lineTo(550, y + 15).strokeColor('#9ca3af').stroke();
    
    // Render Products Table rows
    y = y + 25;
    doc.font('Helvetica').fontSize(9).fillColor('#374151');
    bill.items.forEach((item: any, idx: number) => {
      doc.text(`${idx + 1}`, 40, y);
      doc.text(item.name, 80, y, { width: 210 });
      doc.text(`${item.quantity} ${item.unit || 'Nos'}`, 300, y, { width: 40, align: 'center' });
      doc.text(`${(item.rate ?? 0).toFixed(2)}`, 350, y, { width: 60, align: 'right' });
      doc.text(`${item.gstPercent}%`, 420, y, { width: 40, align: 'center' });
      doc.text(`${(item.total ?? 0).toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      y += 20;
    });

    doc.moveTo(40, y + 5).lineTo(550, y + 5).strokeColor('#d1d5db').stroke();

    // Calculations & Totals (Right columns)
    y = y + 15;
    doc.font('Helvetica').fontSize(9).fillColor('#4b5563');
    doc.text('Subtotal:', 350, y, { width: 100, align: 'right' });
    doc.font('Helvetica-Bold').fillColor('#000000').text(`Rs. ${(bill.subtotal ?? 0).toFixed(2)}`, 470, y, { width: 80, align: 'right' });

    if (bill.discountAmount > 0) {
      y += 15;
      doc.font('Helvetica').fillColor('#ef4444').text(`Discount (${bill.discountPercent}%):`, 350, y, { width: 100, align: 'right' });
      doc.font('Helvetica-Bold').text(`- Rs. ${(bill.discountAmount ?? 0).toFixed(2)}`, 470, y, { width: 80, align: 'right' });
    }

    y += 15;
    doc.font('Helvetica').fillColor('#4b5563').text('CGST Collected:', 350, y, { width: 100, align: 'right' });
    doc.text(`Rs. ${(bill.cgst ?? 0).toFixed(2)}`, 470, y, { width: 80, align: 'right' });

    y += 15;
    doc.text('SGST Collected:', 350, y, { width: 100, align: 'right' });
    doc.text(`Rs. ${(bill.sgst ?? 0).toFixed(2)}`, 470, y, { width: 80, align: 'right' });

    y += 15;
    doc.moveTo(350, y).lineTo(550, y).strokeColor('#9ca3af').stroke();

    y += 10;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000').text('Grand Total:', 350, y, { width: 100, align: 'right' });
    doc.text(`Rs. ${(bill.grandTotal ?? 0).toFixed(2)}`, 470, y, { width: 80, align: 'right' });

    // Payment Info & Bank details (Bottom-Left)
    let bottomY = 480;
    doc.rect(40, bottomY, 280, 85).strokeColor('#e5e7eb').stroke();
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1f2937').text('REMITTANCE BANK DETAILS:', 50, bottomY + 10);
    doc.font('Helvetica').fontSize(8).fillColor('#4b5563')
       .text(`A/C Holder: ${biz.name}`, 50, bottomY + 22)
       .text(`Bank Name: ${biz.bankName}`, 50, bottomY + 34)
       .text(`A/C Number: ${biz.accountNumber}`, 50, bottomY + 46)
       .text(`IFSC Code: ${biz.ifscCode}`, 50, bottomY + 58);

    // Terms and signature
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1f2937').text('Terms & Conditions:', 40, bottomY + 105);
    doc.font('Helvetica').fontSize(7.5).fillColor('#6b7280')
       .text('1. Goods once sold will not be taken back.', 40, bottomY + 117)
       .text('2. Subject to local district jurisdiction only.', 40, bottomY + 127)
       .text('3. Interest at 18% p.a will be charged on overdue payments.', 40, bottomY + 137);

    // Signature Area
    doc.moveTo(400, bottomY + 120).lineTo(530, bottomY + 120).strokeColor('#9ca3af').stroke();
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000').text('AUTHORIZED SIGNATORY', 400, bottomY + 125, { width: 130, align: 'center' });

    doc.end();
  } catch (error: any) {
    logger.error(`PDF generation failure: ${error.message}`);
    res.status(500).send('Internal Server Error generating PDF');
  }
};

// ==================================================================
// 12. Backup Utility (Full Database Export / Import)
// ==================================================================
export const exportDatabaseBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = String(req.query.shopId || '');
    if (!shopId) {
      res.status(400).json({ error: 'Shop ID is required' });
      return;
    }

    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      shopId,
      products: await Product.find({}),
      customers: await Customer.find({ shopId }),
      suppliers: await Supplier.find({ shopId }),
      bills: await Bill.find({ shopId }),
      purchases: await PurchaseBill.find({ shopId }),
      salesReturns: await SalesReturn.find({ shopId }),
      expenses: await Expense.find({ shopId }),
      stockMovements: await StockMovement.find({ shopId }),
      payments: await PaymentTransaction.find({ shopId }),
      auditLogs: await AuditLog.find({ shopId }),
      settings: await BusinessDetailsModel.findOne({ shopId })
    };

    res.json({
      success: true,
      backupString: Buffer.from(JSON.stringify(backupData)).toString('base64')
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export backup data' });
  }
};

export const importDatabaseBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, backupString } = req.body;
    if (!shopId || !backupString) {
      res.status(400).json({ error: 'Shop ID and backup string are required' });
      return;
    }

    const decoded = Buffer.from(backupString, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    if (parsed.shopId !== shopId) {
      res.status(400).json({ error: 'Error: Backup mismatch! This backup belongs to another shop.' });
      return;
    }

    // Clear and restore Products
    if (parsed.products) {
      await Product.deleteMany({ shopId });
      await Product.insertMany(parsed.products);
    }
    // Restore Customers
    if (parsed.customers) {
      await Customer.deleteMany({ shopId });
      await Customer.insertMany(parsed.customers);
    }
    // Restore Suppliers
    if (parsed.suppliers) {
      await Supplier.deleteMany({ shopId });
      await Supplier.insertMany(parsed.suppliers);
    }
    // Restore Bills
    if (parsed.bills) {
      await Bill.deleteMany({ shopId });
      await Bill.insertMany(parsed.bills);
    }
    // Restore Purchases
    if (parsed.purchases) {
      await PurchaseBill.deleteMany({ shopId });
      await PurchaseBill.insertMany(parsed.purchases);
    }
    // Restore SalesReturns
    if (parsed.salesReturns) {
      await SalesReturn.deleteMany({ shopId });
      await SalesReturn.insertMany(parsed.salesReturns);
    }
    // Restore Expenses
    if (parsed.expenses) {
      await Expense.deleteMany({ shopId });
      await Expense.insertMany(parsed.expenses);
    }
    // Restore Movements
    if (parsed.stockMovements) {
      await StockMovement.deleteMany({ shopId });
      await StockMovement.insertMany(parsed.stockMovements);
    }
    // Restore Payments
    if (parsed.payments) {
      await PaymentTransaction.deleteMany({ shopId });
      await PaymentTransaction.insertMany(parsed.payments);
    }
    // Restore Settings
    if (parsed.settings) {
      await BusinessDetailsModel.deleteMany({ shopId });
      await BusinessDetailsModel.create(parsed.settings);
    }

    await logAudit(shopId, req.body.user || 'Administrator', 'Import Database', 'Imported enterprise database state from backup file');
    res.json({ success: true, message: 'Database state restored successfully' });
  } catch (error: any) {
    res.status(500).json({ error: `Import failed: ${error.message}` });
  }
};

// ==================================================================
// 13. Categories & Brands
// ==================================================================
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const list = await Category.find({ shopId: String(shopId) });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, name } = req.body;
    const item = await Category.create({ shopId, name });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const list = await Brand.find({ shopId: String(shopId) });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, name } = req.body;
    const item = await Brand.create({ shopId, name });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 14. Employees & Attendance (Payroll)
// ==================================================================
export const getEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const list = await Employee.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.body;
    const item = await Employee.create(req.body);
    await logAudit(shopId, req.body.user || 'Admin', 'Create Employee', `Registered employee ${req.body.name}`);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await Employee.findByIdAndUpdate(id, req.body, { new: true });
    if (item) {
      await logAudit(item.shopId, req.body.user || 'Admin', 'Update Employee', `Modified employee details for ${item.name}`);
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await Employee.findByIdAndDelete(id);
    if (item) {
      await logAudit(item.shopId, 'Admin', 'Delete Employee', `Deleted employee profile for ${item.name}`);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const list = await Attendance.find({ shopId: String(shopId) });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const recordAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, records } = req.body;
    if (Array.isArray(records)) {
      for (const rec of records) {
        await Attendance.findOneAndUpdate(
          { shopId, employeeId: rec.employeeId, date: rec.date },
          rec,
          { upsert: true, new: true }
        );
      }
    }
    await logAudit(shopId, req.body.user || 'Admin', 'Record Attendance', `Recorded attendance sheets`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 15. Fixed Assets Module
// ==================================================================
export const getFixedAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const list = await FixedAsset.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createFixedAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.body;
    const item = await FixedAsset.create(req.body);
    await logAudit(shopId, req.body.user || 'Admin', 'Record Asset', `Acquired corporate asset ${req.body.name}`);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFixedAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await FixedAsset.findByIdAndDelete(id);
    if (item) {
      await logAudit(item.shopId, 'Admin', 'Dispose Asset', `Retired corporate asset ${item.name}`);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 16. Document Management
// ==================================================================
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const list = await RepoDocument.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.body;
    const item = await RepoDocument.create(req.body);
    await logAudit(shopId, req.body.user || 'Admin', 'Upload Document', `Uploaded document ${req.body.name}`);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await RepoDocument.findByIdAndDelete(id);
    if (item) {
      await logAudit(item.shopId, 'Admin', 'Delete Document', `Deleted document ${item.name} from archives`);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 17. Custom Ledgers & Manual Bookkeeping Vouchers
// ==================================================================
export const getCustomLedgers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const list = await CustomLedger.find({ shopId: String(shopId) });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCustomLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.body;
    const item = await CustomLedger.create(req.body);
    await logAudit(shopId, req.body.user || 'Admin', 'Create Ledger', `Created custom accounting ledger ${req.body.name}`);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getManualVouchers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const list = await ManualVoucher.find({ shopId: String(shopId) }).sort({ createdAt: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createManualVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.body;
    const item = await ManualVoucher.create(req.body);
    await logAudit(shopId, req.body.user || 'Admin', 'Post Voucher', `Posted manual accounting voucher ${req.body.voucherNo}`);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 18. Reports: GST Outputs & ITC inputs Calculations
// ==================================================================
export const getGstReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, startDate, endDate } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }

    const query: any = { shopId: String(shopId) };
    if (startDate && endDate) {
      query.date = { $gte: String(startDate), $lte: String(endDate) };
    }

    const invoices = await Bill.find({ ...query, status: { $ne: 'cancelled' }, docType: 'invoice' });
    const purchases = await PurchaseBill.find(query);

    let b2bInvoices = 0;
    let b2cInvoices = 0;
    let cgstOutput = 0;
    let sgstOutput = 0;
    let igstOutput = 0;
    let totalOutputTax = 0;
    let totalSales = 0;

    let cgstInput = 0;
    let sgstInput = 0;
    let totalInputTax = 0;
    let totalPurchasesValue = 0;

    const hsnSummaryMap: Record<string, { quantity: number; taxableValue: number; cgst: number; sgst: number; total: number }> = {};

    invoices.forEach(inv => {
      totalSales += inv.grandTotal;
      cgstOutput += inv.cgst;
      sgstOutput += inv.sgst;
      igstOutput += inv.igst;
      totalOutputTax += (inv.cgst + inv.sgst + inv.igst);

      if (inv.customerGst) {
        b2bInvoices += inv.grandTotal;
      } else {
        b2cInvoices += inv.grandTotal;
      }

      inv.items.forEach(item => {
        const hsn = item.hsnCode || '8544';
        if (!hsnSummaryMap[hsn]) {
          hsnSummaryMap[hsn] = { quantity: 0, taxableValue: 0, cgst: 0, sgst: 0, total: 0 };
        }
        hsnSummaryMap[hsn].quantity += item.quantity;
        hsnSummaryMap[hsn].taxableValue += item.taxableValue;
        hsnSummaryMap[hsn].cgst += item.cgst;
        hsnSummaryMap[hsn].sgst += item.sgst;
        hsnSummaryMap[hsn].total += item.total;
      });
    });

    purchases.forEach(pur => {
      totalPurchasesValue += pur.grandTotal;
      cgstInput += pur.gstAmount / 2;
      sgstInput += pur.gstAmount / 2;
      totalInputTax += pur.gstAmount;
    });

    res.json({
      gstr1: {
        b2bTotal: b2bInvoices,
        b2cTotal: b2cInvoices,
        totalSales,
        totalGstCollected: totalOutputTax,
        cgst: cgstOutput,
        sgst: sgstOutput,
        igst: igstOutput
      },
      gstr3b: {
        itcAvailable: totalInputTax,
        eligibleCgst: cgstInput,
        eligibleSgst: sgstInput,
        taxPayable: totalOutputTax,
        netTaxLiability: Math.max(0, totalOutputTax - totalInputTax)
      },
      hsnSummary: Object.entries(hsnSummaryMap).map(([hsn, data]) => ({
        hsnCode: hsn,
        ...data
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 19. Dashboard BI & Analytics Engine
// ==================================================================
export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }

    const billsList = await Bill.find({ shopId: String(shopId), status: { $ne: 'cancelled' } });
    const purchasesList = await PurchaseBill.find({ shopId: String(shopId) });
    const expensesList = await Expense.find({ shopId: String(shopId) });
    const productsList = await Product.find({});

    let totalSales = 0;
    let cashSales = 0;
    let upiSales = 0;
    let creditSales = 0;

    billsList.forEach(b => {
      totalSales += b.grandTotal;
      if (b.paymentMode === 'cash') cashSales += b.grandTotal;
      else if (b.paymentMode === 'upi') upiSales += b.grandTotal;
      else if (b.paymentMode === 'credit') creditSales += b.grandTotal;
      else if (b.paymentMode === 'split' && b.splitPayments) {
        cashSales += b.splitPayments.cash || 0;
        upiSales += b.splitPayments.upi || 0;
      }
    });

    let totalPurchases = purchasesList.reduce((sum, p) => sum + p.grandTotal, 0);
    let totalExpenses = expensesList.reduce((sum, e) => sum + e.amount, 0);

    const categorySalesMap: Record<string, number> = {};
    billsList.forEach(b => {
      b.items.forEach(item => {
        const cat = item.productId ? (productsList.find(p => p.productCode === item.productId || p._id.toString() === item.productId)?.category || 'General') : 'General';
        categorySalesMap[cat] = (categorySalesMap[cat] || 0) + item.total;
      });
    });

    const lowStockCount = productsList.filter(p => p.isActive && p.stock <= p.minStock).length;

    res.json({
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit: totalSales - totalPurchases - totalExpenses,
      paymentDistribution: {
        cash: cashSales,
        upi: upiSales,
        credit: creditSales
      },
      categorySales: Object.entries(categorySalesMap).map(([category, amount]) => ({ category, amount })),
      lowStockCount,
      totalProducts: productsList.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 20. Extended Server-Side Accounting Compilation Engine
// ==================================================================
const compileServerAccounting = async (shopId: string) => {
  const bills = await Bill.find({ shopId, status: { $ne: 'cancelled' }, docType: { $nin: ['quotation', 'proforma', 'challan'] } });
  const purchases = await PurchaseBill.find({ shopId });
  const salesReturns = await SalesReturn.find({ shopId });
  const expenses = await Expense.find({ shopId });
  const payments = await PaymentTransaction.find({ shopId });
  const customLedgers = await CustomLedger.find({ shopId });
  const manualVouchers = await ManualVoucher.find({ shopId });

  const ledgersMap: Record<string, any> = {
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

  customLedgers.forEach(l => {
    const lid = l._id.toString();
    ledgersMap[lid] = {
      id: lid,
      name: l.name,
      group: l.group,
      openingBalance: l.openingBalance,
      currentBalance: l.openingBalance,
      balanceType: l.balanceType
    };
  });

  bills.forEach(b => {
    if (b.customerId && b.customerId !== 'c_walkin') {
      const ledgerId = `cust_${b.customerId}`;
      if (!ledgersMap[ledgerId]) {
        ledgersMap[ledgerId] = {
          id: ledgerId,
          name: `${b.customerName} Ledger (Customer)`,
          group: 'Sundry Debtors',
          openingBalance: 0,
          currentBalance: 0,
          balanceType: 'Debit'
        };
      }
    }
  });

  purchases.forEach(p => {
    if (p.supplierId) {
      const ledgerId = `supp_${p.supplierId}`;
      if (!ledgersMap[ledgerId]) {
        ledgersMap[ledgerId] = {
          id: ledgerId,
          name: `${p.supplierName} Ledger (Supplier)`,
          group: 'Sundry Creditors',
          openingBalance: 0,
          currentBalance: 0,
          balanceType: 'Credit'
        };
      }
    }
  });

  payments.forEach(pay => {
    if (pay.partyId) {
      const isCust = pay.partyType === 'customer';
      const ledgerId = isCust ? `cust_${pay.partyId}` : `supp_${pay.partyId}`;
      if (!ledgersMap[ledgerId]) {
        ledgersMap[ledgerId] = {
          id: ledgerId,
          name: `${pay.partyName} Ledger (${isCust ? 'Customer' : 'Supplier'})`,
          group: isCust ? 'Sundry Debtors' : 'Sundry Creditors',
          openingBalance: 0,
          currentBalance: 0,
          balanceType: isCust ? 'Debit' : 'Credit'
        };
      }
    }
  });

  const vouchers: any[] = [];

  bills.forEach(b => {
    const hasGST = b.gstEnabled;
    const gstVal = b.cgst + b.sgst + b.igst;
    const taxableVal = b.taxableAmount;
    const grandTotal = b.grandTotal;

    const debits: any[] = [];
    const credits: any[] = [];

    const cashOrBankLedger = b.paymentMode === 'bank_transfer' || b.paymentMode === 'upi' || b.paymentMode === 'cheque' ? 'bank_account' : 'cash_account';
    const customerLedgerId = b.customerId !== 'c_walkin' ? `cust_${b.customerId}` : cashOrBankLedger;

    debits.push({ ledgerId: customerLedgerId, ledgerName: ledgersMap[customerLedgerId]?.name || 'Cash/Customer', amount: grandTotal });
    credits.push({ ledgerId: 'sales_ledger', ledgerName: 'Sales Account', amount: taxableVal });
    if (hasGST && gstVal > 0) {
      credits.push({ ledgerId: 'gst_payable', ledgerName: 'GST Output Payable', amount: gstVal });
    }

    vouchers.push({
      date: b.date,
      voucherNo: b.billNumber,
      voucherType: 'Sales',
      reference: b.billNumber,
      narration: `Automated double entry for Invoice ${b.billNumber}`,
      debits,
      credits,
      isAutomatic: true
    });

    if (b.paidAmount > 0 && b.customerId !== 'c_walkin') {
      vouchers.push({
        date: b.date,
        voucherNo: `RCT-${b.billNumber}`,
        voucherType: 'Receipt',
        reference: b.billNumber,
        narration: `Receipt settled against Invoice ${b.billNumber}`,
        debits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger]?.name || 'Bank', amount: b.paidAmount }],
        credits: [{ ledgerId: customerLedgerId, ledgerName: ledgersMap[customerLedgerId]?.name || 'Customer', amount: b.paidAmount }],
        isAutomatic: true
      });
    }
  });

  purchases.forEach(p => {
    const hasGST = p.gstAmount > 0;
    const gstVal = p.gstAmount;
    const taxableVal = p.subtotal;
    const grandTotal = p.grandTotal;

    const supplierLedgerId = `supp_${p.supplierId}`;
    const cashOrBankLedger = p.paymentMode === 'bank_transfer' || p.paymentMode === 'upi' || p.paymentMode === 'cheque' ? 'bank_account' : 'cash_account';
    const purchaseCreditLedger = p.paymentMode === 'credit' ? supplierLedgerId : cashOrBankLedger;

    const debits = [{ ledgerId: 'purchase_ledger', ledgerName: 'Purchase Account', amount: taxableVal }];
    if (hasGST && gstVal > 0) {
      debits.push({ ledgerId: 'gst_input_credit', ledgerName: 'GST Input Tax Credit', amount: gstVal });
    }

    const credits = [{ ledgerId: purchaseCreditLedger, ledgerName: ledgersMap[purchaseCreditLedger]?.name || 'Supplier/Cash', amount: grandTotal }];

    vouchers.push({
      date: p.date,
      voucherNo: p.purchaseNumber,
      voucherType: 'Purchase',
      reference: p.purchaseNumber,
      narration: `Automated purchase double entry for ${p.purchaseNumber}`,
      debits,
      credits,
      isAutomatic: true
    });

    if (p.paidAmount > 0 && p.paymentMode === 'credit') {
      vouchers.push({
        date: p.date,
        voucherNo: `PMT-${p.purchaseNumber}`,
        voucherType: 'Payment',
        reference: p.purchaseNumber,
        narration: `Payment voucher for purchase invoice ${p.purchaseNumber}`,
        debits: [{ ledgerId: supplierLedgerId, ledgerName: ledgersMap[supplierLedgerId]?.name || 'Supplier', amount: p.paidAmount }],
        credits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger]?.name || 'Bank', amount: p.paidAmount }],
        isAutomatic: true
      });
    }
  });

  salesReturns.forEach(sr => {
    const gstVal = sr.items.reduce((s, item) => s + (item.total * (item.gstPercent / (100 + item.gstPercent))), 0);
    const taxableVal = sr.grandTotal - gstVal;
    const customerLedgerId = `cust_${sr.customerId}`;

    const debits = [{ ledgerId: 'sales_ledger', ledgerName: 'Sales Account (Return)', amount: taxableVal }];
    if (gstVal > 0) {
      debits.push({ ledgerId: 'gst_payable', ledgerName: 'GST Output Payable (Reversal)', amount: gstVal });
    }
    const credits = [{ ledgerId: customerLedgerId, ledgerName: ledgersMap[customerLedgerId]?.name || 'Customer', amount: sr.grandTotal }];

    vouchers.push({
      date: sr.date,
      voucherNo: sr.returnNumber,
      voucherType: 'Credit Note',
      reference: sr.returnNumber,
      narration: `Automated credit note for sales return against ${sr.originalBillNumber}`,
      debits,
      credits,
      isAutomatic: true
    });
  });

  expenses.forEach(e => {
    const categoryLedgerId = e.category === 'rent' ? 'rent_exp' :
                             e.category === 'salary' ? 'salary_exp' :
                             e.category === 'electricity' || e.category === 'internet' ? 'utility_exp' : 'misc_exp';
    const cashOrBankLedger = e.paymentMode === 'bank_transfer' || e.paymentMode === 'upi' || e.paymentMode === 'cheque' ? 'bank_account' : 'cash_account';

    vouchers.push({
      date: e.date,
      voucherNo: `EXP-${e._id.toString().substring(0, 6).toUpperCase()}`,
      voucherType: 'Payment',
      reference: e.category.toUpperCase(),
      narration: `Expense logged for ${e.description}`,
      debits: [{ ledgerId: categoryLedgerId, ledgerName: ledgersMap[categoryLedgerId]?.name || 'Expense', amount: e.amount }],
      credits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger]?.name || 'Cash/Bank', amount: e.amount }],
      isAutomatic: true
    });
  });

  payments.forEach(pay => {
    if (pay.refId && (pay.refId.startsWith('b_') || pay.refId.startsWith('pur_'))) {
      return;
    }
    const isCust = pay.partyType === 'customer';
    const ledgerId = isCust ? `cust_${pay.partyId}` : `supp_${pay.partyId}`;
    const cashOrBankLedger = pay.paymentMode === 'bank_transfer' || pay.paymentMode === 'upi' || pay.paymentMode === 'cheque' ? 'bank_account' : 'cash_account';

    if (pay.type === 'receipt') {
      vouchers.push({
        date: pay.date,
        voucherNo: `REC-${pay._id.toString().substring(0, 6).toUpperCase()}`,
        voucherType: 'Receipt',
        reference: pay.notes || 'Receipt Posting',
        narration: pay.notes || `Receipt entry from customer ${pay.partyName}`,
        debits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger]?.name || 'Bank', amount: pay.amount }],
        credits: [{ ledgerId, ledgerName: ledgersMap[ledgerId]?.name || 'Customer Ledger', amount: pay.amount }],
        isAutomatic: true
      });
    } else {
      vouchers.push({
        date: pay.date,
        voucherNo: `PAY-${pay._id.toString().substring(0, 6).toUpperCase()}`,
        voucherType: 'Payment',
        reference: pay.notes || 'Payment Posting',
        narration: pay.notes || `Payment entry to supplier ${pay.partyName}`,
        debits: [{ ledgerId, ledgerName: ledgersMap[ledgerId]?.name || 'Supplier Ledger', amount: pay.amount }],
        credits: [{ ledgerId: cashOrBankLedger, ledgerName: ledgersMap[cashOrBankLedger]?.name || 'Bank', amount: pay.amount }],
        isAutomatic: true
      });
    }
  });

  manualVouchers.forEach(mv => {
    vouchers.push({
      date: mv.date,
      voucherNo: mv.voucherNo,
      voucherType: mv.voucherType,
      reference: mv.reference,
      narration: mv.narration,
      debits: mv.debits,
      credits: mv.credits,
      isAutomatic: false
    });
  });

  vouchers.sort((a, b) => b.date.localeCompare(a.date));

  Object.keys(ledgersMap).forEach(key => {
    const ledger = ledgersMap[key];
    let debitsSum = 0;
    let creditsSum = 0;

    vouchers.forEach(v => {
      v.debits.forEach((d: any) => {
        if (d.ledgerId === key) debitsSum += d.amount;
      });
      v.credits.forEach((c: any) => {
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
    vouchers
  };
};

export const getTrialBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const { ledgers } = await compileServerAccounting(String(shopId));
    res.json({
      ledgers,
      debitTotal: ledgers.filter(l => l.balanceType === 'Debit').reduce((s, l) => s + l.currentBalance, 0),
      creditTotal: ledgers.filter(l => l.balanceType === 'Credit').reduce((s, l) => s + l.currentBalance, 0)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfitAndLoss = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const { ledgers } = await compileServerAccounting(String(shopId));

    let salesValue = 0, purchaseValue = 0, directExpense = 0, indirectExpense = 0, otherIncome = 0;
    ledgers.forEach(l => {
      if (l.group === 'Sales Accounts') salesValue += l.currentBalance;
      else if (l.group === 'Purchase Accounts') purchaseValue += l.currentBalance;
      else if (l.group === 'Direct Expenses') directExpense += l.currentBalance;
      else if (l.group === 'Indirect Expenses') indirectExpense += l.currentBalance;
      else if (['Direct Incomes', 'Indirect Incomes'].includes(l.group)) otherIncome += l.currentBalance;
    });

    const grossProfit = salesValue - purchaseValue - directExpense;
    const netProfit = grossProfit + otherIncome - indirectExpense;

    res.json({ sales: salesValue, purchases: purchaseValue, directExpense, indirectExpense, otherIncome, grossProfit, netProfit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBalanceSheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const { ledgers } = await compileServerAccounting(String(shopId));

    const assets: any[] = [];
    const liabilities: any[] = [];
    const capital: any[] = [];

    let totalAssets = 0, totalLiabilities = 0, totalCapital = 0;
    ledgers.forEach(l => {
      if (['Cash-in-Hand', 'Bank Accounts', 'Fixed Assets', 'Investments', 'Sundry Debtors'].includes(l.group)) {
        assets.push({ name: l.name, group: l.group, amount: l.currentBalance });
        totalAssets += l.currentBalance;
      } else if (['Sundry Creditors', 'Duties & Taxes', 'Current Liabilities', 'Loans (Liability)'].includes(l.group)) {
        liabilities.push({ name: l.name, group: l.group, amount: l.currentBalance });
        totalLiabilities += l.currentBalance;
      } else if (l.group === 'Capital Account') {
        capital.push({ name: l.name, group: l.group, amount: l.currentBalance });
        totalCapital += l.currentBalance;
      }
    });

    res.json({ assets, liabilities, capital, totalAssets, totalLiabilities, totalCapital });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDayBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }
    const { vouchers } = await compileServerAccounting(String(shopId));
    res.json(vouchers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 21. GST offline JSON utility template builder
// ==================================================================
export const exportGstOfflineJson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, type } = req.query; // type can be "GSTR-1" or "GSTR-3B"
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }

    const bills = await Bill.find({ shopId: String(shopId), status: { $ne: 'cancelled' }, docType: { $nin: ['quotation', 'proforma', 'challan'] } });
    const purchases = await PurchaseBill.find({ shopId: String(shopId) });

    if (type === 'GSTR-3B') {
      let outputTax = 0, inputTax = 0;
      bills.forEach(b => { outputTax += (b.cgst + b.sgst + b.igst); });
      purchases.forEach(p => { inputTax += p.gstAmount; });

      const gstr3bSchema = {
        gstin: "33AAAPS482915Z1",
        fp: "072026",
        sup_details: {
          osup_det: { txval: bills.reduce((s, b) => s + b.taxableAmount, 0), iamt: bills.reduce((s, b) => s + b.igst, 0), camt: bills.reduce((s, b) => s + b.cgst, 0), samt: bills.reduce((s, b) => s + b.sgst, 0), csamt: 0 }
        },
        itc_elg: {
          itc_avl: [{ ty: "all_other_itc", iamt: 0, camt: purchases.reduce((s, p) => s + p.gstAmount/2, 0), samt: purchases.reduce((s, p) => s + p.gstAmount/2, 0), csamt: 0 }]
        }
      };
      res.json(gstr3bSchema);
    } else {
      // Default: GSTR-1
      const b2bList: any[] = [];
      const b2csList: any[] = [];

      bills.forEach(b => {
        const hasGstin = !!b.customerGst;
        if (hasGstin) {
          b2bList.push({
            ctin: b.customerGst,
            inv: [{
              inum: b.billNumber,
              idt: b.date.split('-').reverse().join('-'), // DD-MM-YYYY
              val: b.grandTotal,
              pos: "33",
              rchrg: "N",
              inv_typ: "R",
              itms: [{
                num: 1,
                itm_det: {
                  rt: b.items[0]?.gstPercent || 18,
                  txval: b.taxableAmount,
                  iamt: b.igst,
                  camt: b.cgst,
                  samt: b.sgst,
                  csamt: 0
                }
              }]
            }]
          });
        } else {
          b2csList.push({
            sply_ty: "INTRA",
            rt: b.items[0]?.gstPercent || 18,
            pos: "33",
            txval: b.taxableAmount,
            iamt: 0,
            camt: b.cgst,
            samt: b.sgst,
            csamt: 0
          });
        }
      });

      const gstr1Schema = {
        gstin: "33AAAPS482915Z1",
        fp: "072026",
        cur_gt: 0.00,
        b2b: b2bList,
        b2cs: b2csList
      };
      res.json(gstr1Schema);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 22. HR Payroll calculation, Bulk Salary Posting, and Payslip PDF
// ==================================================================
export const getEmployeePayroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { month } = req.query; // YYYY-MM
    const targetMonth = String(month || new Date().toISOString().substring(0, 7));

    const employee = await Employee.findById(id);
    if (!employee) { res.status(404).json({ error: 'Employee not found' }); return; }

    const daysInMonth = new Date(parseInt(targetMonth.split('-')[0]), parseInt(targetMonth.split('-')[1]), 0).getDate();
    const attendanceRecords = await Attendance.find({
      shopId: employee.shopId,
      employeeId: id,
      date: { $regex: `^${targetMonth}` }
    });

    let presentDays = 0, absentDays = 0, halfDays = 0, leaveDays = 0;
    attendanceRecords.forEach(r => {
      if (r.status === 'Present') presentDays++;
      else if (r.status === 'Absent') absentDays++;
      else if (r.status === 'Half Day') halfDays++;
      else if (r.status === 'On Leave') leaveDays++;
    });

    const payableDays = presentDays + (halfDays * 0.5) + leaveDays;
    const unpaidDays = Math.max(0, daysInMonth - payableDays);

    const baseSalary = employee.baseSalary;
    const perDaySalary = baseSalary / daysInMonth;
    const lwpDeduction = Math.round(perDaySalary * unpaidDays);

    // Dynamic PF/ESI contributions
    const pfDeduction = employee.pfEnabled ? Math.round(baseSalary * 0.12) : 0;
    const esiDeduction = employee.esiEnabled ? Math.round(baseSalary * 0.0075) : 0;
    const profTax = employee.profTaxEnabled ? 200 : 0;

    const grossSalary = baseSalary;
    const totalDeductions = lwpDeduction + pfDeduction + esiDeduction + profTax;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    res.json({
      employee,
      month: targetMonth,
      daysInMonth,
      attendance: { presentDays, absentDays, halfDays, leaveDays, payableDays },
      salary: { baseSalary, perDaySalary, grossSalary, lwpDeduction, pfDeduction, esiDeduction, profTax, totalDeductions, netSalary }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadPayslipPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { month } = req.query;
    const targetMonth = String(month || new Date().toISOString().substring(0, 7));

    const employee = await Employee.findById(id);
    if (!employee) { res.status(404).send('Employee not found'); return; }

    const daysInMonth = new Date(parseInt(targetMonth.split('-')[0]), parseInt(targetMonth.split('-')[1]), 0).getDate();
    const attendanceRecords = await Attendance.find({
      shopId: employee.shopId,
      employeeId: id,
      date: { $regex: `^${targetMonth}` }
    });

    let presentDays = 0, absentDays = 0, halfDays = 0, leaveDays = 0;
    attendanceRecords.forEach(r => {
      if (r.status === 'Present') presentDays++;
      else if (r.status === 'Absent') absentDays++;
      else if (r.status === 'Half Day') halfDays++;
      else if (r.status === 'On Leave') leaveDays++;
    });

    const payableDays = presentDays + (halfDays * 0.5) + leaveDays;
    const unpaidDays = Math.max(0, daysInMonth - payableDays);

    const baseSalary = employee.baseSalary;
    const perDaySalary = baseSalary / daysInMonth;
    const lwpDeduction = Math.round(perDaySalary * unpaidDays);

    const pfDeduction = employee.pfEnabled ? Math.round(baseSalary * 0.12) : 0;
    const esiDeduction = employee.esiEnabled ? Math.round(baseSalary * 0.0075) : 0;
    const profTax = employee.profTaxEnabled ? 200 : 0;

    const grossSalary = baseSalary;
    const totalDeductions = lwpDeduction + pfDeduction + esiDeduction + profTax;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payslip_${employee.name.replace(/\s+/g, '_')}_${targetMonth}.pdf`);
    doc.pipe(res);

    // Decorative Header
    doc.rect(0, 0, doc.page.width, 15).fill('#000000');
    doc.moveDown(1.5);

    doc.font('Helvetica-Bold').fontSize(20).text('SIVASAKTHI ELECTRICALS', { align: 'center' });
    doc.font('Helvetica').fontSize(9).text('12, Main Bazaar Road, Coimbatore, Tamil Nadu - 641001', { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(12).text(`SALARY PAYSLIP - ${targetMonth}`, { align: 'center' });
    doc.moveDown(1.5);

    // Metadata Border box
    const drawDivider = (y: number) => {
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
    };

    drawDivider(doc.y);
    doc.moveDown(0.5);

    // Employee Details Table Grid
    let gridY = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).text('Employee Name:', 50, gridY);
    doc.font('Helvetica').text(employee.name, 150, gridY);
    doc.font('Helvetica-Bold').text('Department:', 330, gridY);
    doc.font('Helvetica').text(employee.department, 420, gridY);

    gridY += 18;
    doc.font('Helvetica-Bold').text('Employee ID:', 50, gridY);
    doc.font('Helvetica').text(String(employee._id).substring(18).toUpperCase(), 150, gridY);
    doc.font('Helvetica-Bold').text('Designation:', 330, gridY);
    doc.font('Helvetica').text(employee.designation || 'Sales Executive', 420, gridY);

    gridY += 18;
    doc.font('Helvetica-Bold').text('Payable Days:', 50, gridY);
    doc.font('Helvetica').text(`${payableDays} / ${daysInMonth} Days`, 150, gridY);
    doc.font('Helvetica-Bold').text('Payment Mode:', 330, gridY);
    doc.font('Helvetica').text('Bank Transfer (HDFC)', 420, gridY);

    doc.y = gridY + 25;
    drawDivider(doc.y);
    doc.moveDown(1.5);

    // Salary Computations
    let computationY = doc.y;
    doc.font('Helvetica-Bold').fontSize(11).text('Earnings & Basic Pay', 50, computationY);
    doc.font('Helvetica-Bold').text('Deductions & Benefits', 310, computationY);

    computationY += 20;
    doc.font('Helvetica').fontSize(10).text('Basic Salary:', 50, computationY);
    doc.font('Helvetica-Bold').text(`₹${baseSalary.toLocaleString('en-IN')}`, 200, computationY, { align: 'right', width: 80 });

    doc.font('Helvetica').text('PF Employee Contribution:', 310, computationY);
    doc.font('Helvetica-Bold').text(`₹${pfDeduction.toLocaleString('en-IN')}`, 460, computationY, { align: 'right', width: 80 });

    computationY += 18;
    doc.font('Helvetica').text('HRA / Allowances:', 50, computationY);
    doc.font('Helvetica-Bold').text('₹0', 200, computationY, { align: 'right', width: 80 });

    doc.font('Helvetica').text('ESI Contribution:', 310, computationY);
    doc.font('Helvetica-Bold').text(`₹${esiDeduction.toLocaleString('en-IN')}`, 460, computationY, { align: 'right', width: 80 });

    computationY += 18;
    doc.font('Helvetica').text('Special Incentives:', 50, computationY);
    doc.font('Helvetica-Bold').text('₹0', 200, computationY, { align: 'right', width: 80 });

    doc.font('Helvetica').text('Professional Tax (PT):', 310, computationY);
    doc.font('Helvetica-Bold').text(`₹${profTax.toLocaleString('en-IN')}`, 460, computationY, { align: 'right', width: 80 });

    computationY += 18;
    doc.font('Helvetica').text('', 50, computationY);

    doc.font('Helvetica').text('LWP / Unpaid Days:', 310, computationY);
    doc.font('Helvetica-Bold').text(`₹${lwpDeduction.toLocaleString('en-IN')}`, 460, computationY, { align: 'right', width: 80 });

    doc.y = computationY + 25;
    drawDivider(doc.y);

    // Net Summary Box
    doc.moveDown(1.5);
    const summaryBoxY = doc.y;
    doc.rect(50, summaryBoxY, doc.page.width - 100, 45).fill('#f9fafb');
    doc.fillColor('#000000');

    doc.font('Helvetica-Bold').fontSize(10).text('Gross Earnings (A):', 70, summaryBoxY + 10);
    doc.text(`₹${grossSalary.toLocaleString('en-IN')}`, 70, summaryBoxY + 25);

    doc.text('Total Deductions (B):', 230, summaryBoxY + 10);
    doc.text(`₹${totalDeductions.toLocaleString('en-IN')}`, 230, summaryBoxY + 25);

    doc.text('NET SALARY PAYABLE (A-B):', 390, summaryBoxY + 10);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#15803d').text(`₹${netSalary.toLocaleString('en-IN')}`, 390, summaryBoxY + 25);
    doc.fillColor('#000000');

    // Bottom signatures
    doc.y = summaryBoxY + 100;
    doc.font('Helvetica').fontSize(9).text('Employee Signature', 80, doc.y, { align: 'left' });
    doc.text('Authorized HR Signatory', doc.page.width - 230, doc.y, { align: 'right' });

    doc.end();
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const bulkSalaryPayout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, month, user } = req.body;
    if (!shopId || !month) { res.status(400).json({ error: 'Shop ID and Month are required' }); return; }

    const employees = await Employee.find({ shopId, status: 'active' });
    let totalNetSalary = 0;

    for (const emp of employees) {
      // Calculate net salary
      const baseSalary = emp.baseSalary;
      const pfDeduction = emp.pfEnabled ? Math.round(baseSalary * 0.12) : 0;
      const esiDeduction = emp.esiEnabled ? Math.round(baseSalary * 0.0075) : 0;
      const profTax = emp.profTaxEnabled ? 200 : 0;
      const netSalary = Math.max(0, baseSalary - pfDeduction - esiDeduction - profTax);
      totalNetSalary += netSalary;
    }

    if (totalNetSalary === 0) {
      res.json({ success: true, message: 'No salaries to disburse for this month.' });
      return;
    }

    // Generate Double Entry Journal Voucher automatically
    const voucherNum = `PMT-PAYROLL-${month}-${Math.floor(1000 + Math.random() * 9000)}`;
    await ManualVoucher.create({
      shopId,
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toLocaleTimeString(),
      voucherNo: voucherNum,
      voucherType: 'Payment',
      reference: `Payroll ${month}`,
      narration: `Bulk salary disbursement for the month ${month} for ${employees.length} employees`,
      debits: [{ ledgerId: 'salary_exp', ledgerName: 'Salary & Wages Expense', amount: totalNetSalary }],
      credits: [{ ledgerId: 'bank_account', ledgerName: 'Primary HDFC Bank', amount: totalNetSalary }],
      isAutomatic: true
    });

    await logAudit(shopId, user || 'HR Manager', 'Payroll Payout', `Processed bulk salaries for ${month}. Posted double entry voucher ${voucherNum} value ₹${totalNetSalary}`);

    res.json({ success: true, voucherNo: voucherNum, disbursedAmount: totalNetSalary, employeesCount: employees.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 23. Physical Stocktake & Inventory Audit Reconciler
// ==================================================================
export const processWarehouseStocktake = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, warehouseId, items, user } = req.body; // items: array of { productId, physicalCount }
    if (!shopId || !warehouseId || !items) { res.status(400).json({ error: 'Shop ID, Warehouse ID, and items are required' }); return; }

    const warehouse = await Warehouse.findById(warehouseId);
    const warehouseName = warehouse ? warehouse.name : 'Unknown Warehouse';

    const adjustmentsRecorded = [];
    for (const it of items) {
      const { productId, physicalCount } = it;
      const stockRecord = await WarehouseStock.findOne({ shopId, warehouseId, productId });
      
      const currentSystemStock = stockRecord ? stockRecord.currentStock : 0;
      const difference = physicalCount - currentSystemStock;

      if (difference !== 0) {
        // Adjust stock in warehouse
        if (stockRecord) {
          stockRecord.currentStock = physicalCount;
          stockRecord.availableStock = physicalCount;
          await stockRecord.save();
        } else {
          await WarehouseStock.create({ 
            shopId, 
            warehouseId, 
            productId, 
            currentStock: physicalCount,
            availableStock: physicalCount
          });
        }

        // Keep product main stock synchronized
        const product = await Product.findOne({ productCode: productId });
        const productName = product ? product.name : 'Unknown Product';
        if (product) {
          product.stock = Math.max(0, product.stock + difference);
          await product.save();
        }

        // Post stock adjustment log
        await StockAdjustment.create({
          shopId,
          adjustmentNumber: generateId('sadj'),
          date: new Date().toISOString().substring(0, 10),
          productId,
          productName,
          warehouseId,
          warehouseName,
          previousQuantity: currentSystemStock,
          updatedQuantity: physicalCount,
          adjustedQuantity: Math.abs(difference),
          reason: difference > 0 ? 'reconciled_excess' : 'reconciled_shortage',
          notes: `Stocktake physical count audit reconciliation. Verified physical count: ${physicalCount}`,
          user: user || 'Auditor'
        });

        adjustmentsRecorded.push({ productId, difference, previous: currentSystemStock, verified: physicalCount });
      }
    }

    await logAudit(shopId, user || 'Auditor', 'Stocktake Reconcile', `Completed warehouse stock count audit reconciliation for ${warehouseName}. Registered ${adjustmentsRecorded.length} adjustments.`);

    res.json({ success: true, warehouseId, reconciledAdjustments: adjustmentsRecorded });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 24. Bank Statement Reconciliation
// ==================================================================
export const processBankReconciliation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, bankStatementItems } = req.body; // array of { date, description, refNo, amount, type: 'credit'|'debit' }
    if (!shopId || !bankStatementItems) { res.status(400).json({ error: 'Shop ID and bankStatementItems are required' }); return; }

    const { vouchers } = await compileServerAccounting(shopId);
    const bankVouchers = vouchers.filter(v => 
      v.debits.some((d: any) => d.ledgerId === 'bank_account') || 
      v.credits.some((c: any) => c.ledgerId === 'bank_account')
    );

    const reconciliationStatus = bankStatementItems.map((stItem: any) => {
      // Try to find matching voucher in accounting database
      const matchedVoucher = bankVouchers.find(v => {
        const isDebit = stItem.type === 'debit';
        const stAmount = Math.abs(stItem.amount);

        // ST Credit (money in) matches Reciept credit ledger or bank debit ledger
        if (!isDebit) {
          return v.debits.some((d: any) => d.ledgerId === 'bank_account' && d.amount === stAmount);
        } else {
          return v.credits.some((c: any) => c.ledgerId === 'bank_account' && c.amount === stAmount);
        }
      });

      return {
        ...stItem,
        reconciled: !!matchedVoucher,
        matchedVoucherNo: matchedVoucher ? matchedVoucher.voucherNo : null,
        matchedVoucherDate: matchedVoucher ? matchedVoucher.date : null
      };
    });

    res.json({
      shopId,
      totalItemsChecked: bankStatementItems.length,
      reconciledCount: reconciliationStatus.filter((r: any) => r.reconciled).length,
      unreconciledCount: reconciliationStatus.filter((r: any) => !r.reconciled).length,
      items: reconciliationStatus
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 25. Adaptive Enterprise Transaction Session Runner
// ==================================================================
export const runInTransaction = async <T>(work: (session?: any) => Promise<T>): Promise<T> => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (err: any) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    // Fallback: If MongoDB replica sets are not enabled (e.g. standalone local / mock engines)
    // we retry the work without a session, maintaining 100% operation uptime.
    if (err.message && (err.message.includes('replica set') || err.message.includes('transaction'))) {
      logger.warn('[TRANSACTION FALLBACK] standalone environment, running atomic execution sequence without session.');
      return await work();
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

// ==================================================================
// 26. Accounting Consistency & Audit Reconciliation Engine
// ==================================================================
export const verifyAccountingConsistency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }

    const bills = await Bill.find({ shopId: String(shopId), status: { $ne: 'cancelled' } });
    const anomalies: any[] = [];

    for (const b of bills) {
      // 1. Check double entry sum balance
      const grand = b.grandTotal;
      const taxable = b.taxableAmount;
      const gst = b.cgst + b.sgst + b.igst;
      if (Math.abs(grand - (taxable + gst)) > 0.05) {
        anomalies.push({
          type: 'Math Mismatch',
          id: b.billNumber,
          details: `Invoice sum of ${grand} does not match Taxable (${taxable}) + GST (${gst})`
        });
      }

      // 2. Outstanding match logic for registered accounts
      if (b.customerId && b.customerId !== 'c_walkin') {
        const customer = await Customer.findOne({ shopId: String(shopId), id: b.customerId });
        if (customer && customer.outstandingAmount < 0 && b.paymentMode === 'credit') {
          // Warning state
        }
      }
    }

    res.json({
      success: true,
      auditedRecordsCount: bills.length,
      status: anomalies.length === 0 ? 'Consistent' : 'Anomalous',
      anomalies
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 27. Financial Year Closing, Profit Transfer & Migration
// ==================================================================
export const closeFinancialYear = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, closingYear, carryForwardLedgers, user } = req.body;
    if (!shopId || !closingYear) { res.status(400).json({ error: 'Shop ID and closingYear are required' }); return; }

    const { ledgers } = await compileServerAccounting(String(shopId));
    let profitOrLoss = 0;

    // Compile closing balances to transfer as opening balances
    for (const l of ledgers) {
      if (['Sales Accounts', 'Purchase Accounts', 'Direct Expenses', 'Indirect Expenses'].includes(l.group)) {
        // Profit & loss statement items clear to zero, and net is transferred to Capital
        if (l.group === 'Sales Accounts') profitOrLoss += l.currentBalance;
        else profitOrLoss -= l.currentBalance;
      } else {
        // Carry forward Balance Sheet ledgers as opening balance
        if (carryForwardLedgers) {
          const customLedger = await CustomLedger.findOne({ shopId, name: l.name });
          if (customLedger) {
            customLedger.openingBalance = l.currentBalance;
            customLedger.balanceType = l.balanceType;
            await customLedger.save();
          } else {
            await CustomLedger.create({
              shopId,
              name: l.name,
              group: l.group,
              openingBalance: l.currentBalance,
              balanceType: l.balanceType
            });
          }
        }
      }
    }

    // Record system entry in capital account
    const voucherNum = `JV-YE-${closingYear}-${Math.floor(1000 + Math.random() * 9000)}`;
    await ManualVoucher.create({
      shopId,
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toLocaleTimeString(),
      voucherNo: voucherNum,
      voucherType: 'Journal',
      reference: `YE-CLOSING-${closingYear}`,
      narration: `Year-end closing transfer of net profit/loss to Proprietor Capital Account for year ${closingYear}`,
      debits: [{ ledgerId: 'sales_ledger', ledgerName: 'Sales Account (Closing)', amount: Math.abs(profitOrLoss) }],
      credits: [{ ledgerId: 'capital_acc', ledgerName: 'Proprietor Capital Account', amount: Math.abs(profitOrLoss) }],
      isAutomatic: true
    });

    await logAudit(shopId, user || 'Administrator', 'Year Close', `Successfully completed Financial Year Closing for ${closingYear}. Carried forward balances and transferred Profit/Loss value ₹${profitOrLoss} to capital account.`);
    
    res.json({
      success: true,
      message: `Financial year ${closingYear} closed successfully. Opening balances carried forward. Journal entry ${voucherNum} posted.`,
      netProfitLossTransferred: profitOrLoss
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 28. Bulk Import / Export & Document Parsers
// ==================================================================
export const bulkImportProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, productsList, user } = req.body; // array of products
    if (!shopId || !productsList || !Array.isArray(productsList)) {
      res.status(400).json({ error: 'Shop ID and productsList array are required' });
      return;
    }

    const imported = [];
    const errors = [];

    for (const p of productsList) {
      try {
        // Validate inputs
        if (!p.name || !p.productCode) {
          errors.push(`Row missing Name or ProductCode: ${JSON.stringify(p)}`);
          continue;
        }

        if (p.purchasePrice > p.sellingPrice || p.sellingPrice > p.mrp) {
          errors.push(`Price logic error in '${p.name}': Purchase (${p.purchasePrice}) <= Selling (${p.sellingPrice}) <= MRP (${p.mrp}) must hold true.`);
          continue;
        }

        if (!validateHsnCode(p.hsnCode)) {
          p.hsnCode = '8544'; // Safe default for electrical wires
        }

        // Insert or overwrite
        const updated = await Product.findOneAndUpdate(
          { productCode: p.productCode },
          { ...p },
          { upsert: true, new: true }
        );
        imported.push(updated);
      } catch (err: any) {
        errors.push(`Failed to import '${p.name || 'Unknown'}': ${err.message}`);
      }
    }

    // Invalidate product cache
    cache.invalidatePrefix('products_');

    await logAudit(shopId, user || 'Administrator', 'Bulk Import', `Imported ${imported.length} products. Rejected ${errors.length} records with errors.`);

    res.json({
      success: true,
      importedCount: imported.length,
      failedCount: errors.length,
      errors
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const exportProductsExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }

    const products = await Product.find({});
    const headers = ['Product Code', 'Name', 'Category', 'Selling Price (INR)', 'Purchase Price (INR)', 'MRP (INR)', 'GST (%)', 'Stock Quantity'];
    const rows = products.map(p => [
      p.productCode,
      p.name,
      p.category,
      p.sellingPrice,
      p.purchasePrice,
      p.mrp,
      p.gstPercent,
      p.stock
    ]);

    const buffer = await exportToExcel(`SIVASAKTHI ELECTRICALS - PRODUCT INVENTORY`, headers, rows, 'Products');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Product_Inventory_Export.xlsx`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================================================================
// 29. Background Queues & Async Scheduler Status Endpoints
// ==================================================================
export const getActiveQueueJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      activeJobs: backgroundQueue.listJobs(),
      deadLetterQueue: backgroundQueue.listDlq()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const triggerDatabaseBackupJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, user } = req.body;
    if (!shopId) { res.status(400).json({ error: 'Shop ID is required' }); return; }

    const jobId = backgroundQueue.enqueue('BACKUP_SYS', { shopId, requestedBy: user || 'SysAdmin' });
    res.json({
      success: true,
      message: 'Secure system database backup task scheduled in background successfully.',
      jobId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSystemTelemetryMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    getSystemMetrics(req, res);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};



