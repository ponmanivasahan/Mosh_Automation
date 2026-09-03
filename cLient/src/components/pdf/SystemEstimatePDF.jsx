import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const GST_RATE = 18;

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'Rs 0';
  return 'Rs ' + Number(amount).toLocaleString('en-IN');
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    fontWeight: 'bold'
  },
  
  // Header Row
  headerRow: {
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
  contactRow: { marginTop: 8, fontSize: 8.5, color: '#333', lineHeight: 1.4 },
  metaCol: { width: '30%', textAlign: 'left' },
  metaTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
  metaRow: { flexDirection: 'row', marginBottom: 3, fontSize: 9 },
  metaLabel: { width: '45%', color: '#333' },
  metaColon: { width: '10%', textAlign: 'center' },
  metaValue: { width: '45%', fontFamily: 'Helvetica-Bold' },
  
  // Sections
  section: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 15,
    padding: 10
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  
  // Customer Grid
  customerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cRow: { flexDirection: 'row', width: '50%', marginBottom: 4 },
  cLabel: { width: '35%', color: '#444' },
  cColon: { width: '5%' },
  cVal: { width: '60%', fontFamily: 'Helvetica-Bold' },

  // System Row
  systemRow: {
    flexDirection: 'row',
    gap: 15
  },
  sysImgBox: {
    width: '15%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 80
  },
  sysImg: { maxHeight: 70, maxWidth: '100%', objectFit: 'contain' },
  sysDetails: { width: '85%', justifyContent: 'space-between' },
  sysTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  sysDesc: { fontSize: 10, color: '#444', marginBottom: 8 },
  sysCosts: { flexDirection: 'column', gap: 4, marginTop: 'auto' },
  sysCostRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomStyle: 'dashed', borderBottomColor: '#eee', paddingBottom: 2 },

  // Table
  table: { width: '100%', borderWidth: 1, borderColor: '#000', marginBottom: 15 },
  tHead: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderColor: '#000' },
  tRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  tRowLast: { flexDirection: 'row' },
  tColHeader: { padding: 6, fontFamily: 'Helvetica-Bold', textAlign: 'center', borderRightWidth: 1, borderColor: '#000' },
  tCol: { padding: 6, borderRightWidth: 1, borderColor: '#000' },
  tColLast: { padding: 6 },
  col1: { width: '8%', textAlign: 'center' },
  col2: { width: '42%' },
  col3: { width: '20%', textAlign: 'center' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  
  // Bottom Row
  bottomRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  termsBox: { width: '55%', borderWidth: 1, borderColor: '#000', padding: 10 },
  termsItem: { fontSize: 9, color: '#333', marginBottom: 4 },
  totalsBox: { width: '45%', borderWidth: 1, borderColor: '#000', padding: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  grandTotal: { borderTopWidth: 1, borderColor: '#000', paddingTop: 6, marginTop: 6, fontFamily: 'Helvetica-Bold', fontSize: 12 },

  // Signatures
  signatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, marginBottom: 30 },
  sigBlock: { width: '40%', textAlign: 'center' },
  sigLine: { borderTopWidth: 1, borderColor: '#000', paddingTop: 5 },
  
  // Footer
  footer: { textAlign: 'center', borderTopWidth: 1, borderColor: '#eee', paddingTop: 10, fontSize: 9 }
});

const SystemEstimatePDF = ({ estimation }) => {
  const formData = estimation || {};
  const selectedProduct = formData.selectedProduct || {};
  const calculations = formData.calculations || {};

  const logoPath = '/logo background.png'; // Will be absolute in vite but for React PDF we need a valid path or base64. React-PDF handles public folder via absolute URL or just relying on Vite serving it.
  
  // React-PDF Image component requires a valid source. Since we're running in client, window.location.origin is available.
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo%20background.png` : logoPath;
  const stampUrl = typeof window !== 'undefined' ? `${window.location.origin}/mosh_stamp.png` : '/mosh_stamp.png';
  const productImgUrl = selectedProduct?.image?.startsWith('data:') 
    ? selectedProduct.image 
    : typeof window !== 'undefined' && selectedProduct.image
      ? `${window.location.origin}${selectedProduct.image}` 
      : selectedProduct.image;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.logoCol}>
            <Image src={logoUrl} style={styles.logoImg} />
          </View>
          <View style={styles.companyCol}>
            <Text style={styles.companyTitle}>MOSH AUTOMATION</Text>
            <Text style={styles.companyText}>162 ABC-164, Andal complex, Kamarajar Road,</Text>
            <Text style={styles.companyText}>Varadharajapuram, Uppilipalayam, Coimbatore - 641015.</Text>
            <Text style={styles.companyText}>State: Tamilnadu, Code: 33</Text>
            <Text style={styles.contactRow}>
              ✆ Mobile: 7397103576, 9514714441   |   ✉ Email: admin@moshautomation.com   |   <Text style={{ fontFamily: 'Helvetica-Bold' }}>GSTIN: 33DLCPP0458M1ZW</Text>
            </Text>
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

        {/* CUSTOMER DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>
          <View style={styles.customerGrid}>
            <View style={styles.cRow}>
              <Text style={styles.cLabel}>Customer Name</Text><Text style={styles.cColon}>:</Text><Text style={styles.cVal}>{formData.customerName || '-'}</Text>
            </View>
            <View style={styles.cRow}>
              <Text style={styles.cLabel}>Address</Text><Text style={styles.cColon}>:</Text><Text style={styles.cVal}>{formData.customerAddress || '-'}</Text>
            </View>
            <View style={styles.cRow}>
              <Text style={styles.cLabel}>Mobile No</Text><Text style={styles.cColon}>:</Text><Text style={styles.cVal}>{formData.customerMobile || '-'}</Text>
            </View>
            <View style={styles.cRow}>
              <Text style={styles.cLabel}>GSTIN No</Text><Text style={styles.cColon}>:</Text><Text style={styles.cVal}>{formData.customerGstin || '-'}</Text>
            </View>
            <View style={styles.cRow}>
              <Text style={styles.cLabel}>State Name</Text><Text style={styles.cColon}>:</Text><Text style={styles.cVal}>{formData.customerState || '-'}</Text>
            </View>
            <View style={styles.cRow}>
              <Text style={styles.cLabel}>State Code</Text><Text style={styles.cColon}>:</Text><Text style={styles.cVal}>{formData.customerStateCode || '-'}</Text>
            </View>
          </View>
        </View>

        {/* SELECTED SYSTEM */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECTED SYSTEM</Text>
          <View style={styles.systemRow}>
            <View style={styles.sysImgBox}>
              {productImgUrl ? <Image src={productImgUrl} style={styles.sysImg} /> : null}
            </View>
            <View style={styles.sysDetails}>
              <View>
                <Text style={styles.sysTitle}>{selectedProduct.name}</Text>
                <Text style={styles.sysDesc}>{selectedProduct.description}</Text>
              </View>
              <View style={styles.sysCosts}>
                <View style={styles.sysCostRow}>
                  <Text style={styles.bold}>Base Price</Text>
                  <Text>{formatCurrency(calculations.basePrice)}</Text>
                </View>
                <View style={styles.sysCostRow}>
                  <Text style={styles.bold}>Float Sensor Fee</Text>
                  <Text>{formatCurrency(selectedProduct.floatFee)} / unit</Text>
                </View>
                <View style={[styles.sysCostRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.bold}>Wire Base Fee</Text>
                  <Text>{formatCurrency(selectedProduct.wire?.baseFee || 0)} {Number(selectedProduct.wire?.baseMeters) ? `(${selectedProduct.wire.baseMeters}m included)` : ''}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* INVOICE BREAKDOWN TABLE */}
        <Text style={[styles.sectionTitle, { marginBottom: 5 }]}>INVOICE BREAKDOWN</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tHead}>
            <Text style={[styles.tColHeader, styles.col1]}>S.No</Text>
            <Text style={[styles.tColHeader, styles.col2]}>Description</Text>
            <Text style={[styles.tColHeader, styles.col3]}>Qty / Unit</Text>
            <Text style={[styles.tColHeader, styles.col4]}>Rate</Text>
            <Text style={[styles.tColHeader, styles.col5, { borderRightWidth: 0 }]}>Amount</Text>
          </View>
          {/* Rows */}
          <View style={styles.tRow}>
            <Text style={[styles.tCol, styles.col1]}>1</Text>
            <Text style={[styles.tCol, styles.col2]}>Products Base Price</Text>
            <Text style={[styles.tCol, styles.col3]}>{formData.quantity || 1} Nos</Text>
            <Text style={[styles.tCol, styles.col4]}>{formatCurrency(selectedProduct.price || 0)}</Text>
            <Text style={[styles.tCol, styles.col5, { borderRightWidth: 0 }]}>{formatCurrency(calculations.basePrice)}</Text>
          </View>
          <View style={styles.tRow}>
            <Text style={[styles.tCol, styles.col1]}>2</Text>
            <Text style={[styles.tCol, styles.col2]}>Float Switch Sensors</Text>
            <Text style={[styles.tCol, styles.col3]}>{formData.floatSensors || 0} Nos</Text>
            <Text style={[styles.tCol, styles.col4]}>{formatCurrency(selectedProduct.floatFee || 0)}</Text>
            <Text style={[styles.tCol, styles.col5, { borderRightWidth: 0 }]}>{formatCurrency(calculations.totalFloatCost)}</Text>
          </View>
          <View style={styles.tRow}>
            <Text style={[styles.tCol, styles.col1]}>3</Text>
            <Text style={[styles.tCol, styles.col2]}>Base Wire Cable ({calculations.wireBaseMeters || 0}m included)</Text>
            <Text style={[styles.tCol, styles.col3]}>1 Set</Text>
            <Text style={[styles.tCol, styles.col4]}>{formatCurrency(calculations.baseWireCost)}</Text>
            <Text style={[styles.tCol, styles.col5, { borderRightWidth: 0 }]}>{formatCurrency(calculations.baseWireCost)}</Text>
          </View>
          <View style={styles.tRow}>
            <Text style={[styles.tCol, styles.col1]}>4</Text>
            <Text style={[styles.tCol, styles.col2]}>Extra Wire Cable ({calculations.extraMeters || 0}m extra)</Text>
            <Text style={[styles.tCol, styles.col3]}>{calculations.extraMeters || 0} m</Text>
            <Text style={[styles.tCol, styles.col4]}>{formatCurrency(selectedProduct.wire?.extraPerMeter || 0)}</Text>
            <Text style={[styles.tCol, styles.col5, { borderRightWidth: 0 }]}>{formatCurrency(calculations.extraWireCost)}</Text>
          </View>
          <View style={[styles.tRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.tCol, styles.col1]}>5</Text>
            <Text style={[styles.tCol, styles.col2]}>Installation Support Fee</Text>
            <Text style={[styles.tCol, styles.col3]}>1 Job</Text>
            <Text style={[styles.tCol, styles.col4]}>{formatCurrency(calculations.installationFee)}</Text>
            <Text style={[styles.tCol, styles.col5, { borderRightWidth: 0 }]}>{formatCurrency(calculations.installationFee)}</Text>
          </View>
        </View>

        {/* BOTTOM SECTION & SIGNATURE */}
        <View style={[styles.bottomRow, { justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }]}>
          
          <View style={[styles.sigBlock, { paddingBottom: 10, alignItems: 'center' }]}>
            <Image src={stampUrl} style={{ width: 60, height: 60 }} />
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

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={[styles.bold, { marginBottom: 2 }]}>Thank you for choosing MOSH AUTOMATION.</Text>
          <Text>Subject to Coimbatore Jurisdiction.</Text>
        </View>

      </Page>
    </Document>
  );
};

export default SystemEstimatePDF;
