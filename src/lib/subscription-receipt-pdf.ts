import { drawBhadaPdfLogo, loadGotuPdfFont } from "@/lib/bhada-pdf-logo";

export type SubscriptionReceiptPdfData = {
  receiptNumber: string;
  paymentId: string;
  subscriptionId: string;
  amountPaise: number;
  currency: string;
  status: string;
  paidAt: string;
  customerName: string;
  customerEmail: string;
  description: string;
};

const INK: [number, number, number] = [18, 18, 16];
const MUTED: [number, number, number] = [83, 83, 78];
const PAPER: [number, number, number] = [247, 247, 243];

export async function downloadSubscriptionReceiptPdf(data: SubscriptionReceiptPdfData) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pdfFont = await loadGotuPdfFont(pdf);
  const amount = `${data.currency} ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(data.amountPaise / 100)}`;
  const paidAt = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(data.paidAt));

  pdf.setFillColor(...PAPER);
  pdf.rect(0, 0, 210, 297, "F");

  // Editorial masthead
  await drawBhadaPdfLogo(pdf, pdfFont);

  pdf.setTextColor(...INK);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(35);
  pdf.text("INVOICE", 185, 39, { align: "right" });

  // Customer and invoice details
  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...INK);
  pdf.text("BILLED TO:", 26, 66);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(9.5);
  pdf.text(data.customerName || "Bhada customer", 26, 74);
  if (data.customerEmail) pdf.text(data.customerEmail, 26, 80, { maxWidth: 78 });

  pdf.setFontSize(10);
  pdf.text(`Invoice No. ${data.receiptNumber}`, 185, 61, { align: "right" });
  pdf.text(paidAt, 185, 68, { align: "right" });
  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text(`Status: ${data.status.toUpperCase()}`, 185, 75, { align: "right" });

  // Item table
  const tableTop = 101;
  const columns = { item: 28, quantity: 124, unitPrice: 154, total: 184 };
  pdf.setDrawColor(...INK);
  pdf.setLineWidth(0.25);
  pdf.line(26, tableTop, 185, tableTop);
  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...INK);
  pdf.text("Item", columns.item, tableTop + 8);
  pdf.text("Quantity", columns.quantity, tableTop + 8, { align: "center" });
  pdf.text("Unit Price", columns.unitPrice, tableTop + 8, { align: "center" });
  pdf.text("Total", columns.total, tableTop + 8, { align: "right" });
  pdf.line(26, tableTop + 13, 185, tableTop + 13);

  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(8.5);
  pdf.text(data.description || "Bhada Portfolio plan — monthly subscription", columns.item, tableTop + 23, {
    maxWidth: 84,
  });
  pdf.text("1", columns.quantity, tableTop + 23, { align: "center" });
  pdf.text(amount, columns.unitPrice, tableTop + 23, { align: "center" });
  pdf.text(amount, columns.total, tableTop + 23, { align: "right" });
  pdf.setDrawColor(98, 98, 93);
  pdf.line(26, tableTop + 29, 185, tableTop + 29);

  // Totals
  const summary = [
    ["Subtotal", amount],
    ["Tax (0%)", `${data.currency} 0.00`],
  ];
  summary.forEach(([label, value], index) => {
    const y = 145 + index * 12;
    pdf.setFont(pdfFont, "bold");
    pdf.setFontSize(8.5);
    pdf.text(label, 142, y);
    pdf.setFont(pdfFont, "normal");
    pdf.text(value, 185, y, { align: "right" });
  });
  pdf.line(138, 165, 185, 165);
  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(13);
  pdf.text("Total Paid", 142, 176);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(...INK);
  pdf.text(amount, 185, 176, { align: "right" });

  // Footer
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(14);
  pdf.text("Thank you for your Business!", 26, 226);

  pdf.setFont(pdfFont, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...INK);
  pdf.text("PAYMENT INFORMATION", 26, 244);
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(8.5);
  pdf.text(`Razorpay payment ID: ${data.paymentId}`, 26, 252);
  if (data.subscriptionId) pdf.text(`Subscription ID: ${data.subscriptionId}`, 26, 258);
  pdf.text("This invoice confirms payment for your Bhada subscription.", 26, data.subscriptionId ? 264 : 258);

  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(19);
  pdf.text("bhada", 185, 253, { align: "right" });
  pdf.setFont(pdfFont, "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text("Property management, simplified", 185, 260, { align: "right" });

  pdf.save(`Invoice-${data.receiptNumber}.pdf`);
}
