/**
 * Pure Node.js Standard PDF 1.4 Generator
 * Generates official MOSH Automation Quotation & Estimation PDF documents
 * without third-party binary dependencies.
 */

function escapePdf(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function generateEstimationPdfBuffer(data = {}) {
  const {
    inquiryId = 'EST-' + Date.now().toString().slice(-6),
    productName = 'MOSH Automated Water Level Controller System',
    requirement = 'Automated dual-tank switching, wireless telemetry and motor dry-run protection.',
    adminResponse = 'Official estimation and technical specification verified by MOSH Automation Engineering.',
    total = 3200,
    filename = 'Estimation.pdf'
  } = data;

  const content = [];

  // Top header accent line (MOSH Brand Blue)
  content.push('0.06 0.48 0.95 rg');
  content.push('50 780 512 4 re f');

  // Company Branding Header
  content.push('BT');
  content.push('/F1 22 Tf');
  content.push('0.06 0.09 0.16 rg');
  content.push('50 745 Td');
  content.push('(MOSH AUTOMATION) Tj');
  content.push('ET');

  content.push('BT');
  content.push('/F2 10 Tf');
  content.push('0.39 0.45 0.55 rg');
  content.push('50 730 Td');
  content.push('(Intelligent Water Management & IoT Control Systems) Tj');
  content.push('ET');

  // Document Title Box
  content.push('0.95 0.97 1.0 rg');
  content.push('50 670 512 42 re f');
  content.push('0.8 0.88 0.98 RG');
  content.push('1 w 50 670 512 42 re S');

  content.push('BT');
  content.push('/F1 13 Tf');
  content.push('0.06 0.48 0.95 rg');
  content.push('65 692 Td');
  content.push('(OFFICIAL ESTIMATION & QUOTATION SPECIFICATION) Tj');
  content.push('ET');

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  content.push('BT');
  content.push('/F2 9 Tf');
  content.push('0.2 0.25 0.35 rg');
  content.push('65 678 Td');
  content.push('(Inquiry Ref: ' + escapePdf(inquiryId) + '  |  Issue Date: ' + escapePdf(today) + ') Tj');
  content.push('ET');

  // Fields Table
  let curY = 635;
  const addField = (label, val, boldVal = false) => {
    content.push('BT');
    content.push('/F1 10 Tf');
    content.push('0.2 0.25 0.35 rg');
    content.push('50 ' + curY + ' Td');
    content.push('(' + escapePdf(label) + ') Tj');
    content.push('ET');

    curY -= 16;
    content.push('BT');
    content.push((boldVal ? '/F1 11 Tf' : '/F2 10 Tf'));
    content.push('0.06 0.09 0.16 rg');
    content.push('50 ' + curY + ' Td');
    content.push('(' + escapePdf(val) + ') Tj');
    content.push('ET');

    curY -= 28;
  };

  addField('SYSTEM / PRODUCT MODEL:', productName, true);
  addField('CUSTOMER REQUIREMENT / SPECIFICATION:', requirement);
  addField('OFFICIAL ESTIMATE & PRICING:', 'Rs. ' + Number(total).toLocaleString('en-IN') + ' (Inclusive of Taxes & Warranty)', true);
  addField('ENGINEERING RESPONSE & VERIFICATION:', adminResponse);

  // Footer Authentication Stamp Box
  content.push('0.96 0.97 0.98 rg');
  content.push('50 90 512 65 re f');
  content.push('0.88 0.91 0.94 RG');
  content.push('1 w 50 90 512 65 re S');

  content.push('BT');
  content.push('/F1 9.5 Tf');
  content.push('0.1 0.15 0.2 rg');
  content.push('65 132 Td');
  content.push('(MOSH Automation Engineering Division - Certified Official Document) Tj');
  content.push('ET');

  content.push('BT');
  content.push('/F2 8.5 Tf');
  content.push('0.35 0.4 0.48 rg');
  content.push('65 116 Td');
  content.push('(Support & Installation Hotline: +91 95147 14441  |  Email: support@moshautomation.com) Tj');
  content.push('0 -13 Td');
  content.push('(Official Web Portal: https://moshautomation.com) Tj');
  content.push('ET');

  const stream = content.join('\n');
  const streamLen = Buffer.byteLength(stream);

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj');
  objects.push('4 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + stream + '\nendstream\nendobj');
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  let pdf = '%PDF-1.4\n';
  const xref = [0];
  for (let i = 0; i < objects.length; i++) {
    xref.push(Buffer.byteLength(pdf));
    pdf += objects[i] + '\n';
  }
  const startxref = Buffer.byteLength(pdf);
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n';
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(xref[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF';
  return Buffer.from(pdf);
}

module.exports = {
  generateEstimationPdfBuffer
};
