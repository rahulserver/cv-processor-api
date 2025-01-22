import PDFParser from 'pdf-parse';
import { ParsedCV } from '../../types/types';
import { processCVWithAI } from '../agents/cv-processor';

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  const data = await PDFParser(pdfBuffer, {
    preserveFormattingNewlines: true,
  });
  
  return data.text;
}

export async function parseCV(text: string, onProgress?: (message: string, percentage: number) => void): Promise<ParsedCV> {
  if (!text || text.trim() === '') {
    throw new Error('Text is required');
  }
  return processCVWithAI(text, onProgress);
}
