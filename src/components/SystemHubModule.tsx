import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, Terminal, Settings, Keyboard, ShieldAlert, Check, RefreshCw, 
  Database, Landmark, Layers, HelpCircle, Activity, ArrowRight
} from 'lucide-react';

export const SystemHubModule: React.FC = () => {
  const { currentBusiness, exportBackup } = useApp();
  const bizId = currentBusiness?.id || 'all';

  const [activeTab, setActiveTab] = useState<'api' | 'shortcuts' | 'config'>('api');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiEndpoint, setApiEndpoint] = useState('/api/v1/products');
  const [apiResult, setApiResult] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('https://corporate.erp.webhook/receiver');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const handleSimulateApi = () => {
    if (apiEndpoint.includes('/products')) {
      setApiResult({
        status: 200,
        message: "Successfully retrieved products master listing",
        timestamp: new Date().toISOString(),
        data: [
          { sku: "FIN-W-1.5-R", name: "Finolex 1.5 Sqmm Copper Wire (Red) 90m", price: 1650, stock: 45 },
          { sku: "HAV-W-2.5-B", name: "Havells 2.5 Sqmm Copper Wire (Blue) 90m", price: 2450, stock: 30 }
        ]
      });
    } else if (apiEndpoint.includes('/ledgers')) {
      setApiResult({
        status: 200,
        message: "Retrieved chart of account groups from Tally database",
        timestamp: new Date().toISOString(),
        ledgers: [
          { id: "cash_account", name: "Cash Account", balance: 50000, type: "Debit" },
          { id: "bank_account", name: "Primary HDFC Bank", balance: 250000, type: "Debit" }
        ]
      });
    } else {
      setApiResult({
        status: 404,
        error: "Resource endpoint not found in corporate ERP router routing grid.",
        code: "ROUTER_ERR"
      });
    }
  };

  const handleTriggerWebhook = () => {
    setIsTestingWebhook(true);
    setTimeout(() => {
      setIsTestingWebhook(false);
      alert('Webhook dispatched successfully!\n\nPayload: { event: "sales_invoice.created", invoiceNo: "SLS-2026-0091" }\nResponse Code: 200 OK');
    }, 1200);
  };

  const handleExportBackupLocal = () => {
    const raw = exportBackup();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(raw);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr     );
    dlAnchorElem.setAttribute("download", `${bizId}_erp_vault_backup.json`);
    dlAnchorElem.click();
    alert('Secure backup file generated and downloaded successfully!');
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Corporate System Hub & Dev Sandbox</span>
            <Terminal className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">REST API gateway simulator, webhook triggers, keyboard POS terminal hotkeys, and automated backup configurations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-px">
        {[
          { id: 'api', label: 'NIC REST API Sandbox & Webhooks', icon: Terminal },
          { id: 'shortcuts', label: 'Terminal Keyboard Shortcuts', icon: Keyboard },
          { id: 'config', label: 'Backup Schedules & Multi-Company', icon: Database },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 font-medium transition-all border-b-2 flex items-center gap-1.5 cursor-pointer -mb-px ${
              activeTab === t.id 
                ? 'border-black text-black font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: REST API SANDBOX */}
      {activeTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* API testing form */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-gray-400" />
              <span>Simulate REST API Gateway Calls</span>
            </h3>

            <div className="flex gap-2 text-xs">
              <select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value as any)}
                className="bg-gray-100 border border-gray-200 rounded-lg p-2 font-bold focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono font-bold"
              />
              <button
                onClick={handleSimulateApi}
                className="bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1 cursor-pointer hover:bg-neutral-800"
              >
                <span>Run</span>
                <Play className="h-3 w-3 text-emerald-400" />
              </button>
            </div>

            {/* API Output screen */}
            {apiResult && (
              <div className="space-y-1.5">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Gateway JSON Payload Output</span>
                <pre className="bg-gray-900 text-emerald-400 p-4 rounded-xl font-mono text-[10px] overflow-x-auto max-h-56 leading-relaxed">
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Webhook tester */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Webhooks Dispatcher</h3>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Webhook Endpoint URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono"
              />
            </div>
            <button
              onClick={handleTriggerWebhook}
              disabled={isTestingWebhook}
              className="w-full bg-black text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isTestingWebhook ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 text-emerald-400" />
                  <span>Test Webhook Trigger</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: KEYBOARD SHORTCUTS */}
      {activeTab === 'shortcuts' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">POS Billing terminal Keyboard Hotkeys</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {[
              { keys: 'F2', action: 'Initialize new POS bill session' },
              { keys: 'F4', action: 'Move active draft billing to On Hold slot' },
              { keys: 'F8', action: 'Instantly save and process draft billing' },
              { keys: 'Ctrl + Shift + S', action: 'Switch active branch store selection' },
              { keys: 'Ctrl + Alt + B', action: 'Open barcode label generator instantly' },
              { keys: 'ESC', action: 'Cancel / Clear current draft product entries' },
            ].map(hk => (
              <div key={hk.keys} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center">
                <span className="font-sans text-gray-600 font-semibold">{hk.action}</span>
                <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs tracking-wider font-mono">{hk.keys}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP CONFIG */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Backups */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Database Backup & Snapshots</h3>
            <div className="space-y-3 font-sans text-gray-600">
              <p>Securely snapshot the entire system state (including products, ledgers, vouchers, attendance and transactions) to an offline JSON file.</p>
              <button
                onClick={handleExportBackupLocal}
                className="bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-neutral-800 cursor-pointer flex items-center gap-1.5"
              >
                <Database className="h-4 w-4 text-emerald-400" />
                <span>Export Local Backup</span>
              </button>
            </div>
          </div>

          {/* Multi company schedule info */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Multi-Company Backup Schedules</h3>
            <div className="space-y-3 text-gray-600 font-sans leading-relaxed">
              <p>Configure automated routine backups:</p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center text-[10px]">
                  <span><strong>Daily Cloud Backup:</strong> 02:00 AM IST</span>
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded font-mono">ACTIVE</span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex justify-between items-center text-[10px]">
                  <span><strong>Weekly Redundancy Snapshots:</strong> Sunday 04:00 AM IST</span>
                  <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded font-mono">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
