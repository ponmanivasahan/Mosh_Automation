export const openPdfBase64 = (base64Url, fallbackName = 'Document.pdf') => {
  if (!base64Url) return;

  if (base64Url.startsWith('http')) {
    window.open(base64Url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const parts = base64Url.split(';base64,');
    const contentType = (parts[0] && parts[0].split(':')[1]) || 'application/pdf';
    const raw = window.atob(parts[1] || '');
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    const blob = new Blob([uInt8Array], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (err) {
    console.error('Failed to open PDF blob', err);
    window.open(base64Url, '_blank');
  }
};

export const downloadPdf = (urlOrBase64, filename = 'Estimation.pdf') => {
  if (!urlOrBase64) return;

  if (urlOrBase64.startsWith('data:')) {
    try {
      const parts = urlOrBase64.split(';base64,');
      const contentType = (parts[0] && parts[0].split(':')[1]) || 'application/pdf';
      const raw = window.atob(parts[1] || '');
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    } catch (err) {
      console.error('Download PDF blob error:', err);
    }
  }

  const a = document.createElement('a');
  a.href = urlOrBase64;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
