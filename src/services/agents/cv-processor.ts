import { OpenAI } from 'openai';
import { config } from '../../config/env';

interface ProcessedCV {
  firstName: string;
  objective: string;
  skills: { [category: string]: string };
  experience: {
    company: string;
    position: string;
    period: string;
    responsibilities: string[];
  }[];
  education: {
    institution: string;
    qualification: string;
    completionDate: string;
  }[];
  formattingNotes: string[];
  piiRemoved?: string[];
}

interface ProgressCallback {
  (message: string, percentage: number): void;
}

// Strategy Analysis Agent - Exact same logic, just organized into a function
async function runStrategyAgent(openai: OpenAI, cvText: string) {
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an intelligent CV analyzer. Evaluate the CV and determine the optimal processing strategy.
          Return a JSON object describing what aspects need focus and in what order.`,
      },
      {
        role: 'user',
        content: `Analyze this CV and return a JSON object containing:
          {
            "contentQuality": "high|medium|low",
            "primaryFocus": ["List of areas needing most attention"],
            "processingPriorities": ["Ordered list of processing steps needed"],
            "potentialChallenges": ["Anticipated processing challenges"]
          }

          CV Content:
          ${cvText}`,
      },
    ],
    response_format: { type: 'json_object' },
  });
}

// Main Processing Agent - Exact same logic, just organized into a function
async function runProcessingAgent(openai: OpenAI, cvText: string) {
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an intelligent CV processing agent. Your primary task is to ONLY process and format existing information, never invent new details.

          STRICT RULES:
          1. NEVER add education unless explicitly stated in the CV
          2. NEVER create certifications unless explicitly listed
          3. NEVER add references
          4. NEVER add percentages or specific metrics unless they appear in the source
          5. NEVER embellish or enhance responsibilities with metrics
          6. Track ALL removed PII in piiRemoved array, including:
             - Last names
             - Full names of references
             - Phone numbers
             - Email addresses
             - Physical addresses
             - Any other identifying information except first name

          SKILLS FORMATTING:
          1. Group similar skills under appropriate categories
          2. Return skills as an object where:
             - Keys are category names (derived from the skills present)
             - Values are comma-separated strings of related skills
          3. DO NOT create categories that don't match the skills present
          4. DO NOT invent or add skills not present in the source

          Return the processed CV in this exact format:
          {
            "firstName": "string",
            "objective": "string",
            "skills": {
              "category1": "comma separated skills",
              "category2": "comma separated skills"
            },
            "experience": [{
              "company": "string",
              "position": "string",
              "period": "string",
              "responsibilities": ["string"]
            }],
            "education": [{
              "institution": "string",
              "qualification": "string",
              "completionDate": "string"
            }],
            "formattingNotes": ["string"],
            "piiRemoved": ["string"]
          }`,
      },
      {
        role: 'user',
        content: `Process this CV and return a JSON object following the specified format:

          CV Content:
          ${cvText}`,
      },
    ],
    response_format: { type: 'json_object' },
  });
}

// Enhancement Agent - Exact same logic, just organized into a function
async function runEnhancementAgent(openai: OpenAI, result: any) {
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a CV enhancement specialist. Your task is to improve the organization and presentation of the CV while maintaining factual accuracy.

            STRICT RULES:
            1. NEVER add information that isn't in the source CV
            2. NEVER create metrics or percentages that aren't in the source
            3. NEVER fabricate any details
            
            SKILLS ORGANIZATION:
            1. Analyze the skills list and identify 4-6 natural groupings based on the actual skills present
            2. Create appropriate category names based on the skills' nature
            3. Group related skills together under each category
            4. Format each category as "Category: skill1, skill2, etc."`,
      },
      {
        role: 'user',
        content: `Enhance this CV by organizing the skills into natural groupings while maintaining all other sections as they are.
            
            Current CV:
            ${JSON.stringify(result)}
            
            Return an improved version in the same JSON format, with skills grouped but not fabricated.`,
      },
    ],
    response_format: { type: 'json_object' },
  });
}

export async function processCVWithAI(
  cvText: string,
  onProgress?: ProgressCallback,
): Promise<ProcessedCV> {
  const updateProgress = (message: string, percentage: number) => {
    console.log(`Progress: ${percentage}% - ${message}`);
    onProgress?.(message, percentage);
  };

  if (!cvText || !cvText.trim()) {
    throw new Error('Text is required');
  }

  updateProgress('Initializing AI CV Analysis Agent...', 5);
  const startTime = Date.now();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Strategy Analysis Phase
    updateProgress(
      'AI Strategy Agent: Analyzing CV structure and determining optimal processing approach...',
      15,
    );
    updateProgress(
      'AI Strategy Agent: Evaluating content quality and identifying key areas for focus...',
      20,
    );
    const strategyStartTime = Date.now();
    const strategy = await runStrategyAgent(openai, cvText);
    console.log(
      `Strategy analysis completed in ${
        (Date.now() - strategyStartTime) / 1000
      }s`,
    );

    const strategyResult = JSON.parse(
      strategy.choices[0].message.content || '{}',
    );
    updateProgress(
      `AI Strategy Agent: Analysis complete - Detected ${strategyResult.contentQuality} quality content`,
      25,
    );
    updateProgress(
      `AI Strategy Agent: Identified key focus areas: ${strategyResult.primaryFocus.join(
        ', ',
      )}`,
      30,
    );
    updateProgress(
      `AI Strategy Agent: Processing priorities set: ${strategyResult.processingPriorities.join(
        ' → ',
      )}`,
      35,
    );

    // Main Processing Phase
    updateProgress(
      'AI Processing Agent: Beginning structured information extraction...',
      40,
    );
    updateProgress(
      'AI Processing Agent: Identifying and categorizing skills...',
      45,
    );
    updateProgress(
      'AI Processing Agent: Analyzing work experience and responsibilities...',
      50,
    );
    const processingStartTime = Date.now();
    const completion = await runProcessingAgent(openai, cvText);
    console.log(
      `Main processing completed in ${
        (Date.now() - processingStartTime) / 1000
      }s`,
    );
    updateProgress('AI Processing Agent: Initial CV structure complete', 60);
    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // Enhancement Phase (if needed)
    if (
      strategyResult.contentQuality !== 'high' ||
      strategyResult.potentialChallenges.length > 0
    ) {
      updateProgress(
        'AI Enhancement Agent: Starting CV optimization process...',
        70,
      );
      updateProgress(
        `AI Enhancement Agent: Addressing identified challenges: ${strategyResult.potentialChallenges.join(
          ', ',
        )}`,
        75,
      );

      updateProgress(
        'AI Enhancement Agent: Reorganizing skills into logical categories...',
        80,
      );
      updateProgress(
        'AI Enhancement Agent: Optimizing content structure and clarity...',
        85,
      );
      const enhancementStartTime = Date.now();
      const enhancement = await runEnhancementAgent(openai, result);
      console.log(
        `Enhancement completed in ${
          (Date.now() - enhancementStartTime) / 1000
        }s`,
      );
      updateProgress('AI Enhancement Agent: Finalizing improvements...', 90);
      const enhancedResult = JSON.parse(
        enhancement.choices[0].message.content || '{}',
      );

      updateProgress(
        'AI Enhancement Agent: Optimization complete - Preparing final output...',
        95,
      );
      console.log(`Total processing time: ${(Date.now() - startTime) / 1000}s`);
      return enhancedResult;
    }

    updateProgress('AI Processing Complete: Preparing final CV output...', 95);
    console.log(`Total processing time: ${(Date.now() - startTime) / 1000}s`);
    return result;
  } catch (error) {
    console.error('Error in AI processing:', error);
    throw new Error('AI processing failed: Unable to complete CV analysis');
  }
}
