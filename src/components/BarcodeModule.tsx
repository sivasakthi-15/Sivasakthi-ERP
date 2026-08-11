import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Barcode, Camera, Printer, Grid, Download, Check, RefreshCw, 
  Search, ShieldAlert, FileText, Settings, Play, Volume2
} from 'lucide-react';

export const BarcodeModule: React.FC = () => {
  const { products, currentBusiness } = useApp();
  const bizId = currentBusiness?.id || 'all';

  // State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [labelFormat, setLabelFormat] = useState<'ean13' | 'code128' | 'qr'>('code128');
  const [density, setDensity] = useState<'24' | '40' | '65'>('24');
  const [printQty, setPrintQty] = useState('12');
  const [showMRP, setShowMRP] = useState(true);
  const [showShopName, setShowShopName] = useState(true);

  // Scanning simulation states
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerLog, setScannerLog] = useState<string[]>([]);

  // Sound effect simulation
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // Beep tone
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1); // Beep duration
    } catch (e) {
      console.log('AudioContext not allowed or not supported yet');
    }
  };

  const handleSimulateScan = (barcode: string) => {
    playBeep();
    const prod = products.find(p => p.barcode === barcode || p.sku === barcode || p.productCode === barcode);
    if (prod) {
      setScannedProduct(prod);
      setScannerLog(prev => [`[${new Date().toLocaleTimeString()}] Scanned: ${prod.name} (Code: ${barcode})`, ...prev]);
    } else {
      setScannedProduct(null);
      setScannerLog(prev => [`[${new Date().toLocaleTimeString()}] Error: Product barcode ${barcode} not found in system`, ...prev]);
    }
  };

  const handleTriggerScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      // Pick a random product barcode to simulate success after 1.5 seconds
      if (products.length > 0) {
        const randProd = products[Math.floor(Math.random() * products.length)];
        handleSimulateScan(randProd.barcode || randProd.productCode);
      }
      setIsScanning(false);
    }, 1500);
  };

  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Barcode & QR Labels Engine</span>
            <Barcode className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">Generate high-density product stickers, print sheet templates, and run camera barcode lookup diagnostics.</p>
        </div>
      </div>

      {/* Two panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Form: Label Customizer */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-gray-400" />
            <span>Sticker Designer & Print Options</span>
          </h3>

          <div>
            <label className="text-[10px] text-gray-400 font-bold block mb-1">Target Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold text-gray-900"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.brand} | Barcode: {p.barcode || 'None'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Label symbology</label>
              <select
                value={labelFormat}
                onChange={(e) => setLabelFormat(e.target.value as any)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
              >
                <option value="code128">Code 128 (Alpha)</option>
                <option value="ean13">EAN-13 (Numeric)</option>
                <option value="qr">QR Code (Compact)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Sheet Sheet density</label>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value as any)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white"
              >
                <option value="24">24 Labels per A4</option>
                <option value="40">40 Labels per A4</option>
                <option value="65">65 Labels per A4</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Stickers to print</label>
              <input
                type="number"
                min="1"
                value={printQty}
                onChange={(e) => setPrintQty(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Visual elements to include</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input type="checkbox" checked={showMRP} onChange={(e) => setShowMRP(e.target.checked)} />
                <span>Show MRP & Price (₹)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input type="checkbox" checked={showShopName} onChange={(e) => setShowShopName(e.target.checked)} />
                <span>Show Store Name</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-black text-white hover:bg-neutral-800 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Sheet stickers</span>
            </button>
          </div>
        </div>

        {/* Right Panel: Live Scanner Simulator & Lookup */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-gray-400" />
            <span>Interactive Scanner Simulator</span>
          </h3>

          <div className="bg-gray-900 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[160px] text-white">
            {isScanning ? (
              <div className="text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-white animate-spin mx-auto" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 animate-pulse">Running camera scanner lookup...</p>
              </div>
            ) : scannedProduct ? (
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400">Match Found</span>
                  <Volume2 className="h-4 w-4 text-emerald-400 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">{scannedProduct.name}</h4>
                  <p className="text-xs text-gray-400">SKU Code: {scannedProduct.sku} | Barcode: {scannedProduct.barcode}</p>
                  <p className="text-xs text-gray-300">Category: {scannedProduct.category} | Live Stock: <strong>{scannedProduct.stock} Pcs</strong></p>
                  <p className="text-sm font-bold text-emerald-400">Retail Price: ₹{scannedProduct.sellingPrice}</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Barcode className="h-10 w-10 text-gray-600 stroke-[1.2px] mx-auto" />
                <p className="text-[10px] text-gray-400">Scanner stand-by mode. Connect device or trigger camera simulator.</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTriggerScanner}
              className="flex-1 bg-black text-white hover:bg-neutral-800 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="h-4 w-4 text-emerald-400" />
              <span>Auto Beep Scan</span>
            </button>
            <select
              onChange={(e) => handleSimulateScan(e.target.value)}
              className="border border-gray-200 rounded-xl px-2 text-xs bg-white text-gray-900 font-bold"
            >
              <option value="">-- Quick Test Barcode --</option>
              {products.map(p => (
                <option key={p.id} value={p.barcode || p.productCode}>{p.name} ({p.barcode || p.productCode})</option>
              ))}
            </select>
          </div>

          {/* Scanner diagnostics logs */}
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Diagnostics Audit Logs</span>
            <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 max-h-24 overflow-y-auto space-y-1 font-mono text-[9px] text-gray-500">
              {scannerLog.map((log, index) => <div key={index}>{log}</div>)}
              {scannerLog.length === 0 && <div>No scan diagnostic sessions run in current runtime.</div>}
            </div>
          </div>
        </div>

      </div>

      {/* Label Sheet print preview block */}
      {activeProduct && (
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Sticker Sticker Sheet Preview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: Number(printQty) || 6 }).map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-2.5 flex flex-col items-center justify-between text-center bg-gray-50/50 space-y-2 relative overflow-hidden">
                {showShopName && <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-gray-400 truncate w-full">{currentBusiness?.name}</span>}
                <div className="space-y-1">
                  <h5 className="font-bold text-[9px] text-gray-800 leading-tight truncate max-w-[120px]" title={activeProduct.name}>{activeProduct.name}</h5>
                  <p className="text-[8px] text-gray-400">SKU: {activeProduct.sku || activeProduct.productCode}</p>
                </div>
                {labelFormat === 'qr' ? (
                  <div className="h-10 w-10 bg-white border border-gray-200 flex items-center justify-center font-bold text-[8px] text-gray-300 font-mono">QR CODE</div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex gap-[1px] h-6 items-end justify-center px-1">
                      {[1,3,1,2,3,1,2,1,3,2,1,3,1,2,1,3,1].map((w, i) => (
                        <div key={i} className="bg-black" style={{ width: `${w}px`, height: '20px' }}></div>
                      ))}
                    </div>
                    <span className="text-[8px] font-mono text-gray-500 block">{activeProduct.barcode || '8901234560011'}</span>
                  </div>
                )}
                {showMRP && <span className="text-[9px] font-mono font-bold text-gray-900">MRP: ₹{activeProduct.sellingPrice}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
