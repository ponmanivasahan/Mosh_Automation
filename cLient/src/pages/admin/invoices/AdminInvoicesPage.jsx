import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle, Search, FileText, Download, X, Eye } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import CustomSelect from '../../../components/CustomSelect';
import { getInvoices, addInvoice, deleteInvoice, getProducts } from '../../../utils/storage';
import { formatCurrency } from '../../../utils/format';
import { numberToWords } from '../../../utils/numToWords';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import InvoicePDF from '../../../components/pdf/InvoicePDF';

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

const emptyItem = {
  productId: '',
  productName: '',
  hsnCode: '',
  quantity: 1,
  rate: 0,
  amount: 0
};

const AdminInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [message, setMessage] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(null);
  
  const [form, setForm] = useState({
    customerName: '',
    customerAddress: '',
    customerGstin: '',
    customerState: 'Tamilnadu',
    customerStateCode: '33',
    customerMobile: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceType: 'Cash'
  });
  const [items, setItems] = useState([{ ...emptyItem }]);

  useEffect(() => {
    const fetchLatest = () => {
      try {
        setInvoices(getInvoices());
        setProducts(getProducts());
      } catch (err) {}
    };
    fetchLatest();
    const interval = setInterval(fetchLatest, 2500);
    return () => clearInterval(interval);
  }, []);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...emptyItem }]);
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, key, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[idx][key] = value;
      
      if (key === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          newItems[idx].productName = prod.name;
          newItems[idx].rate = prod.price;
        }
      }
      
      if (['quantity', 'rate', 'productId'].includes(key)) {
        newItems[idx].amount = Number(newItems[idx].quantity) * Number(newItems[idx].rate);
      }
      return newItems;
    });
  };

  const calculations = useMemo(() => {
    const taxableValue = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const isInterstate = form.customerStateCode && form.customerStateCode !== '33';
    
    const sgstRate = isInterstate ? 0 : 9;
    const cgstRate = isInterstate ? 0 : 9;
    const igstRate = isInterstate ? 18 : 0;
    
    const sgstAmount = taxableValue * (sgstRate / 100);
    const cgstAmount = taxableValue * (cgstRate / 100);
    const igstAmount = taxableValue * (igstRate / 100);
    
    const totalTaxes = sgstAmount + cgstAmount + igstAmount;
    const exactTotal = taxableValue + totalTaxes;
    const grandTotal = Math.round(exactTotal);
    const roundedOff = grandTotal - exactTotal;
    
    const amountInWords = numberToWords(grandTotal);

    return {
      taxableValue, sgstRate, sgstAmount, cgstRate, cgstAmount, igstRate, igstAmount, roundedOff, grandTotal, amountInWords
    };
  }, [items, form.customerStateCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !items.length || items.some(i => !i.productName)) {
      setMessage('Please fill required customer name and add valid products.');
      return;
    }

    const payload = {
      id: `INV-${Date.now()}`,
      ...form,
      ...calculations,
      items
    };

    try {
      await addInvoice(payload);
      const updatedInvoices = getInvoices();
      setInvoices(updatedInvoices);
      setShowAddModal(false);
      setForm({
        customerName: '', customerAddress: '', customerGstin: '', customerState: 'Tamilnadu', customerStateCode: '33', customerMobile: '', invoiceDate: new Date().toISOString().split('T')[0], invoiceType: 'Cash'
      });
      setItems([{ ...emptyItem }]);
      setMessage('Invoice generated successfully.');
      setTimeout(() => setMessage(''), 3000);

      // Auto-open PDF Preview
      const newlySaved = updatedInvoices.find(i => i.id === payload.id);
      if (newlySaved) {
        const uiInv = {
          customerName: newlySaved.customer_name,
          customerAddress: newlySaved.customer_address,
          customerGstin: newlySaved.customer_gstin,
          customerState: newlySaved.customer_state,
          customerStateCode: newlySaved.customer_state_code,
          customerMobile: newlySaved.customer_mobile,
          invoiceNumber: newlySaved.invoice_number,
          invoiceDate: newlySaved.invoice_date,
          invoiceType: newlySaved.invoice_type,
          taxableValue: newlySaved.taxable_value,
          sgstRate: newlySaved.sgst_rate,
          sgstAmount: newlySaved.sgst_amount,
          cgstRate: newlySaved.cgst_rate,
          cgstAmount: newlySaved.cgst_amount,
          igstRate: newlySaved.igst_rate,
          igstAmount: newlySaved.igst_amount,
          roundedOff: newlySaved.rounded_off,
          grandTotal: newlySaved.grand_total,
          amountInWords: newlySaved.amount_in_words,
          items: newlySaved.items.map(i => ({
            productName: i.product_name,
            hsnCode: i.hsn_code,
            quantity: i.quantity,
            rate: i.rate,
            amount: i.amount
          }))
        };
        setShowPreviewModal(uiInv);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to generate invoice.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      setInvoices(getInvoices());
      setMessage('Invoice deleted.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to delete invoice.');
    }
  };

  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(inv => 
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (inv.invoice_number && inv.invoice_number.toString().includes(searchQuery)) ||
      (inv.customer_mobile && inv.customer_mobile.includes(searchQuery))
    );
    // basic date filter logic
    if (dateFilter === 'Today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(i => new Date(i.invoice_date).toISOString().split('T')[0] === today);
    }
    return filtered;
  }, [invoices, searchQuery, dateFilter]);

  return (
    <AppShell title="Billing & Invoices" links={adminLinks}>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border backdrop-blur-xl bg-teal-600 text-white border-teal-500 font-bold text-xs"
            >
              <CheckCircle size={16} />
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <article className="panel bg-slate-100 p-6 rounded-lg border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Billing Management</h2>
              <p className="text-xs text-slate-500 mt-1">Manage customer invoices and generate tax invoices.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 border bg-white px-3 py-1.5 rounded-lg text-slate-500 shadow-sm">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 text-xs outline-none focus:ring-0 w-32"
                />
              </div>
              <CustomSelect
                value={dateFilter}
                onChange={setDateFilter}
                options={[{value:'All',label:'All Time'},{value:'Today',label:'Today'}]}
              />
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow transition flex items-center gap-1.5"
              >
                <Plus size={14} /> Create Invoice
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const uiInv = {
                    customerName: inv.customer_name,
                    customerAddress: inv.customer_address,
                    customerGstin: inv.customer_gstin,
                    customerState: inv.customer_state,
                    customerStateCode: inv.customer_state_code,
                    customerMobile: inv.customer_mobile,
                    invoiceNumber: inv.invoice_number,
                    invoiceDate: inv.invoice_date,
                    invoiceType: inv.invoice_type,
                    taxableValue: inv.taxable_value,
                    sgstRate: inv.sgst_rate,
                    sgstAmount: inv.sgst_amount,
                    cgstRate: inv.cgst_rate,
                    cgstAmount: inv.cgst_amount,
                    igstRate: inv.igst_rate,
                    igstAmount: inv.igst_amount,
                    roundedOff: inv.rounded_off,
                    grandTotal: inv.grand_total,
                    amountInWords: inv.amount_in_words,
                    items: inv.items.map(i => ({
                      productName: i.product_name,
                      hsnCode: i.hsn_code,
                      quantity: i.quantity,
                      rate: i.rate,
                      amount: i.amount
                    }))
                  };
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-teal-700">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{inv.customer_name}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{formatCurrency(inv.grand_total)}</td>
                      <td className="px-4 py-3">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Paid</span>
                      </td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                        <button onClick={() => setShowPreviewModal(uiInv)} className="text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded flex items-center gap-1 font-bold">
                          <Eye size={12}/> View
                        </button>
                        <PDFDownloadLink document={<InvoicePDF invoice={uiInv} />} fileName={`Invoice_${inv.invoice_number}.pdf`} className="text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded flex items-center gap-1 font-bold">
                          {({ loading }) => loading ? '...' : <><Download size={12}/> PDF</>}
                        </PDFDownloadLink>
                        <button onClick={() => handleDelete(inv.id)} className="text-rose-600 hover:text-rose-800 bg-rose-50 px-2 py-1 rounded flex items-center gap-1 font-bold">
                          <Trash2 size={12}/> Del
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 italic">No invoices found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-lg max-w-4xl w-full p-6 shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-teal-600" /> Create Tax Invoice</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                
                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                  <div><label className="text-xs font-bold">Customer Name *</label><input type="text" value={form.customerName} onChange={e=>updateForm('customerName', e.target.value)} className="w-full text-xs rounded-lg border px-3 py-2 mt-1" /></div>
                  <div><label className="text-xs font-bold">Mobile</label><input type="text" value={form.customerMobile} onChange={e=>updateForm('customerMobile', e.target.value)} className="w-full text-xs rounded-lg border px-3 py-2 mt-1" /></div>
                  <div className="md:col-span-2"><label className="text-xs font-bold">Address *</label><input type="text" value={form.customerAddress} onChange={e=>updateForm('customerAddress', e.target.value)} className="w-full text-xs rounded-lg border px-3 py-2 mt-1" /></div>
                  <div><label className="text-xs font-bold">GSTIN</label><input type="text" value={form.customerGstin} onChange={e=>updateForm('customerGstin', e.target.value)} className="w-full text-xs rounded-lg border px-3 py-2 mt-1" /></div>
                  <div className="flex gap-2">
                    <div className="flex-1"><label className="text-xs font-bold">State Name</label><input type="text" value={form.customerState} onChange={e=>updateForm('customerState', e.target.value)} className="w-full text-xs rounded-lg border px-3 py-2 mt-1" /></div>
                    <div className="w-24"><label className="text-xs font-bold">Code</label><input type="text" value={form.customerStateCode} onChange={e=>updateForm('customerStateCode', e.target.value)} className="w-full text-xs rounded-lg border px-3 py-2 mt-1" /></div>
                  </div>
                  <div><label className="text-xs font-bold">Invoice Date</label><input type="date" value={form.invoiceDate} onChange={e=>updateForm('invoiceDate', e.target.value)} className="w-full text-xs rounded-lg border px-3 py-2 mt-1" /></div>
                  <div><label className="text-xs font-bold">Type</label><CustomSelect value={form.invoiceType} onChange={v=>updateForm('invoiceType', v)} options={[{value:'Cash',label:'Cash Bill'},{value:'Credit Bill',label:'Credit Bill'},{value:'Estimation',label:'Estimation'}]} /></div>
                </div>

                {/* Items */}
                <div className="border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm">Invoice Items</h3>
                    <button onClick={addItem} type="button" className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded font-bold flex items-center gap-1"><Plus size={12}/> Add Item</button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex flex-wrap md:flex-nowrap items-end gap-2 bg-slate-50 p-2 rounded border">
                        <div className="flex-1 min-w-[200px]"><label className="text-[10px] font-bold">Product</label><CustomSelect value={item.productId} onChange={v=>updateItem(idx, 'productId', v)} options={products.map(p=>({value:p.id, label:p.name}))} /></div>
                        <div className="w-full md:w-auto flex-1 min-w-[150px]"><label className="text-[10px] font-bold">Or enter Name</label><input type="text" value={item.productName} onChange={e=>updateItem(idx, 'productName', e.target.value)} className="w-full text-xs rounded border px-2 py-1.5" /></div>
                        <div className="w-20"><label className="text-[10px] font-bold">HSN</label><input type="text" value={item.hsnCode} onChange={e=>updateItem(idx, 'hsnCode', e.target.value)} className="w-full text-xs rounded border px-2 py-1.5" /></div>
                        <div className="w-16"><label className="text-[10px] font-bold">Qty</label><input type="number" min="1" value={item.quantity} onChange={e=>updateItem(idx, 'quantity', e.target.value)} className="w-full text-xs rounded border px-2 py-1.5" /></div>
                        <div className="w-24"><label className="text-[10px] font-bold">Rate</label><input type="number" min="0" value={item.rate} onChange={e=>updateItem(idx, 'rate', e.target.value)} className="w-full text-xs rounded border px-2 py-1.5" /></div>
                        <div className="w-24"><label className="text-[10px] font-bold">Amount</label><input type="text" readOnly value={item.amount} className="w-full text-xs rounded border px-2 py-1.5 bg-slate-100 font-bold" /></div>
                        {items.length > 1 && <button onClick={()=>removeItem(idx)} className="text-rose-500 p-1.5 bg-rose-50 rounded hover:bg-rose-100 mb-0.5"><Trash2 size={14}/></button>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1 text-xs text-teal-800 space-y-1">
                    <p><strong>Subtotal:</strong> {formatCurrency(calculations.taxableValue)}</p>
                    {calculations.sgstRate > 0 && <p><strong>SGST ({calculations.sgstRate}%):</strong> {formatCurrency(calculations.sgstAmount)}</p>}
                    {calculations.cgstRate > 0 && <p><strong>CGST ({calculations.cgstRate}%):</strong> {formatCurrency(calculations.cgstAmount)}</p>}
                    {calculations.igstRate > 0 && <p><strong>IGST ({calculations.igstRate}%):</strong> {formatCurrency(calculations.igstAmount)}</p>}
                    <p><strong>Rounded Off:</strong> {formatCurrency(calculations.roundedOff)}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-end justify-center">
                    <span className="text-xs font-bold text-teal-700">Grand Total</span>
                    <span className="text-3xl font-black text-teal-900">{formatCurrency(calculations.grandTotal)}</span>
                    <span className="text-[10px] text-teal-600 mt-1 italic text-right">{calculations.amountInWords}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t mt-4 flex justify-end gap-3 bg-white">
                <button onClick={() => setShowAddModal(false)} className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleSubmit} className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg flex items-center gap-2"><CheckCircle size={14}/> Save & Generate Invoice</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-3 border-b bg-slate-50">
                <h3 className="font-bold text-sm flex items-center gap-2"><FileText size={14} className="text-teal-600"/> Invoice Preview</h3>
                <div className="flex gap-2">
                  <PDFDownloadLink document={<InvoicePDF invoice={showPreviewModal} />} fileName={`Invoice_${showPreviewModal.invoiceNumber || 'New'}.pdf`} className="bg-teal-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                    {({ loading }) => loading ? 'Preparing...' : <><Download size={14}/> Download PDF</>}
                  </PDFDownloadLink>
                  <button onClick={() => setShowPreviewModal(null)} className="text-slate-500 hover:text-slate-800 bg-slate-200 px-3 py-1.5 rounded text-xs font-bold"><X size={14}/> Close</button>
                </div>
              </div>
              <div className="flex-1 w-full bg-slate-300">
                <PDFViewer width="100%" height="100%" className="border-0">
                  <InvoicePDF invoice={showPreviewModal} />
                </PDFViewer>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default AdminInvoicesPage;
