const fs = require('fs');

const files = [
  'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/components/pdf/SystemEstimatePDF.jsx',
  'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/components/pdf/EstimationPDF.jsx'
];

for (const path of files) {
  if (!fs.existsSync(path)) continue;
  let content = fs.readFileSync(path, 'utf8');

  // 1. Remove TERMS & NOTES and right-align totalsBox
  const termsBoxRegex = /<View style=\{styles\.termsBox\}>[\s\S]*?<\/View>/;
  content = content.replace(termsBoxRegex, '');

  content = content.replace(
    '<View style={styles.bottomRow}>',
    '<View style={[styles.bottomRow, { justifyContent: \'flex-end\' }]}>'
  );

  // 2. Remove Customer Signature and right-align MOSH AUTOMATION signature
  const customerSigRegex = /<View style=\{styles\.sigBlock\}>\s*<Text style=\{styles\.sigLine\}>Customer Signature<\/Text>\s*<\/View>/;
  content = content.replace(customerSigRegex, '');

  content = content.replace(
    '<View style={styles.signatures}>',
    '<View style={[styles.signatures, { justifyContent: \'flex-end\' }]}>'
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log(`Updated ${path}`);
}
