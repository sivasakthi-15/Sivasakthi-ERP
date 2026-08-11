import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building, Landmark, Calculator, Plus, Trash2, Check, Download, 
  Settings, Grid, HelpCircle, Activity, FileText
} from 'lucide-react';
import { api } from '../services/api';

interface FixedAsset {
  id: string;
  name: string;
  cost: number;
  purchaseDate: string;
  depreciationRate: number; // Percent per year
  salvageValue: number;
  lifeYears: number;
}

export const FixedAssetsModule: React.FC = () => {
  const { currentBusiness } = useApp();
  const bizId = currentBusiness?.id || 'all';

  // State
  const [assets, setAssets] = useState<FixedAsset[]>(() => {
    const stored = safeGetItem(`${bizId}_fixedassets`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'asset_1', name: 'Erode Shop Air Conditioner (Inverter 2 Ton)', cost: 45000, purchaseDate: '2025-04-10', depreciationRate: 15, salvageValue: 5000, lifeYears: 7 },
      { id: 'asset_2', name: 'HP Core-i5 Billing Terminal Computer', cost: 38000, purchaseDate: '2025-11-20', depreciationRate: 20, salvageValue: 3000, lifeYears: 5 },
      { id: 'asset_3', name: 'Heavy Duty Warehouse Storage Racks', cost: 55000, purchaseDate: '2026-01-05', depreciationRate: 10, salvageValue: 8000, lifeYears: 10 },
    ];
  });

  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [method, setMethod] = useState<'SLM' | 'WDV'>('SLM');

  // New asset form state
  const [aName, setAName] = useState('');
  const [aCost, setACost] = useState('');
  const [aDate, setADate] = useState(() => new Date().toISOString().split('T')[0]);
  const [aRate, setARate] = useState('15');
  const [aSalvage, setASalvage] = useState('5000');
  const [aLife, setALife] = useState('7');

  useEffect(() => {
    if (!bizId || bizId === 'all') return;
    api.fixedAssets.list(bizId)
      .then(res => {
        if (res && res.length > 0) {
          const mapped = res.map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            cost: item.cost,
            purchaseDate: item.purchaseDate,
            depreciationRate: item.depreciationRate,
            salvageValue: item.salvageValue,
            lifeYears: item.lifeYears
          }));
          setAssets(mapped);
          safeSetItem(`${bizId}_fixedassets`, JSON.stringify(mapped));
        }
      })
      .catch(err => console.warn('API fetch failed, utilizing localStorage backup.', err));
  }, [bizId]);

  const saveAssets = (list: FixedAsset[]) => {
    setAssets(list);
    safeSetItem(`${bizId}_fixedassets`, JSON.stringify(list));
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aName || !aCost) return;

    const newA: Omit<FixedAsset, 'id'> = {
      name: aName,
      cost: Number(aCost),
      purchaseDate: aDate,
      depreciationRate: Number(aRate) || 15,
      salvageValue: Number(aSalvage) || 3000,
      lifeYears: Number(aLife) || 5
    };

    api.fixedAssets.create({ ...newA, shopId: bizId })
      .then(saved => {
        const mapped: FixedAsset = {
          id: saved._id || saved.id,
          name: saved.name,
          cost: saved.cost,
          purchaseDate: saved.purchaseDate,
          depreciationRate: saved.depreciationRate,
          salvageValue: saved.salvageValue,
          lifeYears: saved.lifeYears
        };
        saveAssets([mapped, ...assets]);
      })
      .catch(err => {
        console.warn('Failed to save fixed asset live on server.', err);
        const localA: FixedAsset = {
          ...newA,
          id: `asset_${Math.random().toString(36).substring(2, 9)}`
        };
        saveAssets([localA, ...assets]);
      });

    setShowAddAssetModal(false);
    setAName('');
    setACost('');
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('Are you sure you want to remove this asset from corporate inventory?')) {
      api.fixedAssets.delete(id)
        .then(() => {
          saveAssets(assets.filter(a => a.id !== id));
        })
        .catch(err => {
          console.warn('Failed to delete fixed asset live on server.', err);
          saveAssets(assets.filter(a => a.id !== id));
        });
    }
  };

  // Compute Depreciation under SLM vs WDV
  const calculateDepreciation = (asset: FixedAsset) => {
    const slmYearly = (asset.cost - asset.salvageValue) / asset.lifeYears;
    const wdvYearly = asset.cost * (asset.depreciationRate / 100);

    return {
      slm: Math.round(slmYearly),
      wdv: Math.round(wdvYearly),
      currentDepVal: method === 'SLM' ? Math.round(slmYearly) : Math.round(wdvYearly),
    };
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Corporate Fixed Assets Register</span>
            <Building className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">Acquisition logging, dual-method depreciation calculations (SLM / WDV), and salvaging value tracing sheets.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddAssetModal(true)}
            className="flex items-center gap-1.5 bg-black text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Fixed Asset</span>
          </button>
        </div>
      </div>

      {/* Asset grid table view */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-900">Capital Fixed Assets & Depreciation Tracing Sheets</h3>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Calc Method:</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg p-1 text-xs font-bold font-mono text-gray-900 focus:outline-none"
            >
              <option value="SLM">Straight Line Method (SLM)</option>
              <option value="WDV">Written Down Value (WDV %)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                <th className="p-3">Asset Particulars</th>
                <th className="p-3">Acquisition Date</th>
                <th className="p-3 text-right">Original Cost</th>
                <th className="p-3 text-center">Depr Rate / Life</th>
                <th className="p-3 text-right">Estimated Salvage</th>
                <th className="p-3 text-right">Computed Year Depreciation</th>
                <th className="p-3 text-right font-bold">Book Net Value (NBV)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
              {assets.map(a => {
                const dep = calculateDepreciation(a);
                const bookValue = a.cost - dep.currentDepVal;

                return (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-sans font-bold text-gray-800">{a.name}</td>
                    <td className="p-3 font-sans text-gray-400">{a.purchaseDate}</td>
                    <td className="p-3 text-right font-bold text-gray-900">₹{a.cost.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center font-sans font-medium text-gray-600">{a.depreciationRate}% rate | {a.lifeYears} years</td>
                    <td className="p-3 text-right text-gray-500">₹{a.salvageValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-rose-700 font-bold">₹{dep.currentDepVal.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold text-gray-900">₹{bookValue.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => handleDeleteAsset(a.id)}
                        className="p-1 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                        title="Dismantle / Retract Asset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ASSET MODAL */}
      {showAddAssetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xl max-w-sm w-full space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h4 className="text-sm font-bold text-gray-900">Onboard Fixed Asset</h4>
              <button onClick={() => setShowAddAssetModal(false)} className="text-gray-400 hover:text-black font-semibold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Asset Name / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HP LaserJet Printer M1005"
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-bold text-gray-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Cost of Acquisition *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={aCost}
                    onChange={(e) => setACost(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={aDate}
                    onChange={(e) => setADate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Depr Rate (%)</label>
                  <input
                    type="number"
                    value={aRate}
                    onChange={(e) => setARate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Salvage (₹)</label>
                  <input
                    type="number"
                    value={aSalvage}
                    onChange={(e) => setASalvage(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Life Years</label>
                  <input
                    type="number"
                    value={aLife}
                    onChange={(e) => setALife(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-3 py-2 border border-gray-200 rounded-lg font-bold hover:bg-gray-50 cursor-pointer text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black text-white px-3 py-2 rounded-lg font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  Acquire Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
