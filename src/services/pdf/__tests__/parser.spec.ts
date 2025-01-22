/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { extractTextFromPDF, parseCV } from '../parser';
import { ParsedCV } from '../types';

describe('CV Parser', () => {
  let samplePDFBuffer: Buffer;
  let extractedText: string;

  // Set timeout for all tests in this file
  jest.setTimeout(60000);

  beforeAll(async () => {
    const pdfPath = path.join(__dirname, 'resources', 'sample-cv.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Test PDF file not found at ${pdfPath}`);
    }
    samplePDFBuffer = fs.readFileSync(pdfPath);
    extractedText = await extractTextFromPDF(samplePDFBuffer);
  }, 15000);

  describe('PDF Text Extraction', () => {
    it('should extract text from a valid PDF buffer', async () => {
      const text = await extractTextFromPDF(samplePDFBuffer);
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should preserve newlines in extracted text', async () => {
      const text = await extractTextFromPDF(samplePDFBuffer);
      expect(text).toMatch(/\n/);
    });

    it('should reject invalid PDF buffer', async () => {
      const invalidBuffer = Buffer.from('not a pdf');
      await expect(extractTextFromPDF(invalidBuffer)).rejects.toThrow();
    });

    it('should reject empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      await expect(extractTextFromPDF(emptyBuffer)).rejects.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should reject null text input', async () => {
      // @ts-expect-error - Testing invalid input
      await expect(parseCV(null)).rejects.toThrow('Text is required');
    });

    it('should reject undefined text input', async () => {
      // @ts-expect-error - Testing invalid input
      await expect(parseCV(undefined)).rejects.toThrow('Text is required');
    });

    it('should reject empty text input', async () => {
      await expect(parseCV('')).rejects.toThrow('Text is required');
    });

    it('should reject whitespace-only text input', async () => {
      await expect(parseCV('   \n   \t   ')).rejects.toThrow('Text is required');
    });
  });

  describe('AI-powered CV parsing', () => {
    let parsedCV: ParsedCV;

    beforeAll(async () => {
      parsedCV = await parseCV(extractedText);
    });

    it('should extract career objective using AI', () => {
      expect(parsedCV.objective).toBeTruthy();
      expect(typeof parsedCV.objective).toBe('string');
      // We can't expect exact text matches since AI responses may vary
      expect(parsedCV.objective.toLowerCase()).toContain('electrical engineer');
    });

    it('should extract skills as an object', () => {
      expect(parsedCV.skills).toBeInstanceOf(Object);
      expect(Object.keys(parsedCV.skills).length).toBeGreaterThan(0);
      // Check for some expected skill categories but don't require exact matches
      const allSkills = Object.values(parsedCV.skills).flat();
      expect(
        allSkills.some(skill => 
          skill.toLowerCase().includes('tools') ||
          skill.toLowerCase().includes('electrical') ||
          skill.toLowerCase().includes('maintenance')
        )
      ).toBe(true);
    });

    it('should extract work experience with required fields', () => {
      expect(Array.isArray(parsedCV.experience)).toBe(true);
      expect(parsedCV.experience.length).toBeGreaterThan(0);
      
      const firstJob = parsedCV.experience[0];
      expect(firstJob).toHaveProperty('company');
      expect(firstJob).toHaveProperty('position');
      expect(firstJob).toHaveProperty('period');
      expect(firstJob).toHaveProperty('responsibilities');
      expect(Array.isArray(firstJob.responsibilities)).toBe(true);
    });

    it('should handle empty input gracefully', async () => {
      await expect(parseCV('')).rejects.toThrow();
    });
  });
});