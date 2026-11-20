

document.addEventListener('DOMContentLoaded', () => {
    const pdfButton = document.querySelector('.btn-pdf');
    const report = document.querySelector('.stats-section');
  
    if (!pdfButton || !report) {
      return;
    }
  
    const BG_COLOR = '#1C2A0B';
    const SHEET_PADDING = 24;
  

    function createMeta() {
      const name = document.querySelector('.hello strong');
      const date = new Date().toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
  
      const meta = document.createElement('p');
      meta.className = 'pdf-meta';
      meta.textContent = 'Мешканець: ' + (name ? name.textContent.trim() : '—') + ' · ' + date;
      return meta;
    }
  

    function createFileName() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return 'GRAND-HOME-statystyka-' + now.getFullYear() + '-' + month + '-' + day + '.pdf';
    }
  

    function savePdf(dataUrl, width, height) {
      const pdf = new window.jspdf.jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'px',
        format: [width + SHEET_PADDING * 2, height + SHEET_PADDING * 2],
        compress: true
      });
  

      pdf.setFillColor(BG_COLOR);
      pdf.rect(0, 0, width + SHEET_PADDING * 2, height + SHEET_PADDING * 2, 'F');
  
      pdf.addImage(dataUrl, 'PNG', SHEET_PADDING, SHEET_PADDING, width, height);
      pdf.save(createFileName());
    }
  
    pdfButton.addEventListener('click', (event) => {
      event.preventDefault();
  

      if (!window.htmlToImage || !window.jspdf) {
        window.print();
        return;
      }
  
      if (pdfButton.classList.contains('is-loading')) {
        return;
      }
  
      const label = pdfButton.textContent;
      pdfButton.classList.add('is-loading');
      pdfButton.textContent = 'Готуємо PDF…';
  

      const meta = createMeta();
      report.appendChild(meta);
      document.body.classList.add('pdf-exporting');
  

      setTimeout(() => {
        const width = report.offsetWidth;
        const height = report.offsetHeight;
  
        window.htmlToImage.toPng(report, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: BG_COLOR,

          style: { margin: '0' }
        })
          .then((dataUrl) => savePdf(dataUrl, width, height))
          .catch((error) => {
            console.error('PDF error:', error);
            window.print();
          })
          .then(() => {

            meta.remove();
            document.body.classList.remove('pdf-exporting');
            pdfButton.classList.remove('is-loading');
            pdfButton.textContent = label;
          });
      }, 150);
    });
  });
