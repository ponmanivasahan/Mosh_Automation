const fs = require('fs');
const path = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/admin/estimations/AdminEstimationsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const newHtml = `    printWindow.document.write(\`
      <html>
        <head>
          <title>Estimation Invoice - \${selectedProduct.name}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; line-height: 1.4; margin: 0; padding: 0; font-size: 11px; }
            .header-row { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
            .logo-col { width: 25%; }
            .logo-col img { width: 120px; height: auto; }
            .company-col { width: 45%; text-align: center; }
            .company-col h1 { margin: 0 0 5px 0; font-size: 18px; text-transform: uppercase; }
            .company-col p { margin: 2px 0; font-size: 9px; line-height: 1.2; }
            .meta-col { width: 30%; text-align: right; }
            .meta-col h2 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
            .meta-grid { display: grid; grid-template-columns: auto auto; gap: 4px; font-size: 9px; }
            .meta-label { color: #444; text-align: left; }
            .meta-val { font-weight: bold; text-align: right; }
            .section { border: 1px solid #000; margin-bottom: 15px; padding: 10px; }
            .section-title { font-size: 11px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase; }
            .customer-grid { display: grid; grid-template-columns: 15% 5% 80%; gap: 4px; font-size: 10px; }
            .system-row { display: flex; gap: 15px; }
            .sys-img-box { width: 15%; border: 1px solid #ccc; padding: 5px; display: flex; justify-content: center; align-items: center; height: 80px; }
            .sys-details { width: 85%; display: flex; flex-direction: column; justify-content: space-between; }
            .sys-title { font-size: 12px; font-weight: bold; margin: 0 0 4px 0; }
            .sys-desc { font-size: 10px; color: #444; margin: 0; }
            .sys-costs { display: flex; flex-direction: column; gap: 4px; font-size: 10px; margin-top: auto; }
            .sys-cost-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 2px; }
            .invoice-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 15px; }
            .invoice-table th, .invoice-table td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 10px; }
            .invoice-table th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .bottom-row { display: flex; gap: 15px; margin-bottom: 30px; }
            .terms-box { width: 55%; border: 1px solid #000; padding: 10px; }
            .terms-box ul { margin: 0; padding-left: 15px; font-size: 9px; color: #333; }
            .terms-box li { margin-bottom: 4px; }
            .totals-box { width: 45%; border: 1px solid #000; padding: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 10px; }
            .grand-total { border-top: 1px solid #000; padding-top: 6px; margin-top: 6px; font-weight: bold; font-size: 12px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; margin-bottom: 30px; }
            .sig-block { width: 40%; text-align: center; }
            .sig-line { border-top: 1px solid #000; padding-top: 5px; font-size: 10px; }
            .footer { text-align: center; border-top: 1px solid #eee; padding-top: 10px; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="header-row">
            <div class="logo-col">
              \${imageHtml.replace('max-height: 180px', 'max-height: 80px')}
            </div>
            <div class="company-col">
              <h1>MOSH AUTOMATION</h1>
              <p>162 ABC-164, Andal complex, Kamarajar Road,</p>
              <p>Varadharajapuram, Uppilipalayam,</p>
              <p>Coimbatore - 641015. State: Tamilnadu, Code: 33</p>
              <p>Mobile: 7397103576, 9514714441 | Email: admin@moshautomation.com</p>
              <p style="font-weight: bold; margin-top: 4px;">GSTIN: 33DLCPP0458M1ZW</p>
            </div>
            <div class="meta-col">
              <h2>ESTIMATION REPORT</h2>
              <div class="meta-grid">
                <div class="meta-label">Generated on</div>
                <div class="meta-val">: \${new Date().toLocaleDateString('en-GB')}</div>
                <div class="meta-label">Estimation No</div>
                <div class="meta-val">: EST-NEW</div>
                <div class="meta-label">Prepared By</div>
                <div class="meta-val">: Admin</div>
                <div class="meta-label">Valid Till</div>
                <div class="meta-val">: -</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">CUSTOMER DETAILS</div>
            <div class="customer-grid">
              <div>Customer Name</div><div>:</div><div style="font-weight:bold;">-</div>
              <div>Address</div><div>:</div><div>-</div>
              <div>Mobile No</div><div>:</div><div>-</div>
              <div>GSTIN No</div><div>:</div><div style="font-weight:bold;">-</div>
              <div>State Name</div><div>:</div><div>-</div>
              <div>State Code</div><div>:</div><div>-</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">SELECTED SYSTEM</div>
            <div class="system-row">
              <div class="sys-img-box">
                \${imageHtml}
              </div>
              <div class="sys-details">
                <div>
                  <h3 class="sys-title">\${selectedProduct.name}</h3>
                  <p class="sys-desc">\${selectedProduct.description}</p>
                </div>
                <div class="sys-costs">
                  <div class="sys-cost-row">
                    <strong>Base Price</strong>
                    <span>₹\${calculations.basePrice.toLocaleString()}</span>
                  </div>
                  <div class="sys-cost-row">
                    <strong>Float Sensor Fee</strong>
                    <span>₹\${selectedProduct.floatFee} / unit</span>
                  </div>
                  <div class="sys-cost-row">
                    <strong>Wire Base Fee</strong>
                    <span>₹\${selectedProduct.wire?.baseFee || 0} \${Number(selectedProduct.wire?.baseMeters) ? \`(\${selectedProduct.wire.baseMeters}m included)\` : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-title">INVOICE BREAKDOWN</div>
          <table class="invoice-table">
            <thead>
              <tr>
                <th width="8%">S.No</th>
                <th width="42%">Description</th>
                <th width="20%">Quantity / Unit</th>
                <th width="15%">Rate</th>
                <th width="15%">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-center">1</td>
                <td>Products Base Price</td>
                <td class="text-center">\${quantity} Nos</td>
                <td class="text-right">₹\${Number(selectedProduct.price || 0).toLocaleString()}</td>
                <td class="text-right">₹\${calculations.basePrice.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">2</td>
                <td>Float Switch Sensors</td>
                <td class="text-center">\${floatSensors} Nos</td>
                <td class="text-right">₹\${Number(selectedProduct.floatFee || 0).toLocaleString()}</td>
                <td class="text-right">₹\${calculations.totalFloatCost.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">3</td>
                <td>Base Wire Cable (\${calculations.wireBaseMeters}m included)</td>
                <td class="text-center">1 Set</td>
                <td class="text-right">₹\${calculations.baseWireCost.toLocaleString()}</td>
                <td class="text-right">₹\${calculations.baseWireCost.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">4</td>
                <td>Extra Wire Cable (\${calculations.extraMeters}m extra)</td>
                <td class="text-center">\${calculations.extraMeters} m</td>
                <td class="text-right">₹\${Number(selectedProduct.wire?.extraPerMeter || 0).toLocaleString()}</td>
                <td class="text-right">₹\${calculations.extraWireCost.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">5</td>
                <td>Installation Support Fee</td>
                <td class="text-center">1 Job</td>
                <td class="text-right">₹\${calculations.installationFee.toLocaleString()}</td>
                <td class="text-right">₹\${calculations.installationFee.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="bottom-row">
            <div class="terms-box">
              <div class="section-title">TERMS & NOTES</div>
              <ul>
                <li>This is an estimation report and not a tax invoice.</li>
                <li>Final amount may vary based on site conditions and additional requirements.</li>
                <li>GST is calculated as per current applicable rates.</li>
                <li>This estimate is valid till the date mentioned above.</li>
              </ul>
            </div>
            <div class="totals-box">
              <div class="total-row">
                <span>Sub Total</span>
                <span>₹\${calculations.subtotal.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>GST (\${calculations.taxPercent}%)</span>
                <span>₹\${calculations.taxAmount.toLocaleString()}</span>
              </div>
              <div class="total-row grand-total">
                <span>Grand Total</span>
                <span>₹\${calculations.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line">Customer Signature</div>
            </div>
            <div class="sig-block">
              <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px;">For MOSH AUTOMATION</div>
              <div class="sig-line">Authorised Signatory</div>
            </div>
          </div>

          <div class="footer">
            <p style="font-weight: bold; margin: 0 0 2px 0;">Thank you for choosing MOSH AUTOMATION.</p>
            <p style="margin: 0;">Subject to Coimbatore Jurisdiction.</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    \`);
    printWindow.document.close();`;

const startIndex = content.indexOf("printWindow.document.write(`");
const endIndex = content.indexOf("printWindow.document.close();") + "printWindow.document.close();".length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newHtml + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Successfully replaced HTML template!");
} else {
  console.error("Could not find start or end index!");
}
