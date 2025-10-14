
import { jsPDF } from "jspdf";
import { Invoice } from "@/types";
import { numberToWords } from "@/lib/utils";
import orangeEnergyHeader from "@/assets/invoice-header.png";
import tradigazHeader from "@/assets/tradigaz-header.png";
import arganaHeader from "@/assets/argana-header.png";

export class InvoicePDF {
  static async generate(invoice: Invoice): Promise<jsPDF> {
    const doc = new jsPDF();
    await this.generateInPDF(invoice, doc);
    return doc;
  }

  private static formatInvoiceNumberForDisplay(invoice: Invoice): string {
    // Extract the number part from the original invoice number
    const parts = invoice.number.split('/');
    if (parts.length !== 3) {
      return invoice.number; // Fallback to original if format is unexpected
    }
    
    const invoiceNum = parts[2];
    
    // Parse the date to determine the format
    const dateParts = invoice.date.split('/');
    
    // Check if date is in MM/YYYY format (monthly distribution with hidden day)
    if (dateParts.length === 2) {
      // Monthly format: FA + YYMM + N°Facture
      const month = dateParts[0].padStart(2, '0');
      const year = dateParts[1].slice(-2); // Get last 2 digits of year
      return `FA${year}${month}${invoiceNum}`;
    } else if (dateParts.length === 3) {
      // Daily format: FA + YYMMDD + N°Facture
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      const year = dateParts[2].slice(-2); // Get last 2 digits of year
      return `FA${year}${month}${day}${invoiceNum}`;
    }
    
    // Fallback to original format if date parsing fails
    return invoice.number;
  }

  static async generateInPDF(invoice: Invoice, doc: jsPDF): Promise<void> {
    // Document setup with white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
    
    doc.setFontSize(10);
    doc.setLineWidth(0.2);
    
    // Add header with orange band
    await this.addLogoAndHeader(doc, invoice);
    
    // Add FACTURE title
    this.addInvoiceDetails(doc, invoice);
    
    // Add client and invoice info
    this.addClientInfo(doc, invoice);
    
    // Add invoice table
    this.addInvoiceTable(doc, invoice);
    
    // Add totals
    this.addTotals(doc, invoice);
    
    // Add footer
    this.addFooter(doc, invoice);
    
    return;
  }

  private static async addLogoAndHeader(doc: jsPDF, invoice: Invoice): Promise<void> {
    // Add header image at the top
    const imgWidth = 200; // Full width of the page (minus margins)
    const imgHeight = 20; // Height of the header image
    
    // Select header based on company name
    let headerImage = orangeEnergyHeader;
    if (invoice.companyName === 'TRADIGAZ') {
      headerImage = tradigazHeader;
    } else if (invoice.companyName === 'ARGANA ENERGY') {
      headerImage = arganaHeader;
    }
    
    // Load and add the header image
    doc.addImage(headerImage, 'PNG', 5, 5, imgWidth, imgHeight);
  }

  private static addInvoiceDetails(doc: jsPDF, invoice: Invoice): void {
    // FACTURE title centered
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', 105, 35, { align: 'center' });
  }

  private static addClientInfo(doc: jsPDF, invoice: Invoice): void {
    const startY = 45;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    const formattedInvoiceNumber = this.formatInvoiceNumberForDisplay(invoice);
    
    // Left side - Invoice details
    doc.text(`Facture N°: ${formattedInvoiceNumber}`, 15, startY);
    doc.text(`Date: ${invoice.date}`, 15, startY + 6);
    doc.text(`Client: ${invoice.client.name}`, 15, startY + 12);
    
    // Build ICE/PATENTE line
    const identifiers: string[] = [];
    if (invoice.client.code && invoice.client.code.trim() !== '') {
      identifiers.push(invoice.client.code);
    }
    if (invoice.client.ice && invoice.client.ice.trim() !== '') {
      identifiers.push(invoice.client.ice);
    }
    
    if (identifiers.length > 0) {
      doc.text(`ICE/PATENTE: ${identifiers.join(' / ')}`, 15, startY + 18);
    }
  }

  private static addInvoiceTable(doc: jsPDF, invoice: Invoice): void {
    const startY = 80;
    const headers = ['Désignation', 'Quantité', 'Prix Unitaire', 'Total'];
    const columnWidths = [90, 30, 35, 35];
    
    let currentX = 15;
    let currentY = startY;
    
    // Header background color based on company
    if (invoice.companyName === 'TRADIGAZ') {
      doc.setFillColor(41, 128, 185); // Blue for TRADIGAZ
    } else if (invoice.companyName === 'ARGANA ENERGY') {
      doc.setFillColor(106, 130, 62); // Green for ARGANA ENERGY
    } else {
      doc.setFillColor(255, 102, 0); // Orange for ORANGE ENERGY
    }
    doc.rect(15, currentY, 185, 8, 'F');
    
    // White header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    
    headers.forEach((header, i) => {
      const alignment = i > 0 ? 'center' : 'left';
      const x = i > 0 ? currentX + columnWidths[i] / 2 : currentX + 4;
      doc.text(header, x, currentY + 5.5, { align: alignment });
      currentX += columnWidths[i];
    });
    
    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    currentY += 8;
    
    invoice.items.forEach((item) => {
      const rowData = [
        item.description,
        item.quantity.toString(),
        item.unitPrice.toFixed(2),
        item.amount.toFixed(2)
      ];
      
      currentX = 15;
      rowData.forEach((text, i) => {
        const alignment = i === 0 ? 'left' : 'center';
        const x = i === 0 ? currentX + 4 : currentX + columnWidths[i] / 2;
        doc.setFontSize(9);
        doc.text(text, x, currentY + 5.5, { align: alignment });
        currentX += columnWidths[i];
      });
      
      currentY += 8;
    });
    
    // Table border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(15, startY, 185, currentY - startY, 'S');
    
    // Column separators
    currentX = 15;
    headers.forEach((_, i) => {
      if (i < headers.length - 1) {
        currentX += columnWidths[i];
        doc.line(currentX, startY, currentX, currentY);
      }
    });
    
    // Horizontal line after header
    doc.line(15, startY + 8, 200, startY + 8);
  }

  private static addTotals(doc: jsPDF, invoice: Invoice): void {
    const totalsY = 88 + invoice.items.length * 8 + 15;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    doc.text('Total HT:', 15, totalsY);
    doc.text(`${invoice.subtotal.toFixed(2)}`, 60, totalsY);
    
    doc.text('TVA:', 15, totalsY + 7);
    doc.text(`${invoice.taxAmount.toFixed(2)}`, 60, totalsY + 7);
    
    doc.text('Total TTC:', 15, totalsY + 14);
    doc.text(`${invoice.total.toFixed(2)}`, 60, totalsY + 14);
    
    // Amount in words
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Arrêté la présente facture à la somme de:', 15, totalsY + 25);
    
    const amountInWords = this.capitalizeFirstLetter(numberToWords(invoice.total));
    doc.text(`${amountInWords} dirhams`, 15, totalsY + 32);
  }

  private static addFooter(doc: jsPDF, invoice: Invoice): void {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Company info based on invoice company name
    let footerText: string[] = [];
    
    if (invoice.companyName === 'TRADIGAZ') {
      footerText = [
        'AL WIFAQ GROUPE 7 IMM 53 APT 1 AIN SEBAA CASABLANCA',
        'RC N°: 490573 Patente N°: 30352039 CNSS N°: 2435913 ICE: 002717207000003'
      ];
    } else if (invoice.companyName === 'ARGANA ENERGY') {
      footerText = [
        'RESIDENCE AL MACHRIK II – RUE JAAFAR BNOU HABIB – BOURGOGNE – CASABLANCA',
        'RC N° : 634559 | Patente N° : 35607765 | IF N° : 65992905 | CNSS N° : 5583539 | ICE N° : 003531503000031'
      ];
    } else {
      // Default to Orange Energie
      footerText = [
        'RESIDENCE AL MACHRIK II - RUE JAAFAR BNOU HABIB - BOURGOGNE - CASABLANCA',
        'RC N°: 339601 Patente N°: 35697091 IF: 15302869 CNSS N°: 4682995 ICE: 000509809000039'
      ];
    }
    
    doc.text(footerText, 105, pageHeight - 15, { align: 'center', lineHeightFactor: 1.5 });
  }

  private static capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
