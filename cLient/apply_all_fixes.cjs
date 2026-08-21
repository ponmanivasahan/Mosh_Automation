const fs = require('fs');
const path = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/admin/estimations/AdminEstimationsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Imports
const importsToAdd = `import { PDFDownloadLink } from '@react-pdf/renderer';\nimport SystemEstimatePDF from '../../../components/pdf/SystemEstimatePDF';\n`;
if (!content.includes('import { PDFDownloadLink }')) {
    content = content.replace("import AppShell from '../../../components/AppShell';", importsToAdd + "import AppShell from '../../../components/AppShell';");
}

// 2. Fix adminLinks
const newLinks = `const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/products', label: 'Product Management' },
  { to: '/admin/invoices', label: 'Billing' },
  { to: '/admin/billing', label: 'Query Management' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/stories', label: 'Success Stories' },
  { to: '/admin/estimations', label: 'Estimation Calculator' },
  { to: '/admin/customers', label: 'Customers' }
];`;
const linksRegex = /const adminLinks = \[[\s\S]*?\];/m;
content = content.replace(linksRegex, newLinks);

// 3. Add useState
const stateInsertion = `
  // Customer Details Form State
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerStateCode, setCustomerStateCode] = useState('');
`;
if (!content.includes('const [customerName')) {
    content = content.replace('const [includeInstallation, setIncludeInstallation] = useState(true);', 'const [includeInstallation, setIncludeInstallation] = useState(true);' + stateInsertion);
}

// 4. Add Bottom Form
const bottomInputsHtml = `
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
`;
const formRegex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/AppShell>/;
if (!content.includes('Customer Details for Estimation (Optional)')) {
    content = content.replace(formRegex, `          </div>\n        </div>\n${bottomInputsHtml}\n      </div>\n    </AppShell>`);
}

// 5. Replace Button with precise string matching to avoid regex bug
const oldButtonHtml = `<button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Download size={13} /> PDF
                    </button>`;

const replacementJSX = `{selectedProduct && calculations ? (
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
                      fileName={\`Estimation_\${customerName || 'New'}.pdf\`}
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
                  )}`;

// Replace using precise replace
content = content.split(oldButtonHtml).join(replacementJSX);

// 6. Delete handleDownloadPDF completely. It starts at `const handleDownloadPDF` and ends at `printWindow.document.close();\n  };`
const funcStart = content.indexOf('// Download PDF Routine');
const funcEnd = content.indexOf('printWindow.document.close();\n  };');
if (funcStart !== -1 && funcEnd !== -1) {
    const endStr = 'printWindow.document.close();\n  };';
    content = content.substring(0, funcStart) + content.substring(funcEnd + endStr.length);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Master patch applied successfully!');
