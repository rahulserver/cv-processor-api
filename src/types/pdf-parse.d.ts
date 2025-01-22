declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: any;
    metadata: any;
    version: string;
  }

  function PDFParse(dataBuffer: Buffer, options?: { preserveFormattingNewlines?: boolean }): Promise<PDFData>;
  export default PDFParse;
} 