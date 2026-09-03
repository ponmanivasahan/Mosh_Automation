import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  bold: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold'
  },
  mainGrid: {
    borderWidth: 2,
    borderColor: '#000',
    flex: 1,
    flexDirection: 'column'
  },
  titleRow: {
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e5e7eb',
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingBottom: 5,
    paddingTop: 5
  },
  logoContainer: {
    width: '25%',
    paddingLeft: 10,
    justifyContent: 'center'
  },
  logo: {
    width: 100,
    height: 'auto'
  },
  companyDetailsContainer: {
    width: '60%',
    textAlign: 'center',
    justifyContent: 'center',
    paddingRight: 10
  },
  companyTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#000'
  },
  companyAddress: {
    fontSize: 9,
    lineHeight: 1.3
  },
  billToRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  billToLeft: {
    width: '65%',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5,
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  billToRight: {
    width: '35%',
    flexDirection: 'column'
  },
  billToRightTop: {
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#e5e7eb',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5
  },
  billToRightBottom: {
    flexDirection: 'column',
    flex: 1
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    flex: 1
  },
  invoiceInfoRowLast: {
    flexDirection: 'row',
    flex: 1
  },
  invoiceInfoLabel: {
    width: '45%',
    padding: 3,
    borderRightWidth: 1,
    borderColor: '#000'
  },
  invoiceInfoValue: {
    width: '55%',
    padding: 3,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    backgroundColor: '#ffffff'
  },
  colSno: { width: '8%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center' },
  colParticulars: { width: '42%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center' },
  colParticularsData: { width: '42%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'left' },
  colHsn: { width: '12%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center' },
  colQty: { width: '10%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center' },
  colRate: { width: '13%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'center' },
  colRateData: { width: '13%', borderRightWidth: 1, borderColor: '#000', padding: 3, textAlign: 'right' },
  colAmount: { width: '15%', padding: 3, textAlign: 'center' },
  colAmountData: { width: '15%', padding: 3, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row'
  },
  tableBodyContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  emptyFillRow: {
    flex: 1,
    flexDirection: 'row'
  },
  emptyColSno: { width: '8%', borderRightWidth: 1, borderColor: '#000' },
  emptyColParticulars: { width: '42%', borderRightWidth: 1, borderColor: '#000' },
  emptyColHsn: { width: '12%', borderRightWidth: 1, borderColor: '#000' },
  emptyColQty: { width: '10%', borderRightWidth: 1, borderColor: '#000' },
  emptyColRate: { width: '13%', borderRightWidth: 1, borderColor: '#000' },
  emptyColAmount: { width: '15%' },
  summaryRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000'
  },
  bankDetails: {
    width: '65%',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5
  },
  taxDetails: {
    width: '35%',
    flexDirection: 'column'
  },
  taxRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    flex: 1
  },
  taxRowLast: {
    flexDirection: 'row',
    flex: 1
  },
  taxLabel: {
    width: '45%',
    padding: 2,
    paddingLeft: 4,
    borderRightWidth: 1,
    borderColor: '#000'
  },
  taxRate: {
    width: '20%',
    padding: 2,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000'
  },
  taxAmount: {
    width: '35%',
    padding: 2,
    textAlign: 'right',
    paddingRight: 4
  },
  wordsRow: {
    padding: 5,
    borderBottomWidth: 1,
    borderColor: '#000',
    flexDirection: 'column',
    gap: 4
  },
  signatureRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    minHeight: 60
  },
  sigLeft: {
    width: '50%',
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5
  },
  sigRight: {
    width: '50%',
    justifyContent: 'space-between',
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 5
  },
  footerRow: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3
  }
});

const InvoicePDF = ({ invoice }) => {
  const stampUrl = typeof window !== 'undefined' ? `${window.location.origin}/mosh_stamp.png` : '/mosh_stamp.png';
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.mainGrid}>
          {/* Header Row 1 */}
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{invoice?.invoiceType === 'Estimation' ? 'Estimation' : 'Tax Invoice'}</Text>
          </View>

          {/* Header Row 2 */}
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              <Image src="/logo%20background.png" style={styles.logo} />
            </View>
            <View style={styles.companyDetailsContainer}>
              <Text style={styles.companyTitle}>MOSH AUTOMATION</Text>
              <Text style={styles.companyAddress}>
                162 ABC-164, Andal complex, Kamarajar Road, Varadharajapuram,{"\n"}
                Uppilipalayam, Coimbatore - 641015. State :Tamilnadu, Code : 33{"\n"}
                Mobile : 7397103576, 9514714441 E-mail : admin@moshautomation.com{"\n"}
              </Text>
              <Text style={styles.bold}>GSTIN No : 33DLCPP0458M1ZW</Text>
            </View>
          </View>

          {/* Bill To & Invoice Info */}
          <View style={styles.billToRow}>
            <View style={styles.billToLeft}>
              <View>
                <Text><Text style={styles.bold}>To M/s.,   </Text><Text style={styles.bold}>{invoice?.customerName}</Text></Text>
                <Text style={{marginLeft: 45}}>{invoice?.customerAddress}</Text>
              </View>
              <View style={{marginTop: 15}}>
                <Text>Party's GSTIN No :   <Text style={styles.bold}>{invoice?.customerGstin || ''}</Text></Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 2}}>
                  <Text>State Name : {invoice?.customerState || ''}</Text>
                  <Text>Code : {invoice?.customerStateCode || ''}</Text>
                  <Text>Mobile No : {invoice?.customerMobile || ''}</Text>
                </View>
              </View>
            </View>

            <View style={styles.billToRight}>
              <View style={styles.billToRightTop}>
                <Text style={styles.bold}>{invoice?.invoiceType === 'Credit Bill' ? 'CREDIT BILL' : 'CASH /'}</Text>
                {invoice?.invoiceType !== 'Credit Bill' && <Text style={styles.bold}>CREDIT BILL</Text>}
              </View>
              <View style={styles.billToRightBottom}>
                <View style={styles.invoiceInfoRow}>
                  <Text style={styles.invoiceInfoLabel}>Invoice No</Text>
                  <Text style={styles.invoiceInfoValue}>{invoice?.invoiceNumber || 'NEW'}</Text>
                </View>
                <View style={styles.invoiceInfoRowLast}>
                  <Text style={styles.invoiceInfoLabel}>Date</Text>
                  <Text style={styles.invoiceInfoValue}>{invoice?.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-GB').replace(/\//g, '.') : ''}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colSno}>S.No</Text>
            <Text style={styles.colParticulars}>Particulars</Text>
            <Text style={styles.colHsn}>HSN Code</Text>
            <Text style={styles.colQty}>Qty in Nos</Text>
            <Text style={styles.colRate}>Rate / Nos</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>

          {/* Table Body */}
          <View style={styles.tableBodyContainer}>
            {invoice?.items?.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <Text style={styles.colSno}>{index + 1}</Text>
                <Text style={styles.colParticularsData}>{item.productName}</Text>
                <Text style={styles.colHsn}>{item.hsnCode || '-'}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colRateData}>{Number(item.rate).toFixed(1)}</Text>
                <Text style={styles.colAmountData}>{Number(item.amount).toFixed(2)}</Text>
              </View>
            ))}
            {/* Empty space filler with borders */}
            <View style={styles.emptyFillRow}>
              <View style={styles.emptyColSno}></View>
              <View style={styles.emptyColParticulars}></View>
              <View style={styles.emptyColHsn}></View>
              <View style={styles.emptyColQty}></View>
              <View style={styles.emptyColRate}></View>
              <View style={styles.emptyColAmount}></View>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryRow}>
            <View style={styles.bankDetails}>
              <Text style={{...styles.bold, marginBottom: 2}}>Company's Bank Details :</Text>
              <View style={{flexDirection: 'row', marginBottom: 2}}>
                <Text style={{width: 50}}>Bank</Text><Text style={{width: 10}}>:</Text>
                <Text style={styles.bold}>Kotak Mahindra Bank Ltd.,</Text>
              </View>
              <View style={{flexDirection: 'row', marginBottom: 2}}>
                <Text style={{width: 50}}>Branch</Text><Text style={{width: 10}}>:</Text>
                <Text style={styles.bold}>Kamarajar Road , Coimbatore</Text>
              </View>
              <View style={{flexDirection: 'row', marginBottom: 2}}>
                <Text style={{width: 50}}>A/C. No</Text><Text style={{width: 10}}>:</Text>
                <Text style={styles.bold}>5949316113</Text>
              </View>
              <View style={{flexDirection: 'row', marginBottom: 2}}>
                <Text style={{width: 50}}>IFSC</Text><Text style={{width: 10}}>:</Text>
                <Text style={styles.bold}>KKBK0008670</Text>
              </View>
              <Text style={{marginTop: 5}}>E. & O.E</Text>
            </View>
            
            <View style={styles.taxDetails}>
              <View style={styles.taxRow}>
                <Text style={{...styles.taxLabel, fontFamily: 'Helvetica-Bold', width: '65%'}}>Taxable Value</Text>
                <Text style={{...styles.taxAmount, fontFamily: 'Helvetica-Bold'}}>{Number(invoice?.taxableValue || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>SGST   @</Text>
                <Text style={styles.taxRate}>{invoice?.sgstRate || 0}%</Text>
                <Text style={styles.taxAmount}>{Number(invoice?.sgstAmount || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>CGST   @</Text>
                <Text style={styles.taxRate}>{invoice?.cgstRate || 0}%</Text>
                <Text style={styles.taxAmount}>{Number(invoice?.cgstAmount || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>IGST   @</Text>
                <Text style={styles.taxRate}>{invoice?.igstRate > 0 ? invoice.igstRate + '%' : '-'}</Text>
                <Text style={styles.taxAmount}>{Number(invoice?.igstAmount || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={{...styles.taxLabel, width: '65%'}}>Rounded Off</Text>
                <Text style={styles.taxAmount}>{Number(invoice?.roundedOff || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.taxRowLast}>
                <Text style={{...styles.taxLabel, fontFamily: 'Helvetica-Bold', fontSize: 11, width: '65%'}}>Grand Total</Text>
                <Text style={{...styles.taxAmount, fontFamily: 'Helvetica-Bold', fontSize: 11}}>{Number(invoice?.grandTotal || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Words and Declaration */}
          <View style={styles.wordsRow}>
            <Text><Text style={{fontSize: 8}}>Amount Chargeable (In Words) : </Text><Text style={styles.bold}>Rupees      {invoice?.amountInWords}</Text></Text>
            <Text><Text style={{fontSize: 7, textDecoration: 'underline'}}>Declaration</Text><Text style={{fontSize: 7}}> : We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</Text></Text>
          </View>

          {/* Signatures */}
          <View style={styles.signatureRow}>
            <View style={styles.sigLeft}>
              <Text style={styles.bold}>Receiver's Signature</Text>
            </View>
            <View style={styles.sigRight}>
              <Image src={stampUrl} style={{ width: 60, height: 60, alignSelf: 'flex-end' }} />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.bold}>Subject to Coimbatore Jurisdiction</Text>
          </View>

        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
