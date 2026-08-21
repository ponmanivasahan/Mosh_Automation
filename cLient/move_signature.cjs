const fs = require('fs');

const files = [
  'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/components/pdf/SystemEstimatePDF.jsx',
  'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/components/pdf/EstimationPDF.jsx'
];

const newLayout = `{/* BOTTOM SECTION & SIGNATURE */}
        <View style={[styles.bottomRow, { justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }]}>
          
          <View style={[styles.sigBlock, { paddingBottom: 10 }]}>
            <Text style={[styles.bold, { fontSize: 11, marginBottom: 15 }]}>For MOSH AUTOMATION</Text>
            <Text style={styles.sigLine}>Authorised Signatory</Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Sub Total</Text>
              <Text>{formatCurrency(calculations.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>GST ({calculations.taxPercent || GST_RATE}%)</Text>
              <Text>{formatCurrency(calculations.taxAmount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text>Grand Total</Text>
              <Text>{formatCurrency(calculations.total)}</Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}`;

for (const path of files) {
  if (!fs.existsSync(path)) continue;
  let content = fs.readFileSync(path, 'utf8');

  const startIdx = content.indexOf('{/* BOTTOM SECTION */}');
  const endIdx = content.indexOf('{/* FOOTER */}');
  
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + newLayout + content.substring(endIdx + '{/* FOOTER */}'.length);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Updated " + path);
  } else {
    console.log("Could not find sections in " + path);
  }
}
