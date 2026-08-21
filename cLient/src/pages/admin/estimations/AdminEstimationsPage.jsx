import { useState, useEffect, useMemo } from 'react';
import { Package, Calculator, ClipboardList, Shield, RefreshCw, Edit3, Save, Download, X } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SystemEstimatePDF from '../../../components/pdf/SystemEstimatePDF';
import AppShell from '../../../components/AppShell';
import CustomSelect from '../../../components/CustomSelect';
import { getProducts, getBillingSettings } from '../../../utils/storage';
import { API_URL } from '../../../utils/api';
import { formatCurrency } from '../../../utils/format';
import './AdminEstimationsPage.css';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/invoices', label: 'Billing' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/customers', label: 'Customers' }
];

const AdminEstimationsPage = () => {
  const [products, setProducts] = useState(() => getProducts());
  
  // Initialize to the first product's ID if available
  const [selectedProductId, setSelectedProductId] = useState(() => {
    const list = getProducts();
    return list[0]?.id || '';
  });
  
  // Calculator Inputs
  const [quantity, setQuantity] = useState(1);
  const [wireLength, setWireLength] = useState(30);
  const [floatSensors, setFloatSensors] = useState(1);
  const [includeInstallation, setIncludeInstallation] = useState(true);
  // Customer Details Form State
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerStateCode, setCustomerStateCode] = useState('');


  // Invoice Override States (Edit without DB change)
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [overrideBasePrice, setOverrideBasePrice] = useState('');
  const [overrideFloatCost, setOverrideFloatCost] = useState('');
  const [overrideBaseWireCost, setOverrideBaseWireCost] = useState('');
  const [overrideExtraWireCost, setOverrideExtraWireCost] = useState('');
  const [overrideInstallationFee, setOverrideInstallationFee] = useState('');
  const [overrideTaxRate, setOverrideTaxRate] = useState('18');

  // Sync products list in background
  useEffect(() => {
    const fetchLatest = () => {
      setProducts(getProducts());
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, []);

  // Ensure selectedProductId is initialized once products are loaded
  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Find selected product based on ID
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0] || null;
  }, [selectedProductId, products]);

  // Set default parameters only when the user explicitly switches the selected product
  useEffect(() => {
    if (selectedProduct) {
      setWireLength(selectedProduct.wire?.baseMeters || 30);
      setFloatSensors(selectedProduct.floatFee > 0 ? 1 : 0);
      setIsEditingInvoice(false); // Reset overrides
      setOverrideBasePrice('');
      setOverrideFloatCost('');
      setOverrideBaseWireCost('');
      setOverrideExtraWireCost('');
      setOverrideInstallationFee('');
      setOverrideTaxRate('18');
    }
  }, [selectedProductId]);

  // Estimation Math Calculations
  const calculations = useMemo(() => {
    if (!selectedProduct) return null;

    const billing = getBillingSettings();
    const taxRate = Number(overrideTaxRate || 18) / 100;

    // 1. Base Product Price
    const basePrice = overrideBasePrice !== ''
      ? Number(overrideBasePrice)
      : Number(selectedProduct.price || 0) * Number(quantity);
    
    // 2. Float Sensors Cost
    const baseFloatFee = Number(selectedProduct.floatFee || 0);
    const calculatedFloatCost = baseFloatFee * Number(floatSensors) * Number(quantity);
    const totalFloatCost = overrideFloatCost !== ''
      ? Number(overrideFloatCost)
      : calculatedFloatCost;

    // 3. Wire cost (Separated into Base and Extra)
    const wireBaseFee = Number(selectedProduct.wire?.baseFee || 0);
    const wireBaseMeters = Number(selectedProduct.wire?.baseMeters || 30);
    const wireExtraPerMeter = Number(selectedProduct.wire?.extraPerMeter || 0);
    
    const calculatedBaseWireCost = wireBaseFee * Number(quantity);
    const baseWireCost = overrideBaseWireCost !== ''
      ? Number(overrideBaseWireCost)
      : calculatedBaseWireCost;

    const calculatedExtraMeters = Math.max(0, wireLength - wireBaseMeters);
    const calculatedExtraWireCost = calculatedExtraMeters * wireExtraPerMeter * Number(quantity);
    const extraWireCost = overrideExtraWireCost !== ''
      ? Number(overrideExtraWireCost)
      : calculatedExtraWireCost;

    // 4. Installation
    const billingRate = Number(billing.InstallationRate);
    const installationRateVal = (isNaN(billingRate) || billingRate <= 1) ? 1500 : billingRate;
    const calculatedInstallationFee = includeInstallation 
      ? installationRateVal * Number(quantity)
      : 0;
    const installationFee = (overrideInstallationFee !== '' && includeInstallation)
      ? Number(overrideInstallationFee)
      : calculatedInstallationFee;

    // Subtotal and final total
    const subtotal = basePrice + totalFloatCost + baseWireCost + extraWireCost + installationFee;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      basePrice,
      totalFloatCost,
      baseWireCost,
      extraWireCost,
      installationFee,
      subtotal,
      taxAmount,
      total,
      taxPercent: overrideTaxRate,
      extraMeters: calculatedExtraMeters,
      wireBaseMeters
    };
  }, [
    selectedProduct,
    quantity,
    wireLength,
    floatSensors,
    includeInstallation,
    overrideBasePrice,
    overrideFloatCost,
    overrideBaseWireCost,
    overrideExtraWireCost,
    overrideInstallationFee,
    overrideTaxRate
  ]);

  // Handle Edit mode triggers
  const startEditingInvoice = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!calculations) return;
    setOverrideBasePrice(String(calculations.basePrice));
    setOverrideFloatCost(String(calculations.totalFloatCost));
    setOverrideBaseWireCost(String(calculations.baseWireCost));
    setOverrideExtraWireCost(String(calculations.extraWireCost));
    setOverrideInstallationFee(String(calculations.installationFee));
    setOverrideTaxRate(String(calculations.taxPercent));
    setIsEditingInvoice(true);
  };

  const saveEditedInvoice = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsEditingInvoice(false);
  };

  const resetEditedInvoice = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOverrideBasePrice('');
    setOverrideFloatCost('');
    setOverrideBaseWireCost('');
    setOverrideExtraWireCost('');
    setOverrideInstallationFee('');
    setOverrideTaxRate('18');
    setIsEditingInvoice(false);
  };

  

  return (
    <AppShell title="Estimation Calculator" links={adminLinks}>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        <header className="flex justify-between items-center flex-wrap-mobile">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Admin Estimation Generator</h2>
            <p className="text-xs text-slate-500 mt-1">Configure smart water level controllers and compute exact billing parameters from database fields.</p>
          </div>
          <div className="flex items-center gap-2 bg-white text-teal-700 px-4 py-2 rounded-xl border shadow-sm">
            <RefreshCw size={14} className="text-teal-600" />
            <strong className="text-xs font-bold">Live Catalog Connected</strong>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Selector & Details */}
          <div className="lg:col-span-4 bg-slate-100 border border-slate-200/80 p-6 rounded-lg space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Package size={16} className="text-teal-600" />
                Select Product
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-bold">Pick an automation controller to load specs</p>
            </div>

            <div className="space-y-3">
              <CustomSelect
                value={selectedProductId}
                onChange={setSelectedProductId}
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.name} (₹${p.price})`,
                  image: p.image
                }))}
                searchable={products.length > 5}
              />

              {selectedProduct && (
                <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-4 shadow-sm">
                  <div className="h-44 bg-slate-50 rounded-lg p-3 border flex items-center justify-center">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{selectedProduct.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedProduct.id}</p>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">{selectedProduct.description}</p>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600 font-bold">
                      <div className="flex justify-between">
                        <span>Base Price:</span>
                        <span className="text-slate-800">{formatCurrency(selectedProduct.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Float sensor fee:</span>
                        <span className="text-slate-800">{formatCurrency(selectedProduct.floatFee)} / unit</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wire Base Fee:</span>
                        <span className="text-slate-800">{formatCurrency(selectedProduct.wire?.baseFee)} ({selectedProduct.wire?.baseMeters}m included)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Calculator Configuration & Invoice */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 border border-slate-200/80 p-6 rounded-lg">
            {/* Config Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                <Calculator size={16} className="text-teal-600" />
                Parameters
              </h3>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Quantity (Units)
                  <input
                    disabled={isEditingInvoice}
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none mt-1 font-bold disabled:opacity-50"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Float Switches (Sensors)
                  <input
                    disabled={isEditingInvoice}
                    type="number"
                    min="0"
                    value={floatSensors}
                    onChange={(e) => setFloatSensors(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none mt-1 font-bold disabled:opacity-50"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Wire Length Required (Meters)
                  <input
                    disabled={isEditingInvoice}
                    type="number"
                    min="0"
                    value={wireLength}
                    onChange={(e) => setWireLength(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none mt-1 font-bold disabled:opacity-50"
                  />
                </label>

                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id="installation-opt"
                    checked={includeInstallation}
                    onChange={(e) => setIncludeInstallation(e.target.checked)}
                    className="h-4 w-4 text-teal-600 border-slate-200 rounded cursor-pointer"
                  />
                  <label htmlFor="installation-opt" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Include Installation Support
                  </label>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            {calculations && (
              <div className="bg-white border rounded-lg p-5 flex flex-col justify-between shadow-sm space-y-4">
                <div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-teal-600" />
                      Estimation Invoice
                    </h3>
                    {!isEditingInvoice ? (
                      <button
                        type="button"
                        onClick={startEditingInvoice}
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={11} /> Edit Invoice
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEditedInvoice}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Save size={11} /> Save
                        </button>
                        <button
                          type="button"
                          onClick={resetEditedInvoice}
                          className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <X size={11} /> Reset
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="divide-y divide-slate-100 text-xs mt-3 font-semibold text-slate-600">
                    <div className="flex justify-between py-2 items-center">
                      <span>Products Base Total:</span>
                      {isEditingInvoice ? (
                        <input
                          type="number"
                          value={overrideBasePrice}
                          onChange={(e) => setOverrideBasePrice(e.target.value)}
                          className="w-24 text-right text-xs rounded border border-slate-200 px-1 py-0.5 outline-none font-bold"
                        />
                      ) : (
                        <strong className="text-slate-800">{formatCurrency(calculations.basePrice)}</strong>
                      )}
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span>Float Sensors:</span>
                      {isEditingInvoice ? (
                        <input
                          type="number"
                          value={overrideFloatCost}
                          onChange={(e) => setOverrideFloatCost(e.target.value)}
                          className="w-24 text-right text-xs rounded border border-slate-200 px-1 py-0.5 outline-none font-bold"
                        />
                      ) : (
                        <strong className="text-slate-800">{formatCurrency(calculations.totalFloatCost)}</strong>
                      )}
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span>Base Wire Cable:</span>
                      {isEditingInvoice ? (
                        <input
                          type="number"
                          value={overrideBaseWireCost}
                          onChange={(e) => setOverrideBaseWireCost(e.target.value)}
                          className="w-24 text-right text-xs rounded border border-slate-200 px-1 py-0.5 outline-none font-bold"
                        />
                      ) : (
                        <strong className="text-slate-800">{formatCurrency(calculations.baseWireCost)}</strong>
                      )}
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span>Extra Cable:</span>
                      {isEditingInvoice ? (
                        <input
                          type="number"
                          value={overrideExtraWireCost}
                          onChange={(e) => setOverrideExtraWireCost(e.target.value)}
                          className="w-24 text-right text-xs rounded border border-slate-200 px-1 py-0.5 outline-none font-bold"
                        />
                      ) : (
                        <strong className="text-slate-800">{formatCurrency(calculations.extraWireCost)}</strong>
                      )}
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span>Installation Service:</span>
                      {isEditingInvoice ? (
                        <input
                          type="number"
                          value={overrideInstallationFee}
                          onChange={(e) => setOverrideInstallationFee(e.target.value)}
                          className="w-24 text-right text-xs rounded border border-slate-200 px-1 py-0.5 outline-none font-bold"
                        />
                      ) : (
                        <strong className="text-slate-800">{formatCurrency(calculations.installationFee)}</strong>
                      )}
                    </div>
                    <div className="flex justify-between py-2 bg-slate-50 px-2 rounded font-bold text-slate-800 items-center">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculations.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 items-center">
                      <span>GST Tax (%):</span>
                      {isEditingInvoice ? (
                        <input
                          type="number"
                          value={overrideTaxRate}
                          onChange={(e) => setOverrideTaxRate(e.target.value)}
                          className="w-14 text-right text-xs rounded border border-slate-200 px-1 py-0.5 outline-none font-bold"
                        />
                      ) : (
                        <strong className="text-slate-800">{calculations.taxPercent}% ({formatCurrency(calculations.taxAmount)})</strong>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Estimated Cost</p>
                      <strong className="text-xl font-extrabold text-teal-600 leading-tight">{formatCurrency(calculations.total)}</strong>
                    </div>
                    {selectedProduct && calculations ? (
                    <PDFDownloadLink
                      document={<SystemEstimatePDF estimation={{
                        customerName,
                        customerAddress,
                        customerMobile,
                        customerGstin,
                        customerState,
                        customerStateCode,
                        selectedProduct,
                        calculations,
                        quantity,
                        wireLength,
                        floatSensors,
                        estimationDate: new Date().toISOString(),
                        estimationNumber: 'EST-NEW'
                      }} />}
                      fileName={`Estimation_${customerName || 'New'}.pdf`}
                      className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      {({ loading }) => (
                        <>
                          <Download size={13} /> {loading ? 'Loading...' : 'Download PDF'}
                        </>
                      )}
                    </PDFDownloadLink>
                  ) : (
                    <button disabled className="text-xs bg-slate-400 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow cursor-not-allowed">
                      <Download size={13} /> PDF
                    </button>
                  )}
                  </div>
                </div>
              </div>
            )}
                    </div>
        </div>

        {/* Customer Details Form at the Bottom */}
        <div className="mt-8 bg-slate-100 border border-slate-200/80 p-6 rounded-lg mb-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-6 border-b pb-3">
            <ClipboardList size={18} className="text-teal-600" />
            Customer Details for Estimation (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <label className="block text-sm font-bold text-slate-700">
              Customer Name
              <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none mt-1.5 font-bold shadow-sm" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Address
              <input type="text" placeholder="Full Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none mt-1.5 font-bold shadow-sm" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Mobile No
              <input type="text" placeholder="Mobile No" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none mt-1.5 font-bold shadow-sm" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              GSTIN No
              <input type="text" placeholder="GSTIN Number" value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none mt-1.5 font-bold shadow-sm" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              State Name
              <input type="text" placeholder="State Name" value={customerState} onChange={e => setCustomerState(e.target.value)} className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none mt-1.5 font-bold shadow-sm" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              State Code
              <input type="text" placeholder="State Code" value={customerStateCode} onChange={e => setCustomerStateCode(e.target.value)} className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none mt-1.5 font-bold shadow-sm" />
            </label>
          </div>
        </div>

      </div>
    </AppShell>
  );
};

export default AdminEstimationsPage;
