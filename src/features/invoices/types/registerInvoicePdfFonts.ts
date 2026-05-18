import { Font } from "@react-pdf/renderer";

export const INVOICE_PDF_FONT_FAMILY = "OpenSansInvoicePdf";

let invoicePdfFontsRegistered = false;

export default function registerInvoicePdfFonts(): void {
  if (invoicePdfFontsRegistered) {
    return;
  }

  invoicePdfFontsRegistered = true;

  Font.register({
    family: INVOICE_PDF_FONT_FAMILY,
    fonts: [
      {
        src: "/fonts/invoice-pdf/open-sans-vietnamese-400-normal.woff",
        fontWeight: 400,
      },
      {
        src: "/fonts/invoice-pdf/open-sans-latin-ext-400-normal.woff",
        fontWeight: 400,
      },
      {
        src: "/fonts/invoice-pdf/open-sans-vietnamese-700-normal.woff",
        fontWeight: 700,
      },
      {
        src: "/fonts/invoice-pdf/open-sans-latin-ext-700-normal.woff",
        fontWeight: 700,
      },
    ],
  });
}