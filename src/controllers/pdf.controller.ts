import { Request, Response } from 'express';
import { generatePDFDocument } from '../services/pdf/generator';

export const generatePDF = async (req: Request, res: Response) => {
  try {
    const cvData = req.body;
    const pdfBuffer = await generatePDFDocument(cvData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${cvData.firstName || 'untitled'}-cv.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
};