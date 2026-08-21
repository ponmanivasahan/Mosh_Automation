const fs = require('fs');
const path = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/admin/estimations/AdminEstimationsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

const stateInsertion = `
  // Customer Details Form State
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerStateCode, setCustomerStateCode] = useState('');
`;

if (!content.includes('const [customerName, setCustomerName]')) {
  content = content.replace('const [includeInstallation, setIncludeInstallation] = useState(true);', 'const [includeInstallation, setIncludeInstallation] = useState(true);' + stateInsertion);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully added state variables');
} else {
  console.log('State variables already exist');
}
