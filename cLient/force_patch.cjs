const fs = require('fs');
const path = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/admin/estimations/AdminEstimationsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

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

// 1. Replace the button using regex that ignores exact whitespace
const buttonRegex = /<button[^>]*?onClick=\{handleDownloadPDF\}[^>]*?>[\s\S]*?<\/button>/;
if (buttonRegex.test(content)) {
    content = content.replace(buttonRegex, replacementJSX);
    console.log("Successfully replaced button with PDFDownloadLink!");
} else {
    console.log("Could not find button to replace.");
}

// 2. Delete the handleDownloadPDF function
const funcStart = content.indexOf('// Download PDF Routine');
const funcEndRegex = /printWindow\.document\.close\(\);\s*\n\s*\};/;
const funcEndMatch = content.match(funcEndRegex);

if (funcStart !== -1 && funcEndMatch) {
    const endIndex = funcEndMatch.index + funcEndMatch[0].length;
    content = content.substring(0, funcStart) + content.substring(endIndex);
    console.log("Successfully deleted handleDownloadPDF function!");
} else {
    console.log("Could not find handleDownloadPDF to delete.");
}

fs.writeFileSync(path, content, 'utf8');
