const fs = require('fs');
const path = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/admin/estimations/AdminEstimationsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const inputsHtml = `
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                  Customer Details (Optional)
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

if (!content.includes('placeholder="Customer Name"')) {
  content = content.replace(/searchable=\{products\.length > 5\}\r?\n\s*\/>/g, (match) => match + inputsHtml);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully patched inputs into AdminEstimationsPage.jsx');
} else {
  console.log('Inputs already exist!');
}
