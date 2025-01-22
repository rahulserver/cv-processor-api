import { Request, Response } from 'express';
import { ParsedCV } from '../../types/types';
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import puppeteer from 'puppeteer';


export function generateHTML(cv: ParsedCV): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 20px;
          }
          h1, h2 { 
            color: #333;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          h1 {
            font-size: 24px;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
          }
          h2 {
            font-size: 18px;
            color: #444;
          }
          ul { 
            padding-left: 20px;
            margin: 10px 0;
          }
          p {
            margin: 8px 0;
          }
          .experience-item {
            margin-bottom: 15px;
          }
          .education-item {
            margin-bottom: 12px;
          }
          hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 20px 0;
          }
          .recruiter-details {
            margin-top: 10px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <h1>${cv.firstName}</h1>
        
        <h2>Summary</h2>
        <p>${cv.objective}</p>
        
        ${
          cv.skills && Object.keys(cv.skills).length > 0
            ? `
          <h2>Skills</h2>
          <ul>
            ${Object.entries(cv.skills)
              .map(
                ([category, skills]) => `
              <li><strong>${category}:</strong> ${skills}</li>
            `,
              )
              .join('')}
          </ul>
        `
            : ''
        }
        
        ${
          cv.experience && cv.experience.length > 0
            ? `
          <h2>Experience</h2>
          ${cv.experience
            .map(
              (exp) => `
            <div class="experience-item">
              <p><strong>${exp.position}</strong></p>
              <p>${exp.company} | ${exp.period}</p>
              ${
                exp.responsibilities && exp.responsibilities.length > 0
                  ? `
                <ul>
                  ${exp.responsibilities
                    .map(
                      (resp) => `
                    <li>${resp}</li>
                  `,
                    )
                    .join('')}
                </ul>
              `
                  : ''
              }
            </div>
          `,
            )
            .join('')}
        `
            : ''
        }
        
        ${
          cv.education && cv.education.length > 0
            ? `
          <h2>Education</h2>
          ${cv.education
            .map(
              (edu) => `
            <div class="education-item">
              <p><strong>${edu.qualification}</strong></p>
              <p>${edu.institution} - ${edu.completionDate}</p>
            </div>
          `,
            )
            .join('')}
        `
            : ''
        }

        ${
          cv.recruiterDetails
            ? `
          <div class="recruiter-details">
            <h2>Recruiter Details</h2>
            <p>${cv.recruiterDetails.replace(/\n/g, '<br/>')}</p>
          </div>
        `
            : ''
        }
      </body>
    </html>
  `;
}

export async function generatePDFDocument(data: ParsedCV): Promise<Buffer> {
  const html = generateHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      printBackground: true
    });
    
    return Buffer.from(pdf);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    await browser.close();
  }
}
