const fs = require('fs');

const files = [
  'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/components/pdf/SystemEstimatePDF.jsx',
  'C:/Users/hp/Desktop/Mosh_Automation/cLient/src/components/pdf/EstimationPDF.jsx'
];

for (const path of files) {
  if (!fs.existsSync(path)) continue;
  let content = fs.readFileSync(path, 'utf8');

  // We are going to replace the styles block up to headerRow
  const stylesRegex = /headerRow: \{[\s\S]*?\/\/ Sections/m;
  const newStyles = `headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 15,
    marginBottom: 15
  },
  logoCol: { width: '15%', paddingRight: 10 },
  logoImg: { maxHeight: 60, width: 'auto' },
  companyCol: { width: '55%', textAlign: 'left' },
  companyTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  companyText: { fontSize: 9, marginBottom: 3, lineHeight: 1.3, color: '#333' },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, fontSize: 8.5, color: '#333' },
  metaCol: { width: '30%', textAlign: 'left' },
  metaTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
  metaRow: { flexDirection: 'row', marginBottom: 3, fontSize: 9 },
  metaLabel: { width: '45%', color: '#333' },
  metaColon: { width: '10%', textAlign: 'center' },
  metaValue: { width: '45%', fontFamily: 'Helvetica-Bold' },
  
  // Sections`;

  content = content.replace(stylesRegex, newStyles);

  // We are going to replace the HEADER view block
  const headerRegex = /\{\/\* HEADER \*\/\}\s*<View style=\{styles\.headerRow\}>[\s\S]*?\{\/\* CUSTOMER DETAILS \*\/\}/m;
  
  const newHeader = `{/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.logoCol}>
            <Image src={logoUrl} style={styles.logoImg} />
          </View>
          <View style={styles.companyCol}>
            <Text style={styles.companyTitle}>MOSH AUTOMATION</Text>
            <Text style={styles.companyText}>162 ABC-164, Andal complex, Kamarajar Road,</Text>
            <Text style={styles.companyText}>Varadharajapuram, Uppilipalayam, Coimbatore - 641015.</Text>
            <Text style={styles.companyText}>State: Tamilnadu, Code: 33</Text>
            <View style={styles.contactRow}>
              <Text>📞 Mobile: 7397103576, 9514714441</Text>
              <Text style={{ marginHorizontal: 6 }}>|</Text>
              <Text>✉ Email: admin@moshautomation.com</Text>
              <Text style={{ marginHorizontal: 6 }}>|</Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>GSTIN: 33DLCPP0458M1ZW</Text>
            </View>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaTitle}>ESTIMATION REPORT</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Generated on</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>{new Date().toLocaleDateString('en-GB')}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Estimation No</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>EST-NEW</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Prepared By</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>Admin</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Valid Till</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>-</Text>
            </View>
          </View>
        </View>

        {/* CUSTOMER DETAILS */}`;

  content = content.replace(headerRegex, newHeader);

  // Fallback for icons just in case emojis don't render perfectly in PDF's standard Helvetica, we wrap them.
  // Actually, standard react-pdf Helvetica doesn't support emojis well. We might just use text if they fail, but let's try standard unicode symbols ✆ and ✉
  content = content.replace('📞', '✆');

  fs.writeFileSync(path, content, 'utf8');
  console.log("Updated header in " + path);
}
