const fs = require('fs');
const path = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/admin/estimations/AdminEstimationsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
const importsToAdd = `import { PDFDownloadLink } from '@react-pdf/renderer';
import SystemEstimatePDF from '../../../components/pdf/SystemEstimatePDF';\n`;

if (!content.includes('import { PDFDownloadLink } from')) {
    content = content.replace("import AppShell from '../../../components/AppShell';", importsToAdd + "import AppShell from '../../../components/AppShell';");
}

// 2. Remove handleDownloadPDF
const handleDownloadPDFStart = content.indexOf('const handleDownloadPDF = () => {');
const handleDownloadPDFEnd = content.indexOf('printWindow.document.close();\n  };');

if (handleDownloadPDFStart !== -1 && handleDownloadPDFEnd !== -1) {
    content = content.substring(0, handleDownloadPDFStart) + 
              "const handleDownloadPDF = () => {}; // Replaced by PDFDownloadLink\n" + 
              content.substring(handleDownloadPDFEnd + 'printWindow.document.close();\n  };'.length);
}

// 3. Replace the button
const buttonSearchStr = `<button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Download size={13} /> PDF
                    </button>`;
const buttonSearchStr2 = `<button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                    >\n                      <Download size={13} /> PDF\n                    </button>`;

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

// Since the button has indents, regex might be safer
const buttonRegex = /<button[\s\S]*?onClick=\{handleDownloadPDF\}[\s\S]*?<\/button>/;
content = content.replace(buttonRegex, replacementJSX);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced HTML print with PDFDownloadLink');
