import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth';
import * as authController from '../controllers/auth.controller';
import * as erpController from '../controllers/erp.controller';

const router = Router();

// ==================================================================
// AUTHENTICATION & SECURITY ENDPOINTS
// ==================================================================
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.get('/auth/profile', authenticateToken, authController.getProfile);

// Admin operations on Users & Custom Roles
router.get('/users', authenticateToken, requirePermission('settings', 'fullControl'), authController.listUsers);
router.post('/users', authenticateToken, requirePermission('settings', 'fullControl'), authController.createUser);
router.put('/users/:id', authenticateToken, requirePermission('settings', 'fullControl'), authController.updateUser);
router.delete('/users/:id', authenticateToken, requirePermission('settings', 'fullControl'), authController.deleteUser);

router.get('/roles', authenticateToken, authController.listRoles);
router.post('/roles', authenticateToken, requirePermission('settings', 'fullControl'), authController.createRole);
router.put('/roles/:name', authenticateToken, requirePermission('settings', 'fullControl'), authController.updateRole);
router.delete('/roles/:name', authenticateToken, requirePermission('settings', 'fullControl'), authController.deleteRole);

// ==================================================================
// MASTER CONFIG & BUSINESS SETTINGS
// ==================================================================
router.get('/settings', authenticateToken, erpController.getSettings);
router.put('/settings', authenticateToken, requirePermission('settings', 'fullControl'), erpController.updateSettings);

// ==================================================================
// MASTER DATA: PRODUCTS CRUD
// ==================================================================
router.get('/products', authenticateToken, erpController.getProducts);
router.post('/products', authenticateToken, requirePermission('billing', 'create'), erpController.createProduct);
router.put('/products/:id', authenticateToken, requirePermission('billing', 'edit'), erpController.updateProduct);
router.delete('/products/:id', authenticateToken, requirePermission('billing', 'delete'), erpController.deleteProduct);

// ==================================================================
// MASTER DATA: CUSTOMERS & SUPPLIERS CRUD
// ==================================================================
router.get('/customers', authenticateToken, erpController.getCustomers);
router.post('/customers', authenticateToken, erpController.createCustomer);
router.put('/customers/:id', authenticateToken, erpController.updateCustomer);
router.delete('/customers/:id', authenticateToken, erpController.deleteCustomer);

router.get('/suppliers', authenticateToken, erpController.getSuppliers);
router.post('/suppliers', authenticateToken, erpController.createSupplier);
router.put('/suppliers/:id', authenticateToken, erpController.updateSupplier);

// ==================================================================
// INVOICING / SALES BILLING ENGINE
// ==================================================================
router.get('/invoices', authenticateToken, erpController.getInvoices);
router.get('/invoices/next-number', authenticateToken, erpController.getNextInvoiceNumber);
router.post('/invoices', authenticateToken, requirePermission('billing', 'create'), erpController.createInvoice);
router.put('/invoices/:id', authenticateToken, requirePermission('billing', 'edit'), erpController.updateInvoice);
router.post('/invoices/:id/cancel', authenticateToken, requirePermission('billing', 'edit'), erpController.cancelInvoice);
router.delete('/invoices/:id', authenticateToken, requirePermission('billing', 'delete'), erpController.deleteInvoice);

// PDF Download Link
router.get('/invoices/:id/pdf', erpController.generateInvoicePDF); // Publicly downloadable with secure token or simple signature matching

// ==================================================================
// PROCUREMENT / PURCHASE BILLS
// ==================================================================
router.get('/purchases', authenticateToken, erpController.getPurchases);
router.post('/purchases', authenticateToken, requirePermission('purchase', 'create'), erpController.createPurchase);

// ==================================================================
// SALES RETURNS
// ==================================================================
router.get('/returns', authenticateToken, erpController.getSalesReturns);
router.post('/returns', authenticateToken, requirePermission('billing', 'create'), erpController.createSalesReturn);

// ==================================================================
// PAYMENTS & EXPENSES
// ==================================================================
router.get('/payments', authenticateToken, erpController.getPayments);
router.post('/payments', authenticateToken, requirePermission('accounting', 'edit'), erpController.recordPayment);

router.get('/expenses', authenticateToken, erpController.getExpenses);
router.post('/expenses', authenticateToken, requirePermission('accounting', 'edit'), erpController.createExpense);
router.delete('/expenses/:id', authenticateToken, requirePermission('accounting', 'edit'), erpController.deleteExpense);

// ==================================================================
// ADVANCED WAREHOUSING & ADJUSTMENTS
// ==================================================================
router.get('/warehouses', authenticateToken, erpController.getWarehouses);
router.post('/warehouses', authenticateToken, requirePermission('inventory', 'stockAdjustment'), erpController.createWarehouse);
router.get('/warehouses/stock', authenticateToken, erpController.getWarehouseStocks);
router.post('/warehouses/transfer', authenticateToken, requirePermission('inventory', 'stockTransfer'), erpController.createStockTransfer);
router.post('/warehouses/adjust', authenticateToken, requirePermission('inventory', 'stockAdjustment'), erpController.createStockAdjustment);

// ==================================================================
// LOGS & ALERTS
// ==================================================================
router.get('/audit-logs', authenticateToken, erpController.getAuditLogs);
router.get('/notifications', authenticateToken, erpController.getNotifications);
router.post('/notifications/:id/read', authenticateToken, erpController.markNotificationRead);

// ==================================================================
// SYSTEM UTILITIES: BACKUP & RESTORE
// ==================================================================
router.get('/backup/export', authenticateToken, requirePermission('settings', 'fullControl'), erpController.exportDatabaseBackup);
router.post('/backup/import', authenticateToken, requirePermission('settings', 'fullControl'), erpController.importDatabaseBackup);

// ==================================================================
// CATEGORIES & BRANDS
// ==================================================================
router.get('/categories', authenticateToken, erpController.getCategories);
router.post('/categories', authenticateToken, erpController.createCategory);
router.get('/brands', authenticateToken, erpController.getBrands);
router.post('/brands', authenticateToken, erpController.createBrand);

// ==================================================================
// EMPLOYEES & ATTENDANCE (PAYROLL)
// ==================================================================
router.get('/employees', authenticateToken, erpController.getEmployees);
router.post('/employees', authenticateToken, erpController.createEmployee);
router.put('/employees/:id', authenticateToken, erpController.updateEmployee);
router.delete('/employees/:id', authenticateToken, erpController.deleteEmployee);

router.get('/attendance', authenticateToken, erpController.getAttendance);
router.post('/attendance', authenticateToken, erpController.recordAttendance);

// ==================================================================
// FIXED ASSETS MODULE
// ==================================================================
router.get('/fixed-assets', authenticateToken, erpController.getFixedAssets);
router.post('/fixed-assets', authenticateToken, erpController.createFixedAsset);
router.delete('/fixed-assets/:id', authenticateToken, erpController.deleteFixedAsset);

// ==================================================================
// DOCUMENTS MANAGEMENT
// ==================================================================
router.get('/documents', authenticateToken, erpController.getDocuments);
router.post('/documents', authenticateToken, erpController.createDocument);
router.delete('/documents/:id', authenticateToken, erpController.deleteDocument);

// ==================================================================
// CUSTOM LEDGERS & MANUAL BOOKKEEPING VOUCHERS
// ==================================================================
router.get('/custom-ledgers', authenticateToken, erpController.getCustomLedgers);
router.post('/custom-ledgers', authenticateToken, erpController.createCustomLedger);

router.get('/manual-vouchers', authenticateToken, erpController.getManualVouchers);
router.post('/manual-vouchers', authenticateToken, erpController.createManualVoucher);

// ==================================================================
// GST REPORTS & DASHBOARD BI ANALYTICS
// ==================================================================
router.get('/reports/gst', authenticateToken, erpController.getGstReport);
router.get('/reports/gst/export-json', authenticateToken, erpController.exportGstOfflineJson);
router.get('/dashboard/analytics', authenticateToken, erpController.getDashboardAnalytics);

// ==================================================================
// EXTENDED ENTERPRISE ERP ENDPOINTS
// ==================================================================
// Server-Side Accounting Reports
router.get('/reports/trial-balance', authenticateToken, erpController.getTrialBalance);
router.get('/reports/profit-loss', authenticateToken, erpController.getProfitAndLoss);
router.get('/reports/balance-sheet', authenticateToken, erpController.getBalanceSheet);
router.get('/reports/day-book', authenticateToken, erpController.getDayBook);

// HR Payroll & Salary disbursements
router.get('/employees/:id/payroll', authenticateToken, erpController.getEmployeePayroll);
router.get('/employees/:id/payslip', erpController.downloadPayslipPdf); // Download PDF payslip
router.post('/employees/payout', authenticateToken, erpController.bulkSalaryPayout);

// Inventory Stocktake Physical Audit
router.post('/warehouses/stocktake', authenticateToken, erpController.processWarehouseStocktake);

// Treasury Bank Statement Reconciliation
router.post('/reports/bank-reconciliation', authenticateToken, erpController.processBankReconciliation);

// Financial Year & Audit Reconciliation
router.get('/reports/accounting-consistency', authenticateToken, erpController.verifyAccountingConsistency);
router.post('/accounting/year-closing', authenticateToken, erpController.closeFinancialYear);

// Bulk Data Imports & Spreadsheet Exports
router.post('/products/bulk-import', authenticateToken, erpController.bulkImportProducts);
router.get('/products/export-excel', authenticateToken, erpController.exportProductsExcel);

// Background Workers & System Observability
router.get('/jobs/status', authenticateToken, erpController.getActiveQueueJobs);
router.post('/jobs/backup', authenticateToken, erpController.triggerDatabaseBackupJob);
router.get('/system/metrics', authenticateToken, erpController.getSystemTelemetryMetrics);

export default router;
