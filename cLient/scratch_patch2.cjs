const fs = require('fs');
const path = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/admin/estimations/AdminEstimationsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// Patch 1: Add state variables
const stateInsertion = `  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerStateCode, setCustomerStateCode] = useState('');

`;

if (!content.includes('const [customerName, setCustomerName]')) {
  const includeInstallationIndex = content.indexOf('const [includeInstallation, setIncludeInstallation] = useState(true);');
  if (includeInstallationIndex !== -1) {
    const nextLineIndex = content.indexOf('\n', includeInstallationIndex) + 1;
    content = content.slice(0, nextLineIndex) + stateInsertion + content.slice(nextLineIndex);
  }
}

// Patch 2: Add inputs to UI
const inputsHtml = `
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                  Customer Details
                </h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold" />
                  <input type="text" placeholder="Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Mobile No" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold" />
                    <input type="text" placeholder="GSTIN No" value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="State Name" value={customerState} onChange={e => setCustomerState(e.target.value)} className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold" />
                    <input type="text" placeholder="State Code" value={customerStateCode} onChange={e => setCustomerStateCode(e.target.value)} className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none font-bold" />
                  </div>
                </div>
              </div>
`;
const insertionTarget = 'searchable={products.length > 5}\n              />';
if (!content.includes('placeholder="Customer Name"')) {
  content = content.replace(insertionTarget, insertionTarget + inputsHtml);
}

// Patch 3: Update HTML Print template
content = content.replace(
  '<div>Customer Name</div><div>:</div><div style="font-weight:bold;">-</div>',
  '<div>Customer Name</div><div>:</div><div style="font-weight:bold;">${customerName || \'-\'}</div>'
);
content = content.replace(
  '<div>Address</div><div>:</div><div>-</div>',
  '<div>Address</div><div>:</div><div>${customerAddress || \'-\'}</div>'
);
content = content.replace(
  '<div>Mobile No</div><div>:</div><div>-</div>',
  '<div>Mobile No</div><div>:</div><div>${customerMobile || \'-\'}</div>'
);
content = content.replace(
  '<div>GSTIN No</div><div>:</div><div style="font-weight:bold;">-</div>',
  '<div>GSTIN No</div><div>:</div><div style="font-weight:bold;">${customerGstin || \'-\'}</div>'
);
content = content.replace(
  '<div>State Name</div><div>:</div><div>-</div>',
  '<div>State Name</div><div>:</div><div>${customerState || \'-\'}</div>'
);
content = content.replace(
  '<div>State Code</div><div>:</div><div>-</div>',
  '<div>State Code</div><div>:</div><div>${customerStateCode || \'-\'}</div>'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched AdminEstimationsPage.jsx');
