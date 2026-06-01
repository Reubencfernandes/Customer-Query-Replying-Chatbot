declare module 'pdf-parse' {
  interface PDFData {
    /** Number of pages */
    numpages: number;
    /** Number of rendered pages */
    numrender: number;
    /** PDF info */
    info: Record<string, unknown>;
    /** PDF metadata */
    metadata: unknown;
    /** PDF.js version */
    version: string;
    /** All text content concatenated */
    text: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PDFData>;
  export = pdfParse;
}
