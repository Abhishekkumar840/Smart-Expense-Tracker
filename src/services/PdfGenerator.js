// PDF export helper.
const PDFDocument = require('pdfkit');

class PdfGenerator {
  generateExpenseReportPdf(report) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.#renderHeader(doc, report);
      this.#renderSummary(doc, report);
      this.#renderTransactionTable(doc, report);

      doc.end();
    });
  }

  #renderHeader(doc, report) {
    doc.fontSize(20).text('Smart Expense Tracker', { align: 'center' });
    doc.fontSize(14).text(`Expense Report — ${report.periodLabel}`, { align: 'center' });
    doc.moveDown(1.5);
  }

  #renderSummary(doc, report) {
    doc.fontSize(12);
    doc.text(`Total income: ${report.totalIncome().toFixed(2)}`);
    doc.text(`Total expense: ${report.totalExpense().toFixed(2)}`);
    doc.text(`Net savings: ${report.netSavings().toFixed(2)}`);
    doc.text(`Savings rate: ${report.savingsRatePercent()}%`);
    doc.moveDown(1);
  }

  #renderTransactionTable(doc, report) {
    doc.fontSize(14).text('Transactions', { underline: true });
    doc.moveDown(0.5);

    const rows = report.toTransactionRows();

    doc.fontSize(10);
    for (const row of rows) {
      const formattedDate = new Date(row.date).toLocaleDateString();
      const sign = row.type === 'expense' ? '-' : '+';
      doc.text(`${formattedDate}   ${row.title}   ${sign}${row.amount.toFixed(2)}`);
    }

    if (rows.length === 0) {
      doc.text('No transactions recorded for this period.');
    }
  }
}

module.exports = PdfGenerator;
