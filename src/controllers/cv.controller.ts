import { Request, Response } from 'express';
import { parseCV, extractTextFromPDF } from '../services/pdf/parser';
import { promises as fs } from 'fs';
import path from 'path';

export const processCV = async (req: Request, res: Response) => {
  try {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (message: string, percentage: number) => {
      res.write(`data: ${JSON.stringify({ message, percentage })}\n\n`);
    };

    sendProgress('Starting CV processing...', 10);

    let text: string;
    const useSample = req.body.useSample;

    if (useSample) {
      sendProgress('Loading sample CV...', 20);
      const samplePath = path.join(
        process.cwd(),
        'public/resources',
        'sample-cv.pdf'
      );
      const buffer = await fs.readFile(samplePath);
      text = await extractTextFromPDF(buffer);
    } else {
      sendProgress('Reading uploaded CV...', 20);
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      text = await extractTextFromPDF(file.buffer);
    }

    sendProgress('Extracting text from PDF...', 40);
    sendProgress('Analyzing CV content...', 60);
    
    // Process the CV
    const result = await parseCV(text, sendProgress);
    
    sendProgress('Finalizing results...', 90);

    // Send final result
    res.write(`data: ${JSON.stringify({ success: true, data: result, done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error processing CV:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to process CV', done: true })}\n\n`);
    res.end();
  }
};