import { Request, Response } from 'express';
import { ParsedCV } from '../../types/types';
import { createElement } from 'react';
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

export const runtime = 'nodejs';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
    color: '#333',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    borderBottom: '2px solid #333',
    paddingBottom: 5,
  },
  heading: {
    fontSize: 18,
    color: '#444',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginVertical: 8,
  },
  experienceItem: {
    marginBottom: 15,
  },
  educationItem: {
    marginBottom: 12,
  },
  list: {
    paddingLeft: 20,
    marginVertical: 10,
  },
  listItem: {
    fontSize: 12,
    marginBottom: 5,
  },
  strong: {
    fontFamily: 'Helvetica-Bold',
  },
  recruiterDetails: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #ddd',
    whiteSpace: 'pre-wrap',
  },
});

export async function generatePDF(req: Request, res: Response) {
  try {
    const data: ParsedCV = req.body;

    const MyDocument = createElement(
      Document,
      {},
      createElement(
        Page,
        { style: styles.page },
        // Name (h1)
        createElement(Text, { style: styles.title }, data.firstName),

        // Summary (h2 + p)
        createElement(Text, { style: styles.heading }, 'Summary'),
        createElement(Text, { style: styles.text }, data.objective),

        // Skills
        data.skills &&
          Object.keys(data.skills).length > 0 &&
          createElement(
            View,
            null,
            createElement(Text, { style: styles.heading }, 'Skills'),
            createElement(
              View,
              { style: styles.list },
              ...Object.entries(data.skills).map(([category, skills]) =>
                createElement(
                  Text,
                  { style: styles.listItem },
                  createElement(
                    Text,
                    { style: styles.strong },
                    `${category}: `,
                  ),
                  skills,
                ),
              ),
            ),
          ),

        // Experience
        data.experience &&
          data.experience.length > 0 &&
          createElement(
            View,
            null,
            createElement(Text, { style: styles.heading }, 'Experience'),
            ...data.experience.map((exp) =>
              createElement(
                View,
                { style: styles.experienceItem },
                createElement(
                  Text,
                  { style: styles.text },
                  createElement(
                    Text,
                    { style: styles.strong },
                    `${exp.position}`,
                  ),
                ),
                createElement(
                  Text,
                  { style: styles.text },
                  `${exp.company} | ${exp.period}`,
                ),
                exp.responsibilities &&
                  createElement(
                    View,
                    { style: styles.list },
                    ...exp.responsibilities.map((resp) =>
                      createElement(
                        Text,
                        { style: styles.listItem },
                        `• ${resp}`,
                      ),
                    ),
                  ),
              ),
            ),
          ),

        // Education
        data.education &&
          data.education.length > 0 &&
          createElement(
            View,
            null,
            createElement(Text, { style: styles.heading }, 'Education'),
            ...data.education.map((edu) =>
              createElement(
                View,
                { style: styles.educationItem },
                createElement(
                  Text,
                  { style: styles.text },
                  createElement(
                    Text,
                    { style: styles.strong },
                    `${edu.qualification}`,
                  ),
                ),
                createElement(
                  Text,
                  { style: styles.text },
                  `${edu.institution} - ${edu.completionDate}`,
                ),
              ),
            ),
          ),

        // Recruiter Details
        data.recruiterDetails &&
          createElement(
            View,
            { style: styles.recruiterDetails },
            createElement(Text, { style: styles.heading }, 'Recruiter Details'),
            createElement(Text, { style: styles.text }, data.recruiterDetails),
          ),
      ),
    );

    const pdfDoc = await pdf(MyDocument);
    const pdfBytes = await pdfDoc.toBlob();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${
        data.firstName || 'untitled'
      }-cv.pdf`,
    });

    // Convert Blob to Buffer and send
    const buffer = Buffer.from(await pdfBytes.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({
      error: `Failed to generate PDF: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    });
  }
}

function generateHTML(cv: ParsedCV): string {
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
            margin-top: 30px;
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
