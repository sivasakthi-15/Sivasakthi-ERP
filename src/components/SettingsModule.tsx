import React, { useEffect, useMemo, useState } from 'react';
import { Check, Download, Eye, ImagePlus, Plus, Save, Settings, Trash2, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BankAccount, BusinessDetails, InvoiceAppearance } from '../types';

const emptyBank = (): BankAccount => ({
  id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  beneficiaryName: '', bankName: '', branch: '', accountNumber: '', ifscCode: '', accountType: 'Current', upiId: ''
});

const Field: React.FC<{
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, className = '' }) => (
  <label className={`block text-[10px] font-bold text-gray-500 ${className}`}>
    {label}
    <input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-xs font-normal text-gray-800 outline-none focus:border-black"
    />
  </label>
);

const defaultAppearance: InvoiceAppearance = {
  showLogo: true, showGst: true, showQr: true, showBankDetails: true,
  showSignature: true, showSeal: true, showFooter: true,
  showProprietorName: true, showLogoOnThermal: false
};

export const SettingsModule: React.FC = () => {
  const { businessDetails, currentBusiness, updateBusinessDetails, exportBackup, importBackup } = useApp();
  const [form, setForm] = useState<BusinessDetails>(businessDetails);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setForm({ ...businessDetails, appearance: { ...defaultAppearance, ...(businessDetails.appearance || {}) } });
  }, [businessDetails.id]);

  const banks = useMemo(() => form.banks?.length ? form.banks : [emptyBank()], [form.banks]);
  const selectedBank = banks.find((bank) => bank.id === form.defaultBankAccountId) || banks[0];
  const update = <K extends keyof BusinessDetails>(key: K, value: BusinessDetails[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const updateAppearance = (key: keyof InvoiceAppearance) => {
    setForm((prev) => ({ ...prev, appearance: { ...defaultAppearance, ...(prev.appearance || {}), [key]: !prev.appearance?.[key] } }));
  };

  const handleAsset = (file: File | undefined, key: 'logo' | 'signatureImage' | 'companySeal') => {
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowed.includes(file.type) && !/\.(png|jpe?g|svg)$/i.test(file.name)) {
      setError('Logo, signature, and seal files must be PNG, JPG, JPEG, or SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image files must be 5 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update(key, String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const updateBank = (id: string, key: keyof BankAccount, value: string) => {
    update('banks', banks.map((bank) => bank.id === id ? { ...bank, [key]: value } : bank));
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const name = (form.tradingName || form.name || '').trim();
    if (!name) {
      setError('Trading name is required.');
      return;
    }
    const defaultAccount = selectedBank || emptyBank();
    updateBusinessDetails({
      ...form,
      name,
      tradingName: name,
      banks,
      defaultBankAccountId: defaultAccount.id,
      bankName: defaultAccount.bankName,
      accountHolder: defaultAccount.beneficiaryName,
      accountNumber: defaultAccount.accountNumber,
      ifscCode: defaultAccount.ifscCode,
      branch: defaultAccount.branch,
      upiId: defaultAccount.upiId,
      termsAndConditions: typeof form.termsAndConditions === 'string'
        ? String(form.termsAndConditions).split('\n').filter(Boolean)
        : form.termsAndConditions || []
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importBackup(JSON.parse(String(reader.result)));
        setSaved(true);
      } catch {
        setError('Backup file could not be imported.');
      }
    };
    reader.readAsText(file);
  };

  const appearanceLabels: Array<[keyof InvoiceAppearance, string]> = [
    ['showLogo', 'Show logo'], ['showGst', 'Show GST'], ['showQr', 'Show QR'],
    ['showBankDetails', 'Show bank details'], ['showSignature', 'Show signature'],
    ['showSeal', 'Show seal'], ['showFooter', 'Show footer'],
    ['showProprietorName', 'Show proprietor'], ['showLogoOnThermal', 'Logo on thermal receipt']
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#f9fafb] p-6 font-sans">
      {saved && <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 shadow-lg"><Check className="h-4 w-4" /> Company Master saved</div>}
      {error && <div className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 shadow-lg"><X className="h-4 w-4" /> {error}</div>}

      <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-150 bg-white p-5 shadow-sm">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Settings className="h-5 w-5" /> Company Master / Shop Profile</h1>
          <p className="mt-1 text-xs text-gray-500">Single source of truth for {currentBusiness?.name || 'the active shop'}.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPreview(true)} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold hover:border-black"><Eye className="h-4 w-4" /> Preview Invoice</button>
          <button type="submit" form="company-master-form" className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"><Save className="h-4 w-4" /> Save Company Master</button>
        </div>
      </div>

      <form id="company-master-form" onSubmit={handleSave} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="space-y-4 rounded-2xl border border-gray-150 bg-white p-5 shadow-sm">
            <h2 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">Company Logo &amp; Firm Identity</h2>
            <div className="grid gap-4 md:grid-cols-[160px_1fr]">
              <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-2">
                {form.logo ? <img src={form.logo} alt="Company logo" className="h-24 w-32 object-contain" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-black text-xl font-black text-white">{(form.tradingName || form.name || 'CO').slice(0, 2).toUpperCase()}</div>}
                <label className="mt-2 flex cursor-pointer items-center gap-1 text-[10px] font-bold text-gray-600 hover:text-black"><ImagePlus className="h-3.5 w-3.5" /> {form.logo ? 'Replace logo' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" className="hidden" onChange={(e) => handleAsset(e.target.files?.[0], 'logo')} /></label>
                {form.logo && <button type="button" onClick={() => update('logo', '')} className="mt-1 text-[10px] text-red-500 hover:text-red-700">Remove logo</button>}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Legal Company Name" value={form.name || ''} onChange={(v) => update('name', v)} />
                <Field label="Trading Name *" value={form.tradingName || form.name || ''} onChange={(v) => update('tradingName', v)} />
                <Field label="Proprietor Name" value={form.proprietorName || ''} onChange={(v) => update('proprietorName', v)} />
                <Field label="GSTIN" value={form.gstNumber || ''} onChange={(v) => update('gstNumber', v.toUpperCase())} />
                <Field label="PAN" value={form.panNumber || ''} onChange={(v) => update('panNumber', v.toUpperCase())} />
                <Field label="MSME Number" value={form.msmeNumber || ''} onChange={(v) => update('msmeNumber', v)} />
                <Field label="CIN" value={form.cin || ''} onChange={(v) => update('cin', v)} />
                <Field label="Email" value={form.email || ''} onChange={(v) => update('email', v)} type="email" />
                <Field label="Website" value={form.website || ''} onChange={(v) => update('website', v)} />
                <Field label="Phone 1" value={form.phone || ''} onChange={(v) => update('phone', v)} />
                <Field label="Phone 2" value={form.altPhone || ''} onChange={(v) => update('altPhone', v)} />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-150 bg-white p-5 shadow-sm">
            <h2 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">Complete Address</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Door Number" value={form.doorNumber || ''} onChange={(v) => update('doorNumber', v)} />
              <Field label="Street" value={form.street || ''} onChange={(v) => update('street', v)} />
              <Field label="Area" value={form.area || ''} onChange={(v) => update('area', v)} />
              <Field label="City" value={form.city || ''} onChange={(v) => update('city', v)} />
              <Field label="District" value={form.district || ''} onChange={(v) => update('district', v)} />
              <Field label="State" value={form.state || ''} onChange={(v) => update('state', v)} />
              <Field label="Country" value={form.country || 'India'} onChange={(v) => update('country', v)} />
              <Field label="Pincode" value={form.pincode || ''} onChange={(v) => update('pincode', v)} />
              <Field label="Legacy / Full Address" value={form.address || ''} onChange={(v) => update('address', v)} className="md:col-span-2" />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-150 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2"><h2 className="text-sm font-bold text-gray-800">Bank Accounts</h2><button type="button" onClick={() => update('banks', [...banks, emptyBank()])} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold hover:border-black"><Plus className="h-3 w-3" /> Add account</button></div>
            {banks.map((bank) => <div key={bank.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3"><div className="mb-3 flex items-center justify-between"><label className="flex items-center gap-2 text-[10px] font-bold"><input type="radio" checked={form.defaultBankAccountId === bank.id || (!form.defaultBankAccountId && bank.id === banks[0].id)} onChange={() => update('defaultBankAccountId', bank.id)} /> Default for invoices</label>{banks.length > 1 && <button type="button" onClick={() => update('banks', banks.filter((item) => item.id !== bank.id))} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}</div><div className="grid gap-3 md:grid-cols-4"><Field label="Beneficiary Name" value={bank.beneficiaryName} onChange={(v) => updateBank(bank.id, 'beneficiaryName', v)} /><Field label="Bank Name" value={bank.bankName} onChange={(v) => updateBank(bank.id, 'bankName', v)} /><Field label="Branch" value={bank.branch} onChange={(v) => updateBank(bank.id, 'branch', v)} /><Field label="Account Type" value={bank.accountType} onChange={(v) => updateBank(bank.id, 'accountType', v)} /><Field label="Account Number" value={bank.accountNumber} onChange={(v) => updateBank(bank.id, 'accountNumber', v)} /><Field label="IFSC" value={bank.ifscCode} onChange={(v) => updateBank(bank.id, 'ifscCode', v)} /><Field label="UPI ID" value={bank.upiId} onChange={(v) => updateBank(bank.id, 'upiId', v)} /></div></div>)}
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-150 bg-white p-5 shadow-sm">
            <h2 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">Invoice Branding &amp; Numbering</h2>
            <div className="grid gap-3 md:grid-cols-2"><Field label="Invoice Prefix" value={form.invoicePrefix || ''} onChange={(v) => update('invoicePrefix', v.toUpperCase())} /><Field label="Starting Invoice Number" type="number" value={form.startingInvoiceNumber || 1} onChange={(v) => update('startingInvoiceNumber', Number(v) || 1)} /><Field label="Authorized Signatory Name" value={form.authorizedSignature || ''} onChange={(v) => update('authorizedSignature', v)} /><Field label="Invoice Footer Message" value={form.invoiceFooterMessage || ''} onChange={(v) => update('invoiceFooterMessage', v)} /></div>
            <label className="block text-[10px] font-bold text-gray-500">Terms &amp; Conditions<textarea value={(form.termsAndConditions || []).join('\n')} onChange={(e) => update('termsAndConditions', e.target.value.split('\n'))} className="mt-1 h-24 w-full resize-y rounded-lg border border-gray-200 p-2 text-xs font-normal outline-none focus:border-black" /></label>
            <label className="block text-[10px] font-bold text-gray-500">Declaration<textarea value={form.declaration || ''} onChange={(e) => update('declaration', e.target.value)} className="mt-1 h-16 w-full resize-y rounded-lg border border-gray-200 p-2 text-xs font-normal outline-none focus:border-black" /></label>
            <div className="grid gap-4 md:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3 text-[10px] font-bold">Signature Image {form.signatureImage && <img src={form.signatureImage} className="h-10 max-w-24 object-contain" />}<input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={(e) => handleAsset(e.target.files?.[0], 'signatureImage')} /></label><label className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3 text-[10px] font-bold">Company Seal {form.companySeal && <img src={form.companySeal} className="h-10 max-w-24 object-contain" />}<input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={(e) => handleAsset(e.target.files?.[0], 'companySeal')} /></label></div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-gray-150 bg-white p-5 shadow-sm"><h2 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">QR Code &amp; Invoice Appearance</h2><Field label="Static UPI QR / Image Data" value={form.staticUpiQr || ''} onChange={(v) => update('staticUpiQr', v)} /><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.dynamicPaymentQr || false} onChange={(e) => update('dynamicPaymentQr', e.target.checked)} /> Enable dynamic payment QR (future)</label><div className="grid gap-2">{appearanceLabels.map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-lg border border-gray-100 p-2 text-xs"><span>{label}</span><input type="checkbox" checked={form.appearance?.[key] ?? defaultAppearance[key]} onChange={() => updateAppearance(key)} /></label>)}</div></section>
          <section className="space-y-3 rounded-2xl border border-gray-150 bg-white p-5 shadow-sm"><h2 className="border-b border-gray-100 pb-2 text-sm font-bold text-gray-800">Database Backup</h2><button type="button" onClick={exportBackup} className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left text-xs font-bold hover:border-black">Export company data <Download className="h-4 w-4" /></button><label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3 text-xs font-bold hover:border-black">Import backup <Upload className="h-4 w-4" /><input type="file" accept=".json" onChange={handleImport} className="hidden" /></label></section>
        </div>
      </form>

      {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">Invoice Preview</h2><button type="button" onClick={() => setPreview(false)}><X className="h-5 w-5" /></button></div><div className="mx-auto max-w-2xl border border-gray-300 bg-white p-8 text-xs shadow-sm"><div className="flex items-start justify-between border-b-2 border-black pb-5"><div className="flex items-center gap-3">{form.logo ? <img src={form.logo} className="h-12 w-16 object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-black font-bold text-white">{(form.tradingName || form.name || 'CO').slice(0, 2).toUpperCase()}</div>}<div><h3 className="text-lg font-black">{form.tradingName || form.name || 'Company Name'}</h3><p>{form.address || [form.doorNumber, form.street, form.area, form.city, form.state, form.pincode].filter(Boolean).join(', ')}</p><p>{form.phone} {form.email && `• ${form.email}`}</p></div></div><div className="text-right"><strong className="rounded bg-black px-2 py-1 text-white">TAX INVOICE</strong><p className="mt-3">GSTIN: {form.gstNumber || '—'}</p></div></div><div className="mt-6 h-40 rounded border border-dashed border-gray-300 p-4 text-gray-400">Product table preview</div><div className="mt-6 flex justify-end"><div className="w-64 rounded border p-4"><div className="flex justify-between"><span>Subtotal</span><span>₹0.00</span></div><div className="mt-3 flex justify-between border-t pt-2 font-bold"><span>Grand Total</span><span>₹0.00</span></div></div></div><p className="mt-8 text-center text-gray-500">{form.invoiceFooterMessage || 'Thank you for your business'}</p></div></div></div>}
    </div>
  );
};
