import mongoose from 'mongoose';
import { logger } from './logger';

// Reactive in-memory database store
const localDb: Record<string, any[]> = {};

const getCollection = (modelName: string): any[] => {
  if (!localDb[modelName]) {
    localDb[modelName] = [];
  }
  return localDb[modelName];
};

export const defaultSeedData: Record<string, any[]> = {
  // 1. Roles Seed
  Role: [
    {
      name: 'admin',
      label: 'Administrator',
      description: 'System admin with full management capabilities',
      permissions: {
        billing: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        purchase: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        inventory: { view: true, stockAdjustment: true, stockTransfer: true },
        reports: { view: true, export: true },
        accounting: { view: true, edit: true },
        settings: { fullControl: true }
      },
      isSystem: true
    },
    {
      name: 'owner',
      label: 'Business Owner',
      description: 'Full administrative controls & analytical overviews',
      permissions: {
        billing: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        purchase: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        inventory: { view: true, stockAdjustment: true, stockTransfer: true },
        reports: { view: true, export: true },
        accounting: { view: true, edit: true },
        settings: { fullControl: true }
      },
      isSystem: true
    },
    {
      name: 'manager',
      label: 'Store Manager',
      description: 'Manages sales, inventory, and purchases',
      permissions: {
        billing: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        purchase: { view: true, create: true, edit: true, delete: true, print: true, export: true },
        inventory: { view: true, stockAdjustment: true, stockTransfer: true },
        reports: { view: true, export: true },
        accounting: { view: true, edit: true },
        settings: { fullControl: false }
      },
      isSystem: true
    }
  ],

  // 2. Users Seed
  User: [
    {
      _id: 'mock_admin_id_123',
      name: 'Administrator',
      email: 'admin@electricalerp.com',
      phone: '9876543210',
      role: 'admin',
      branch: 'all',
      status: 'active',
      permittedBranches: ['sivasakthi_elec', 'meenatchi_pipes'],
      createdAt: new Date()
    }
  ],

  // 3. Business Details Seed
  BusinessDetails: [
    {
      _id: 'mock_biz_1',
      shopId: 'sivasakthi_elec',
      name: 'Sivasakthi Electricals',
      tagline: 'Leading Wholesale Electrical Distributors',
      address: '124, Power House Road, Erode, Tamil Nadu',
      phone: '9842712345',
      email: 'sales@sivasakthielectricals.com',
      gstin: '33AAAAA1111A1Z1',
      state: 'Tamil Nadu',
      stateCode: '33',
      bankName: 'State Bank of India',
      accountNo: '30012345678',
      ifsc: 'SBIN0001234',
      branch: 'Erode Main',
      terms: '1. Goods once sold cannot be taken back.\n2. Interest @ 18% p.a. will be charged for delayed payments.'
    },
    {
      _id: 'mock_biz_2',
      shopId: 'meenatchi_pipes',
      name: 'Meenatchi Pipes & Fittings',
      tagline: 'High Quality PVC & Industrial Pipe Solutions',
      address: '45, bypass Road, Madurai, Tamil Nadu',
      phone: '9842898765',
      email: 'contact@meenatchipipes.com',
      gstin: '33BBBBB2222B2Z2',
      state: 'Tamil Nadu',
      stateCode: '33',
      bankName: 'HDFC Bank',
      accountNo: '5010023456789',
      ifsc: 'HDFC0000456',
      branch: 'Madurai West',
      terms: '1. All disputes subject to Madurai jurisdiction.'
    }
  ],

  // 4. Products Seed
  Product: [
    {
      _id: 'prod_1',
      shopId: 'sivasakthi_elec',
      name: 'Finolex 2.5 Sq mm FR Wire (90m Red)',
      productCode: 'FIN-2.5-RED',
      hsnCode: '8544',
      category: 'Wires & Cables',
      brand: 'Finolex',
      unit: 'Coil',
      stock: 45,
      minStock: 10,
      purchasePrice: 1850,
      gstPercent: 18,
      mrp: 2450,
      sellingPrice: 1950,
      isActive: true
    },
    {
      _id: 'prod_2',
      shopId: 'sivasakthi_elec',
      name: 'Anchor Roma 1 Way Switch 6A',
      productCode: 'ANC-ROM-6A',
      hsnCode: '8536',
      category: 'Switches & Sockets',
      brand: 'Anchor',
      unit: 'Piece',
      stock: 350,
      minStock: 50,
      purchasePrice: 32,
      gstPercent: 18,
      mrp: 55,
      sellingPrice: 36,
      isActive: true
    },
    {
      _id: 'prod_3',
      shopId: 'sivasakthi_elec',
      name: 'Havells 3 Pole MCB 32A C-Curve',
      productCode: 'HAV-MCB-32-3P',
      hsnCode: '8536',
      category: 'Switchgear',
      brand: 'Havells',
      unit: 'Piece',
      stock: 4, // triggers low stock!
      minStock: 15,
      purchasePrice: 850,
      gstPercent: 18,
      mrp: 1350,
      sellingPrice: 920,
      isActive: true
    },
    {
      _id: 'prod_4',
      shopId: 'meenatchi_pipes',
      name: 'Finolex 110mm PVC Pipe 6kg/cm2',
      productCode: 'FIN-PVC-110-6K',
      hsnCode: '3917',
      category: 'Pipes',
      brand: 'Finolex',
      unit: 'Length',
      stock: 120,
      minStock: 20,
      purchasePrice: 450,
      gstPercent: 18,
      mrp: 680,
      sellingPrice: 480,
      isActive: true
    }
  ],

  // 5. Customers Seed
  Customer: [
    {
      _id: 'cust_1',
      shopId: 'sivasakthi_elec',
      name: 'Velavan Electricals (B2B)',
      mobile: '9443212345',
      email: 'velavan@gmail.com',
      address: 'SK Complex, Erode',
      gst: '33AAACV8899A1Z1',
      outstanding: 15200
    },
    {
      _id: 'cust_2',
      shopId: 'sivasakthi_elec',
      name: 'Arun Kumar (B2C)',
      mobile: '9842567890',
      email: 'arun@outlook.com',
      address: 'Perundurai Road, Erode',
      gst: '',
      outstanding: 0
    }
  ],

  // 6. Suppliers Seed
  Supplier: [
    {
      _id: 'supp_1',
      shopId: 'sivasakthi_elec',
      name: 'Finolex Cables Ltd',
      contactPerson: 'Suresh Kumar',
      mobile: '9840123456',
      email: 'chennai@finolex.com',
      address: 'Greams Road, Chennai',
      gst: '33AAACF4455F1Z3',
      outstanding: 48500
    }
  ],

  // 7. Warehouses Seed
  Warehouse: [
    {
      _id: 'wh_1',
      shopId: 'sivasakthi_elec',
      name: 'Main Showroom',
      code: 'M-SHOW',
      address: 'Erode HQ',
      isDefault: true
    },
    {
      _id: 'wh_2',
      shopId: 'sivasakthi_elec',
      name: 'Thindal Godown',
      code: 'T-GODOWN',
      address: 'Perundurai Road, Erode',
      isDefault: false
    }
  ],

  // 8. Employees Seed
  Employee: [
    {
      _id: 'emp_1',
      shopId: 'sivasakthi_elec',
      name: 'Senthil Kumar',
      mobile: '9876500111',
      email: 'senthil@gmail.com',
      department: 'Sales',
      designation: 'Billing Executive',
      doj: '2024-01-10',
      baseSalary: 18000,
      pfEnabled: true,
      esiEnabled: true,
      profTaxEnabled: true,
      status: 'active'
    },
    {
      _id: 'emp_2',
      shopId: 'sivasakthi_elec',
      name: 'Ramesh Babu',
      mobile: '9876500222',
      email: 'ramesh@gmail.com',
      department: 'Logistics',
      designation: 'Delivery In-charge',
      doj: '2024-03-15',
      baseSalary: 15000,
      pfEnabled: false,
      esiEnabled: true,
      profTaxEnabled: false,
      status: 'active'
    }
  ],

  // 9. Categories and Brands
  Category: [
    { _id: 'cat_1', shopId: 'sivasakthi_elec', name: 'Wires & Cables' },
    { _id: 'cat_2', shopId: 'sivasakthi_elec', name: 'Switches & Sockets' },
    { _id: 'cat_3', shopId: 'sivasakthi_elec', name: 'Switchgear' }
  ],

  Brand: [
    { _id: 'br_1', shopId: 'sivasakthi_elec', name: 'Finolex' },
    { _id: 'br_2', shopId: 'sivasakthi_elec', name: 'Anchor' },
    { _id: 'br_3', shopId: 'sivasakthi_elec', name: 'Havells' }
  ],

};

// Seed sample data for offline mode
export function seedOfflineDatabase() {
  logger.info('Initializing sample seed data for Mongoose offline mode...');
  Object.assign(localDb, defaultSeedData);
  logger.info('Sample seed data initialized successfully!');
}

// Intercept & hook Mongoose Model methods globally
export function setupMongooseOfflineFallback() {
  logger.info('Enabling global Mongoose model fallback hooks for database-free execution...');

  // Match helper
  const matchesFilter = (item: any, filter: any): boolean => {
    if (!filter) return true;
    for (const key in filter) {
      if (key === '$or' && Array.isArray(filter[key])) {
        const conditions = filter[key];
        const matched = conditions.some((cond: any) => matchesFilter(item, cond));
        if (!matched) return false;
        continue;
      }
      if (key === '$and' && Array.isArray(filter[key])) {
        const conditions = filter[key];
        const matched = conditions.every((cond: any) => matchesFilter(item, cond));
        if (!matched) return false;
        continue;
      }
      const val = filter[key];
      if (val && typeof val === 'object' && !(val instanceof RegExp) && !Object.keys(val).some(k => k.startsWith('$'))) {
        const itemValStr = (item[key] !== undefined && item[key] !== null && typeof item[key].toString === 'function') ? item[key].toString() : item[key];
        const valStr = (val !== undefined && val !== null && typeof val.toString === 'function') ? val.toString() : val;
        if (itemValStr !== valStr) {
          return false;
        }
      } else if (val && typeof val === 'object') {
        if (val instanceof RegExp) {
          if (!val.test(item[key] || '')) return false;
        } else if ('$regex' in val) {
          const regex = val.$regex instanceof RegExp ? val.$regex : new RegExp(val.$regex, val.$options);
          if (!regex.test(item[key] || '')) return false;
        } else {
          if ('$exists' in val) {
            const exists = val.$exists;
            const hasKey = (key in item) && item[key] !== undefined;
            if (exists !== hasKey) return false;
          }
          if ('$gte' in val && item[key] < val.$gte) return false;
          if ('$lte' in val && item[key] > val.$lte) return false;
          if ('$ne' in val && item[key] === val.$ne) return false;
          if ('$in' in val && Array.isArray(val.$in) && !val.$in.includes(item[key])) return false;
          if ('$nin' in val && Array.isArray(val.$nin) && val.$nin.includes(item[key])) return false;
        }
      } else {
        const isItemEmpty = item[key] === undefined || item[key] === null || item[key] === '';
        const isValEmpty = val === undefined || val === null || val === '';
        if (isItemEmpty && isValEmpty) {
          continue;
        }
        const itemValStr = (item[key] !== undefined && item[key] !== null && typeof item[key].toString === 'function') ? item[key].toString() : item[key];
        const valStr = (val !== undefined && val !== null && typeof val.toString === 'function') ? val.toString() : val;
        if (itemValStr !== valStr) {
          return false;
        }
      }
    }
    return true;
  };

  // 1. find
  const originalFind = mongoose.Model.find;
  (mongoose.Model as any).find = function(this: any, filter: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      let results = [...collection];
      if (filter && typeof filter === 'object') {
        results = results.filter(item => matchesFilter(item, filter));
      }
      
      const mockQuery: any = {
        _results: results,
        sort(sortOptions: any) {
          return mockQuery;
        },
        limit(n: number) {
          this._results = this._results.slice(0, n);
          return mockQuery;
        },
        select(fields: any) {
          return mockQuery;
        },
        exec() {
          return Promise.resolve(this._results);
        },
        then(resolve: any, reject: any) {
          return Promise.resolve(this._results).then(resolve, reject);
        }
      };
      return mockQuery;
    }
    return originalFind.apply(this, [filter, ...args]);
  };

  // 2. findOne
  const originalFindOne = mongoose.Model.findOne;
  (mongoose.Model as any).findOne = function(this: any, filter: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      let found = collection.find(item => matchesFilter(item, filter));
      const mockQuery: any = {
        _results: found || null,
        exec() {
          return Promise.resolve(this._results);
        },
        then(resolve: any, reject: any) {
          return Promise.resolve(this._results).then(resolve, reject);
        }
      };
      return mockQuery;
    }
    return originalFindOne.apply(this, [filter, ...args]);
  };

  // 3. findById
  const originalFindById = mongoose.Model.findById;
  (mongoose.Model as any).findById = function(this: any, id: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      const idStr = id ? id.toString() : '';
      const found = collection.find(item => item._id && item._id.toString() === idStr);
      const mockQuery: any = {
        _results: found || null,
        exec() {
          return Promise.resolve(this._results);
        },
        then(resolve: any, reject: any) {
          return Promise.resolve(this._results).then(resolve, reject);
        }
      };
      return mockQuery;
    }
    return originalFindById.apply(this, [id, ...args]);
  };

  // 4. create
  const originalCreate = mongoose.Model.create;
  (mongoose.Model as any).create = function(this: any, doc: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      const docs = Array.isArray(doc) ? doc : [doc];
      const createdDocs = docs.map(d => {
        const newDoc = {
          _id: d._id || new mongoose.Types.ObjectId(),
          ...d,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        collection.push(newDoc);
        return newDoc;
      });
      return Promise.resolve(Array.isArray(doc) ? createdDocs : createdDocs[0]);
    }
    return originalCreate.apply(this, [doc, ...args]);
  };

  // 5. updateOne
  const originalUpdateOne = mongoose.Model.updateOne;
  (mongoose.Model as any).updateOne = function(this: any, filter: any, update: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      const item = collection.find(item => matchesFilter(item, filter));
      if (item && update) {
        const setFields = update.$set || update;
        Object.assign(item, setFields);
      }
      return Promise.resolve({ matchedCount: item ? 1 : 0, modifiedCount: item ? 1 : 0 });
    }
    return originalUpdateOne.apply(this, [filter, update, ...args]);
  };

  // 6. findOneAndUpdate
  const originalFindOneAndUpdate = mongoose.Model.findOneAndUpdate;
  (mongoose.Model as any).findOneAndUpdate = function(this: any, filter: any, update: any, options: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      let item = collection.find(item => matchesFilter(item, filter));
      if (!item && options?.upsert) {
        item = {
          _id: new mongoose.Types.ObjectId(),
          ...filter,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        collection.push(item);
      }
      if (item && update) {
        const setFields = update.$set || update;
        Object.assign(item, setFields);
      }
      const mockQuery: any = {
        _results: item || null,
        exec() {
          return Promise.resolve(this._results);
        },
        then(resolve: any, reject: any) {
          return Promise.resolve(this._results).then(resolve, reject);
        }
      };
      return mockQuery;
    }
    return originalFindOneAndUpdate.apply(this, [filter, update, options, ...args]);
  };

  // 7. findByIdAndUpdate
  const originalFindByIdAndUpdate = mongoose.Model.findByIdAndUpdate;
  (mongoose.Model as any).findByIdAndUpdate = function(this: any, id: any, update: any, options: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      const idStr = id ? id.toString() : '';
      let item = collection.find(item => item._id && item._id.toString() === idStr);
      if (item && update) {
        const setFields = update.$set || update;
        Object.assign(item, setFields);
      }
      const mockQuery: any = {
        _results: item || null,
        exec() {
          return Promise.resolve(this._results);
        },
        then(resolve: any, reject: any) {
          return Promise.resolve(this._results).then(resolve, reject);
        }
      };
      return mockQuery;
    }
    return originalFindByIdAndUpdate.apply(this, [id, update, options, ...args]);
  };

  // 8. findByIdAndDelete
  const originalFindByIdAndDelete = mongoose.Model.findByIdAndDelete;
  (mongoose.Model as any).findByIdAndDelete = function(this: any, id: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      const idStr = id ? id.toString() : '';
      const index = collection.findIndex(item => item._id && item._id.toString() === idStr);
      let deleted = null;
      if (index !== -1) {
        deleted = collection.splice(index, 1)[0];
      }
      const mockQuery: any = {
        _results: deleted,
        exec() {
          return Promise.resolve(this._results);
        },
        then(resolve: any, reject: any) {
          return Promise.resolve(this._results).then(resolve, reject);
        }
      };
      return mockQuery;
    }
    return originalFindByIdAndDelete.apply(this, [id, ...args]);
  };

  // 9. deleteOne
  const originalDeleteOne = mongoose.Model.deleteOne;
  (mongoose.Model as any).deleteOne = function(this: any, filter: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      const index = collection.findIndex(item => matchesFilter(item, filter));
      let deletedCount = 0;
      if (index !== -1) {
        collection.splice(index, 1);
        deletedCount = 1;
      }
      return Promise.resolve({ deletedCount });
    }
    return originalDeleteOne.apply(this, [filter, ...args]);
  };

  // 10. deleteMany
  const originalDeleteMany = mongoose.Model.deleteMany;
  (mongoose.Model as any).deleteMany = function(this: any, filter: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      let initialLength = collection.length;
      if (!filter || Object.keys(filter).length === 0) {
        collection.length = 0;
      } else {
        localDb[this.modelName] = collection.filter(item => !matchesFilter(item, filter));
      }
      const deletedCount = initialLength - getCollection(this.modelName).length;
      return Promise.resolve({ deletedCount });
    }
    return originalDeleteMany.apply(this, [filter, ...args]);
  };

  // 11. countDocuments
  const originalCountDocuments = mongoose.Model.countDocuments;
  (mongoose.Model as any).countDocuments = function(this: any, filter: any, ...args: any[]) {
    if (mongoose.connection.readyState !== 1) {
      const collection = getCollection(this.modelName);
      let results = [...collection];
      if (filter && typeof filter === 'object') {
        results = results.filter(item => matchesFilter(item, filter));
      }
      return Promise.resolve(results.length);
    }
    return originalCountDocuments.apply(this, [filter, ...args]);
  };
}

export async function seedMongoDatabaseIfEmpty() {
  try {
    const ProductModel = mongoose.models.Product || mongoose.model('Product');
    const CustomerModel = mongoose.models.Customer || mongoose.model('Customer');
    const SupplierModel = mongoose.models.Supplier || mongoose.model('Supplier');
    const BusinessModel = mongoose.models.BusinessDetails || mongoose.model('BusinessDetails');

    // Seed Business Details
    const bizCount = await BusinessModel.countDocuments();
    if (bizCount === 0) {
      logger.info('Seeding default Business Details to MongoDB...');
      await BusinessModel.insertMany(defaultSeedData['BusinessDetails'].map(({_id, ...rest}) => rest));
    }

    // Seed Products
    const prodCount = await ProductModel.countDocuments();
    if (prodCount === 0) {
      logger.info('Seeding default Products to MongoDB...');
      await ProductModel.insertMany(defaultSeedData['Product'].map(({_id, ...rest}) => rest));
    }

    // Seed Customers
    const custCount = await CustomerModel.countDocuments();
    if (custCount === 0) {
      logger.info('Seeding default Customers to MongoDB...');
      await CustomerModel.insertMany(defaultSeedData['Customer'].map(({_id, ...rest}) => rest));
    }

    // Seed Suppliers
    const suppCount = await SupplierModel.countDocuments();
    if (suppCount === 0) {
      logger.info('Seeding default Suppliers to MongoDB...');
      await SupplierModel.insertMany(defaultSeedData['Supplier'].map(({_id, ...rest}) => rest));
    }

    logger.info('Production MongoDB collections verified / seeded successfully.');
  } catch (err) {
    logger.warn('Failed to seed connected MongoDB database:', err);
  }
}
