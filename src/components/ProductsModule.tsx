import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  Plus, Search, Edit3, Trash2, Check, X, ShieldAlert, Sparkles, Tag, 
  HelpCircle, Archive 
} from 'lucide-react';

export const ProductsModule: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock } = useApp();

  // Search and categorization state
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  // Modal control states
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Wires');
  const [unit, setUnit] = useState('Pcs');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState('');
  const [stock, setStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');

  // Extract categories for selectors
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = catFilter === 'all' || p.category === catFilter;

    return matchesSearch && matchesCat && p.isActive;
  });

  const handleOpenAddModal = () => {
    setEditingProd(null);
    setName('');
    // Auto-generate code
    const nextCode = `P-${(products.length + 1).toString().padStart(4, '0')}`;
    setProductCode(nextCode);
    setBarcode(Math.floor(Math.random() * 1000000000000).toString());
    setSku(`SKU-${Math.floor(Math.random() * 90000 + 10000)}`);
    setBrand('Standard');
    setCategory('Wires');
    setUnit('Pcs');
    setSellingPrice('');
    setPurchasePrice('');
    setGstPercent(18);
    setHsnCode('8544');
    setStock('0');
    setReorderLevel('5');
    setShowModal(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProd(prod);
    setName(prod.name);
    setProductCode(prod.productCode);
    setBarcode(prod.barcode);
    setSku(prod.sku);
    setBrand(prod.brand);
    setCategory(prod.category);
    setUnit(prod.unit);
    setSellingPrice((prod.sellingPrice || 0).toString());
    setPurchasePrice((prod.purchasePrice ?? 0).toString());
    setGstPercent(prod.gstPercent ?? 0);
    setHsnCode(prod.hsnCode ?? '');
    setStock((prod.stock ?? 0).toString());
    setReorderLevel((prod.reorderLevel ?? 0).toString());
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !sellingPrice.trim() || !purchasePrice.trim()) {
      alert('Fill in all mandatory parameters');
      return;
    }

    const newStockVal = parseFloat(stock) || 0;
    const payload = {
      name,
      productCode,
      barcode,
      sku,
      brand,
      category,
      unit,
      sellingPrice: parseFloat(sellingPrice) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      gstPercent,
      hsnCode,
      stock: editingProd ? editingProd.stock : newStockVal,
      reorderLevel: parseFloat(reorderLevel) || 0
    };

    if (editingProd) {
      updateProduct(editingProd.id, payload);
      const stockDiff = newStockVal - editingProd.stock;
      if (stockDiff !== 0) {
        adjustStock(editingProd.id, stockDiff, 'Manual adjustment via Product Master');
      }
    } else {
      addProduct({ ...payload, stock: newStockVal });
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this product from catalog? (This soft-deletes and hides from lists)')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="flex-1 bg-[#f9fafb] p-6 overflow-y-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Products Catalog</h1>
          <p className="text-xs text-gray-500 mt-1">Manage catalog definitions, inventory margins, and tax rules.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search Name, Brand, Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-black bg-white"
            />
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black bg-white cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-gray-400">
          Showing {filteredProducts.length} unique items
        </div>
      </div>

      {/* Products list grid card */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-150">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">Item Code</th>
                <th className="p-3">Product Name</th>
                <th className="p-3 w-36">Category</th>
                <th className="p-3 w-28 text-right">Cost Price (₹)</th>
                <th className="p-3 w-28 text-right">Selling MRP (₹)</th>
                <th className="p-3 w-24 text-center">GST %</th>
                <th className="p-3 w-28 text-center">Stock Level</th>
                <th className="p-3 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">
                    No matching products found. Add items to database.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isLow = p.stock <= p.reorderLevel;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/30">
                      {/* S No */}
                      <td className="p-3 text-center font-mono text-gray-400 text-[10px]">{idx + 1}</td>

                      {/* Code */}
                      <td className="p-3 font-mono font-bold text-gray-800">{p.productCode}</td>

                      {/* Name */}
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{p.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          SKU: {p.sku} &middot; HSN: {p.hsnCode}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <span className="inline-block bg-gray-50 text-gray-600 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-gray-100">
                          {p.category}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="p-3 text-right font-mono text-gray-500">
                        ₹{(p.purchasePrice ?? 0).toFixed(2)}
                      </td>

                      {/* Selling */}
                      <td className="p-3 text-right font-mono font-bold text-gray-900">
                        ₹{(p.sellingPrice || 0).toFixed(2)}
                      </td>

                      {/* GST */}
                      <td className="p-3 text-center font-mono text-gray-500">
                        {p.gstPercent}%
                      </td>

                      {/* Stock */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          isLow 
                            ? 'bg-red-50 text-red-700 border border-red-150 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                        }`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black cursor-pointer"
                            title="Edit Parameters"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 cursor-pointer"
                            title="Remove Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Entry Form Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-150 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-gray-150 shrink-0">
              <h3 className="text-sm font-bold text-gray-900">
                {editingProd ? `Modify Product Profile (${editingProd.productCode})` : 'Catalog New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              
              {/* Row 1: Name & Brand */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Product Description *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-semibold"
                    placeholder="e.g. Havells 2.5sqmm Red Wire 100m"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Manufacturer Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                    placeholder="e.g. Havells"
                  />
                </div>
              </div>

              {/* Row 2: Category & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Category Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="Wires">Wires & Cables</option>
                    <option value="Switches">Switches & Sockets</option>
                    <option value="LED Lighting">LED & Lighting</option>
                    <option value="PVC Pipes">PVC Pipes & Fittings</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Measure Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
                  >
                    <option value="Pcs">Pieces (Pcs)</option>
                    <option value="Coils">Coils</option>
                    <option value="Meters">Meters</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Product Code, Barcode & SKU */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Product Code *</label>
                  <input
                    type="text"
                    required
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Barcode Serial</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">SKU Unique</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Costs Pricing */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-150">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold block mb-1">Purchase Cost (₹ Excl. GST) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold block mb-1">Selling Price (₹ MRP Incl. GST) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Row 5: HSN Code & GST Percent */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">HSN HSN Code</label>
                  <input
                    type="text"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                    placeholder="e.g. 8544"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">GST Tax Category</label>
                  <select
                    value={gstPercent}
                    onChange={(e) => setGstPercent(parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                  >
                    <option value="0">0% Excluded</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% Premium GST</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Stocks and thresholds */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Starting Stock quantity</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Minimum Reorder Limit</label>
                  <input
                    type="number"
                    required
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-mono"
                    placeholder="5"
                  />
                </div>
              </div>



              <button
                type="submit"
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-bold transition-colors cursor-pointer text-center mt-6 shrink-0"
              >
                Save Product Profile
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
