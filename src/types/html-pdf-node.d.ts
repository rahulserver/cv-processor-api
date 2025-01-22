declare module 'html-pdf-node' {
  interface Options {
    format?: 'A4' | 'Letter';
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
    printBackground?: boolean;
  }

  interface File {
    content: string;
    name?: string;
  }

  export function generatePdf(file: File, options: Options): Promise<Buffer>;
}
