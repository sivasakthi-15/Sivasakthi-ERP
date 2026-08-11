import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderOpen, Upload, FileText, Trash2, Check, ArrowRight, 
  Eye, Download, RefreshCw, Layers, ShieldCheck, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface RepoDocument {
  id: string;
  name: string;
  category: 'KYC' | 'Invoices' | 'Agreements' | 'Warranties';
  size: string;
  uploadedOn: string;
  uploadedBy: string;
}

export const DocumentsModule: React.FC = () => {
  const { currentBusiness, currentUser } = useApp();
  const bizId = currentBusiness?.id || 'all';

  const [docs, setDocs] = useState<RepoDocument[]>(() => {
    const stored = safeGetItem(`${bizId}_repodocuments`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'doc_1', name: 'Sivasakthi_GSTIN_Reg_Certificate.pdf', category: 'KYC', size: '1.2 MB', uploadedOn: '2026-02-10', uploadedBy: 'Ramasamy K' },
      { id: 'doc_2', name: 'Finolex_Cables_Authorized_Distributor_MoU.pdf', category: 'Agreements', size: '2.4 MB', uploadedOn: '2026-03-01', uploadedBy: 'Siva G' },
      { id: 'doc_3', name: 'Erode_Godown_Lease_Agreement_Signed.pdf', category: 'Agreements', size: '4.1 MB', uploadedOn: '2026-01-15', uploadedBy: 'Ramasamy K' },
    ];
  });

  const [uploadCategory, setUploadCategory] = useState<RepoDocument['category']>('KYC');
  const [dragActive, setDragActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!bizId || bizId === 'all') return;
    api.documents.list(bizId)
      .then(res => {
        if (res && res.length > 0) {
          const mapped = res.map((item: any) => ({
            id: item._id || item.id,
            name: item.name,
            category: item.category,
            size: item.size,
            uploadedOn: item.uploadedOn,
            uploadedBy: item.uploadedBy
          }));
          setDocs(mapped);
          safeSetItem(`${bizId}_repodocuments`, JSON.stringify(mapped));
        }
      })
      .catch(err => console.warn('API fetch failed, utilizing localStorage backup.', err));
  }, [bizId]);

  const saveDocs = (list: RepoDocument[]) => {
    setDocs(list);
    safeSetItem(`${bizId}_repodocuments`, JSON.stringify(list));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const newD: Omit<RepoDocument, 'id'> = {
        name: file.name,
        category: uploadCategory,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedOn: new Date().toISOString().split('T')[0],
        uploadedBy: currentUser?.name || 'Authorized Personnel'
      };

      api.documents.create({ ...newD, shopId: bizId })
        .then(saved => {
          const mapped: RepoDocument = {
            id: saved._id || saved.id,
            ...newD
          };
          saveDocs([mapped, ...docs]);
          triggerToast(`Uploaded ${file.name} Successfully!`);
        })
        .catch(err => {
          console.warn('Failed to save document on server.', err);
          const localD: RepoDocument = {
            ...newD,
            id: `doc_${Math.random().toString(36).substring(2, 9)}`
          };
          saveDocs([localD, ...docs]);
          triggerToast(`Uploaded ${file.name} (Local Backup) Successfully!`);
        });
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newD: Omit<RepoDocument, 'id'> = {
        name: file.name,
        category: uploadCategory,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedOn: new Date().toISOString().split('T')[0],
        uploadedBy: currentUser?.name || 'Authorized Personnel'
      };

      api.documents.create({ ...newD, shopId: bizId })
        .then(saved => {
          const mapped: RepoDocument = {
            id: saved._id || saved.id,
            ...newD
          };
          saveDocs([mapped, ...docs]);
          triggerToast(`Uploaded ${file.name} Successfully!`);
        })
        .catch(err => {
          console.warn('Failed to save document on server.', err);
          const localD: RepoDocument = {
            ...newD,
            id: `doc_${Math.random().toString(36).substring(2, 9)}`
          };
          saveDocs([localD, ...docs]);
          triggerToast(`Uploaded ${file.name} (Local Backup) Successfully!`);
        });
    }
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm('Are you sure you want to delete this document from corporate archives?')) {
      api.documents.delete(id)
        .then(() => {
          saveDocs(docs.filter(d => d.id !== id));
          triggerToast('Document deleted successfully');
        })
        .catch(err => {
          console.warn('Failed to delete document live on server.', err);
          saveDocs(docs.filter(d => d.id !== id));
          triggerToast('Document deleted successfully');
        });
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto space-y-6 font-sans text-xs">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-xl text-xs font-semibold shadow-lg z-50 flex items-center gap-2 border border-gray-800 animate-slide-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <span>Corporate Document Vault & KYC Repository</span>
            <FolderOpen className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-xs text-gray-500 mt-1">Upload and secure KYC papers, vendor authorization letters, billing agreements, and product certificates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Upload Form Panel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">DMS File Uploader</h3>
          
          <div>
            <label className="text-[10px] text-gray-400 font-bold block mb-1">Archive Classification Category *</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as any)}
              className="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-black bg-white font-bold"
            >
              <option value="KYC">Customer / Supplier KYC Verification</option>
              <option value="Invoices">Receipts & Supplier Invoices</option>
              <option value="Agreements">Signed Distributor Contracts / MoUs</option>
              <option value="Warranties">Brand Warranties & Manuals</option>
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative min-h-[160px] ${
              dragActive ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50/50'
            }`}
          >
            <Upload className={`h-8 w-8 mb-2 stroke-[1.2px] ${dragActive ? 'text-black animate-bounce' : 'text-gray-400'}`} />
            <span className="font-bold text-gray-800 block">Drag & Drop Documents Here</span>
            <span className="text-[10px] text-gray-400 block mt-1">Supports PDF, JPG, PNG, and TIFF formats</span>
            <span className="text-[10px] text-gray-400 block">Maximum file capacity: 15 MB</span>
            
            <input
              type="file"
              onChange={handleManualUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Documents Directory List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-100 uppercase tracking-widest text-[9px]">Vault Archives Registry</h3>
          <div className="space-y-3">
            {docs.map(d => (
              <div key={d.id} className="p-4 rounded-xl border border-gray-150 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-black text-white rounded-lg flex items-center justify-center font-mono font-bold uppercase tracking-wider shrink-0">
                    PDF
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-900 block truncate max-w-[280px]">{d.name}</span>
                    <div className="text-[10px] text-gray-400 flex items-center gap-2">
                      <span className="bg-black text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{d.category}</span>
                      <span>| Size: {d.size} | Uploaded: {d.uploadedOn}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-sans mt-0.5">Authorized: {d.uploadedBy}</div>
                  </div>
                </div>

                <div className="flex gap-1 items-center shrink-0">
                  <button
                    onClick={() => alert('Simulated document viewing')}
                    className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded cursor-pointer"
                    title="View Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => alert('Simulated document download')}
                    className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded cursor-pointer"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoc(d.id)}
                    className="p-1 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {docs.length === 0 && (
              <div className="p-8 text-center text-gray-400 font-medium">No archived documents found. Upload above.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
