const fs = require('fs');
const path = 'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/pages/admin/estimations/AdminEstimationsPage.jsx';
let content = fs.readFileSync(path, 'utf8');

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

if (content.includes("to: '/admin/invoices'")) {
    console.log("Already has invoices link");
} else {
    // Regex replace to handle different line endings just in case
    const regex = /const adminLinks = \[[\s\S]*?\];/m;
    content = content.replace(regex, newLinks);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed admin links");
}
