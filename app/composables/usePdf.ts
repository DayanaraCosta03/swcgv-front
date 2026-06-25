import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DOCUMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type Sale,
} from "~/types/sale";

const soles = (value: string | number) => `S/ ${Number(value).toFixed(2)}`;

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

/**
 * Generación de PDFs con jsPDF (comprobantes y reportes). Es un composable para
 * que se auto-importe en componentes Nuxt; no mantiene estado.
 */
export function usePdf() {
  /** Comprobante (boleta / factura / ticket) descargable como PDF. */
  function generateReceiptPdf(sale: Sale) {
    const isTicket = sale.documentType === "TICKET";

    // Ticket angosto (~80mm) o A4 para boleta/factura.
    const doc = isTicket
      ? new jsPDF({ unit: "mm", format: [80, 200] })
      : new jsPDF({ unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = isTicket ? 6 : 14;
    let y = 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(isTicket ? 12 : 16);
    doc.text("VIVERO LA HUERTA", pageWidth / 2, y, { align: "center" });

    y += isTicket ? 5 : 7;
    doc.setFontSize(isTicket ? 9 : 11);
    doc.text(
      DOCUMENT_TYPE_LABELS[sale.documentType].toUpperCase(),
      pageWidth / 2,
      y,
      { align: "center" },
    );

    y += isTicket ? 4 : 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(isTicket ? 8 : 10);
    doc.text(`N° ${String(sale.id).padStart(6, "0")}`, pageWidth / 2, y, {
      align: "center",
    });

    y += isTicket ? 6 : 10;
    doc.setFontSize(isTicket ? 8 : 10);
    doc.text(`Fecha: ${formatDate(sale.saleDate)}`, marginX, y);
    y += isTicket ? 4 : 6;
    doc.text(`Cliente: ${sale.client?.name ?? "Cliente varios"}`, marginX, y);
    if (sale.client?.dni) {
      y += isTicket ? 4 : 6;
      doc.text(`DNI/RUC: ${sale.client.dni}`, marginX, y);
    }
    if (sale.client?.address) {
      y += isTicket ? 4 : 6;
      doc.text(`Dirección: ${sale.client.address}`, marginX, y);
    }
    y += isTicket ? 4 : 6;
    doc.text(
      `Método de pago: ${PAYMENT_METHOD_LABELS[sale.paymentMethod]}`,
      marginX,
      y,
    );

    const body = (sale.saleItems ?? []).map((item) => [
      item.product?.name ?? "Producto",
      String(item.quantity),
      soles(item.unitPrice),
      soles(item.totalPrice),
    ]);

    autoTable(doc, {
      startY: y + 3,
      head: [["Producto", "Cant.", "P. Unit.", "Subtotal"]],
      body,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: isTicket ? 7 : 9, cellPadding: isTicket ? 1 : 2 },
      headStyles: { fillColor: [39, 64, 37] },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    // @ts-expect-error lastAutoTable lo agrega el plugin en runtime.
    const finalY = (doc.lastAutoTable?.finalY ?? y + 20) as number;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(isTicket ? 10 : 13);
    doc.text(
      `TOTAL: ${soles(sale.totalAmount)}`,
      pageWidth - marginX,
      finalY + 8,
      { align: "right" },
    );

    if (!isTicket) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("¡Gracias por su compra!", pageWidth / 2, finalY + 20, {
        align: "center",
      });
    }

    doc.save(`comprobante-${sale.documentType.toLowerCase()}-${sale.id}.pdf`);
  }

  /** Reporte tabular genérico a PDF (para el módulo de Reportes). */
  function exportTablePdf(
    title: string,
    head: string[],
    rows: (string | number)[][],
    filename: string,
  ) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("VIVERO LA HUERTA", 14, 16);
    doc.setFontSize(12);
    doc.text(title, 14, 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generado: ${formatDate(new Date())}`, 14, 30);

    autoTable(doc, {
      startY: 34,
      head: [head],
      body: rows.map((r) => r.map((c) => String(c))),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [39, 64, 37] },
    });

    doc.save(filename);
  }

  return { generateReceiptPdf, exportTablePdf };
}
