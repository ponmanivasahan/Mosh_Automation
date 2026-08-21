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

// Remove the inputs from left column using string replacement
content = content.replace(inputsHtml, '');

// Now insert it at the bottom of the page
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

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/AppShell>/g;
content = content.replace(regex, `          </div>\n        </div>\n${bottomInputsHtml}\n      </div>\n    </AppShell>`);

fs.writeFileSync(path, content, 'utf8');
console.log('Moved inputs to bottom securely');
