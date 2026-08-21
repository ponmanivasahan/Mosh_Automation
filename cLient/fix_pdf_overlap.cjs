const fs = require('fs');

const files = [
  'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/components/pdf/SystemEstimatePDF.jsx',
  'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/components/pdf/EstimationPDF.jsx'
];

for (const path of files) {
  if (!fs.existsSync(path)) continue;
  let content = fs.readFileSync(path, 'utf8');

  // Fix the style
  content = content.replace(
    "contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, fontSize: 8.5, color: '#333' }",
    "contactRow: { marginTop: 8, fontSize: 8.5, color: '#333', lineHeight: 1.4 }"
  );

  // Fix the JSX structure
  const oldContactRow = `<View style={styles.contactRow}>
              <Text>✆ Mobile: 7397103576, 9514714441</Text>
              <Text style={{ marginHorizontal: 6 }}>|</Text>
              <Text>✉ Email: admin@moshautomation.com</Text>
              <Text style={{ marginHorizontal: 6 }}>|</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>GSTIN: 33DLCPP0458M1ZW</Text>
            </View>`;

  const newContactRow = `<Text style={styles.contactRow}>
              ✆ Mobile: 7397103576, 9514714441   |   ✉ Email: admin@moshautomation.com   |   <Text style={{ fontFamily: 'Helvetica-Bold' }}>GSTIN: 33DLCPP0458M1ZW</Text>
            </Text>`;

  content = content.replace(oldContactRow, newContactRow);

  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed contact row overlap in ' + path);
}
