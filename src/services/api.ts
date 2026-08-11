import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import { 
  Product, Customer, Supplier, Bill, PurchaseBill, SalesReturn, 
  Expense, StockMovement, PaymentTransaction, AuditLog, BusinessDetails,
  Warehouse, WarehouseStock, StockTransfer, SerialNumber, StockAdjustment,
  UserProfile, RoleConfig, SecurityNotification
} from '../types';

const API_BASE = '/api';

// Helper to get headers
const getHeaders = (isMultipart = false) => {
  const token = safeGetItem('enterprise_jwt_token');
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic API caller with auto-refresh token support
async function apiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
  options.headers = {
    ...getHeaders(),
    ...(options.headers || {})
  };

  let response = await fetch(`${API_BASE}${url}`, options);

  if (response.status === 401 || response.status === 403) {
    // Attempt Token Refresh
    const refresh = safeGetItem('enterprise_refresh_token');
    if (refresh) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: refresh })
        });

        if (refreshResponse.ok) {
          const tokens = await refreshResponse.json();
          safeSetItem('enterprise_jwt_token', tokens.accessToken);
          safeSetItem('enterprise_refresh_token', tokens.refreshToken);

          // Retry original request with new token
          options.headers = {
            ...getHeaders(),
            ...(options.headers || {})
          };
          response = await fetch(`${API_BASE}${url}`, options);
        }
      } catch (err) {
        console.error('Failed to auto-refresh session token', err);
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth & Security
  auth: {
    login: async (email: string, password: string) => {
      const data = await apiCall<{
        success: boolean;
        user: any;
        accessToken: string;
        refreshToken: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      safeSetItem('enterprise_jwt_token', data.accessToken);
      safeSetItem('enterprise_refresh_token', data.refreshToken);
      return data;
    },
    logout: async () => {
      const refresh = safeGetItem('enterprise_refresh_token');
      await apiCall('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refresh })
      }).catch(() => {});
      safeRemoveItem('enterprise_jwt_token');
      safeRemoveItem('enterprise_refresh_token');
      safeRemoveItem('enterprise_current_user');
    },
    getProfile: async () => {
      return apiCall<any>('/auth/profile');
    },
    listUsers: async () => {
      return apiCall<UserProfile[]>('/users');
    },
    createUser: async (user: any) => {
      return apiCall<any>('/users', {
        method: 'POST',
        body: JSON.stringify(user)
      });
    },
    updateUser: async (id: string, updates: any) => {
      return apiCall<any>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    deleteUser: async (id: string) => {
      return apiCall<any>(`/users/${id}`, {
        method: 'DELETE'
      });
    },
    listRoles: async () => {
      return apiCall<RoleConfig[]>('/roles');
    },
    createRole: async (role: RoleConfig) => {
      return apiCall<RoleConfig>('/roles', {
        method: 'POST',
        body: JSON.stringify(role)
      });
    },
    updateRole: async (name: string, role: any) => {
      return apiCall<RoleConfig>(`/roles/${name}`, {
        method: 'PUT',
        body: JSON.stringify(role)
      });
    },
    deleteRole: async (name: string) => {
      return apiCall<any>(`/roles/${name}`, {
        method: 'DELETE'
      });
    }
  },

  // Company Settings
  settings: {
    get: async (shopId: string) => {
      return apiCall<BusinessDetails>(`/settings?shopId=${shopId}`);
    },
    update: async (settings: Partial<BusinessDetails> & { shopId: string; user?: string }) => {
      return apiCall<BusinessDetails>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    }
  },

  // Products CRUD
  products: {
    list: async (shopId: string, bypassCache?: boolean) => {
      return apiCall<Product[]>(`/products?shopId=${shopId}${bypassCache ? '&bypassCache=true' : ''}`);
    },
    get: async (shopId: string, id: string) => {
      return apiCall<Product>(`/products?shopId=${shopId}&id=${id}`);
    },
    getByCode: async (shopId: string, productCode: string) => {
      return apiCall<Product>(`/products?shopId=${shopId}&productCode=${productCode}`);
    },
    getByBarcode: async (shopId: string, barcode: string) => {
      return apiCall<Product>(`/products?shopId=${shopId}&barcode=${barcode}`);
    },
    create: async (product: Omit<Product, 'id' | 'shopId'> & { shopId: string; user?: string }) => {
      return apiCall<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(product)
      });
    },
    update: async (id: string, updates: Partial<Product> & { user?: string }) => {
      return apiCall<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    delete: async (id: string) => {
      return apiCall<any>(`/products/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Customers & Suppliers CRUD
  customers: {
    list: async (shopId: string) => {
      return apiCall<Customer[]>(`/customers?shopId=${shopId}`);
    },
    create: async (customer: any) => {
      return apiCall<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(customer)
      });
    },
    update: async (id: string, updates: any) => {
      return apiCall<Customer>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    delete: async (id: string) => {
      return apiCall<any>(`/customers/${id}`, {
        method: 'DELETE'
      });
    }
  },

  suppliers: {
    list: async (shopId: string) => {
      return apiCall<Supplier[]>(`/suppliers?shopId=${shopId}`);
    },
    create: async (supplier: any) => {
      return apiCall<Supplier>('/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplier)
      });
    },
    update: async (id: string, updates: any) => {
      return apiCall<Supplier>(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    }
  },

  // Sales POS Invoicing
  invoices: {
    list: async (shopId: string) => {
      return apiCall<Bill[]>(`/invoices?shopId=${shopId}`);
    },
    getNextNumber: async (shopId: string) => {
      return apiCall<{ nextBillNumber: string }>(`/invoices/next-number?shopId=${shopId}`);
    },
    create: async (invoice: any) => {
      return apiCall<Bill>('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoice)
      });
    },
    update: async (id: string, updates: any) => {
      return apiCall<Bill>(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    cancel: async (id: string, reason: string, user?: string) => {
      return apiCall<any>(`/invoices/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason, user })
      });
    },
    delete: async (id: string) => {
      return apiCall<any>(`/invoices/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Procurement Purchases
  purchases: {
    list: async (shopId: string) => {
      return apiCall<PurchaseBill[]>(`/purchases?shopId=${shopId}`);
    },
    create: async (purchase: any) => {
      return apiCall<PurchaseBill>('/purchases', {
        method: 'POST',
        body: JSON.stringify(purchase)
      });
    }
  },

  // Sales Returns & Credit notes
  returns: {
    list: async (shopId: string) => {
      return apiCall<SalesReturn[]>(`/returns?shopId=${shopId}`);
    },
    create: async (salesReturn: any) => {
      return apiCall<SalesReturn>('/returns', {
        method: 'POST',
        body: JSON.stringify(salesReturn)
      });
    }
  },

  // Operational Expenses
  expenses: {
    list: async (shopId: string) => {
      return apiCall<Expense[]>(`/expenses?shopId=${shopId}`);
    },
    create: async (expense: any) => {
      return apiCall<Expense>('/expenses', {
        method: 'POST',
        body: JSON.stringify(expense)
      });
    },
    delete: async (id: string) => {
      return apiCall<any>(`/expenses/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Ledger Payments & Financial receipts
  payments: {
    list: async (shopId: string) => {
      return apiCall<PaymentTransaction[]>(`/payments?shopId=${shopId}`);
    },
    create: async (payment: any) => {
      return apiCall<PaymentTransaction>('/payments', {
        method: 'POST',
        body: JSON.stringify(payment)
      });
    }
  },

  // Multi-Warehouse & Advanced Adjustments
  warehouses: {
    list: async (shopId: string) => {
      return apiCall<Warehouse[]>(`/warehouses?shopId=${shopId}`);
    },
    create: async (warehouse: any) => {
      return apiCall<Warehouse>('/warehouses', {
        method: 'POST',
        body: JSON.stringify(warehouse)
      });
    },
    listStock: async (shopId: string) => {
      return apiCall<WarehouseStock[]>(`/warehouses/stock?shopId=${shopId}`);
    },
    transfer: async (transfer: any) => {
      return apiCall<StockTransfer>('/warehouses/transfer', {
        method: 'POST',
        body: JSON.stringify(transfer)
      });
    },
    adjust: async (adjustment: any) => {
      return apiCall<StockAdjustment>('/warehouses/adjust', {
        method: 'POST',
        body: JSON.stringify(adjustment)
      });
    }
  },

  // Auditing logs & Notifications
  auditLogs: {
    list: async (shopId: string) => {
      return apiCall<AuditLog[]>(`/audit-logs?shopId=${shopId}`);
    },
    notifications: async (shopId: string) => {
      return apiCall<SecurityNotification[]>(`/notifications?shopId=${shopId}`);
    },
    markRead: async (id: string) => {
      return apiCall<any>(`/notifications/${id}/read`, {
        method: 'POST'
      });
    }
  },

  // Backup utils
  backup: {
    export: async (shopId: string) => {
      return apiCall<{ success: boolean; backupString: string }>(`/backup/export?shopId=${shopId}`);
    },
    import: async (shopId: string, backupString: string, user?: string) => {
      return apiCall<any>('/backup/import', {
        method: 'POST',
        body: JSON.stringify({ shopId, backupString, user })
      });
    }
  },

  // Categories & Brands
  categories: {
    list: async (shopId: string) => {
      return apiCall<any[]>(`/categories?shopId=${shopId}`);
    },
    create: async (category: { shopId: string; name: string }) => {
      return apiCall<any>('/categories', {
        method: 'POST',
        body: JSON.stringify(category)
      });
    }
  },

  brands: {
    list: async (shopId: string) => {
      return apiCall<any[]>(`/brands?shopId=${shopId}`);
    },
    create: async (brand: { shopId: string; name: string }) => {
      return apiCall<any>('/brands', {
        method: 'POST',
        body: JSON.stringify(brand)
      });
    }
  },

  // Employees & Payroll
  employees: {
    list: async (shopId: string) => {
      return apiCall<any[]>(`/employees?shopId=${shopId}`);
    },
    create: async (employee: any) => {
      return apiCall<any>('/employees', {
        method: 'POST',
        body: JSON.stringify(employee)
      });
    },
    update: async (id: string, updates: any) => {
      return apiCall<any>(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    delete: async (id: string) => {
      return apiCall<any>(`/employees/${id}`, {
        method: 'DELETE'
      });
    }
  },

  attendance: {
    list: async (shopId: string) => {
      return apiCall<any[]>(`/attendance?shopId=${shopId}`);
    },
    record: async (shopId: string, records: any[], user?: string) => {
      return apiCall<any>('/attendance', {
        method: 'POST',
        body: JSON.stringify({ shopId, records, user })
      });
    }
  },

  // Fixed Assets
  fixedAssets: {
    list: async (shopId: string) => {
      return apiCall<any[]>(`/fixed-assets?shopId=${shopId}`);
    },
    create: async (asset: any) => {
      return apiCall<any>('/fixed-assets', {
        method: 'POST',
        body: JSON.stringify(asset)
      });
    },
    delete: async (id: string) => {
      return apiCall<any>(`/fixed-assets/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Archive Documents
  documents: {
    list: async (shopId: string) => {
      return apiCall<any[]>(`/documents?shopId=${shopId}`);
    },
    create: async (doc: any) => {
      return apiCall<any>('/documents', {
        method: 'POST',
        body: JSON.stringify(doc)
      });
    },
    delete: async (id: string) => {
      return apiCall<any>(`/documents/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Ledgers & Vouchers Bookkeeping
  ledgers: {
    list: async (shopId: string) => {
      return apiCall<any[]>(`/custom-ledgers?shopId=${shopId}`);
    },
    create: async (ledger: any) => {
      return apiCall<any>('/custom-ledgers', {
        method: 'POST',
        body: JSON.stringify(ledger)
      });
    }
  },

  vouchers: {
    list: async (shopId: string) => {
      return apiCall<any[]>(`/manual-vouchers?shopId=${shopId}`);
    },
    create: async (voucher: any) => {
      return apiCall<any>('/manual-vouchers', {
        method: 'POST',
        body: JSON.stringify(voucher)
      });
    }
  },

  // Reports & Live Dashboard Analytics
  reports: {
    getGstReport: async (shopId: string, startDate?: string, endDate?: string) => {
      let url = `/reports/gst?shopId=${shopId}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      return apiCall<any>(url);
    }
  },

  dashboard: {
    getAnalytics: async (shopId: string) => {
      return apiCall<any>(`/dashboard/analytics?shopId=${shopId}`);
    }
  }
};
