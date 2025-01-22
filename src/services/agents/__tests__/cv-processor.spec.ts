import 'openai/shims/node';
import { processCVWithAI } from '../cv-processor';

// Mock OpenAI with conditional responses
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation(async ({ messages }) => {
            // Get the CV text from the messages
            const cvText = messages.find(m => m.role === 'user')?.content || '';
            
            // Handle empty or whitespace-only input
            if (!cvText || !cvText.trim()) {
              throw new Error('Text is required');
            }

            // For incomplete CV test
            if (cvText.includes('Looking for a position')) {
              return {
                choices: [{
                  message: {
                    content: JSON.stringify({
                      firstName: "Unknown",
                      objective: "Looking for a position",
                      skills: { "General Skills": "Did something" },
                      experience: [{
                        company: "Company A",
                        position: "Position A",
                        period: "2020-2021",
                        responsibilities: ["Did something"]
                      }],
                      formattingNotes: [],
                      piiRemoved: []
                    })
                  }
                }]
              };
            }

            // Default response for full CV
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    firstName: "John",
                    objective: "I am a dedicated and highly motivated electrical engineer...",
                    skills: {
                      "Electrical Skills": "General service work (domestic, commercial and industrial), Lighting, Fault finding",
                      "General Skills": "Operating hand and power tools, Stock control, Ability to multitask"
                    },
                    experience: [
                      {
                        company: "ZMS Electrical",
                        position: "Electrician",
                        period: "2022-2023",
                        responsibilities: ["General Electrical work", "Commercial Solar works"]
                      },
                      {
                        company: "Test Aged Care",
                        position: "Maintenance Manager",
                        period: "2018-2022",
                        responsibilities: ["Organise maintenance", "Customer service"]
                      },
                      {
                        company: "TST Electrical",
                        position: "Electrician",
                        period: "2016-2018",
                        responsibilities: ["Government contracts"]
                      },
                      {
                        company: "Top Test Electrical",
                        position: "Electrician",
                        period: "2007-2016",
                        responsibilities: ["Prison maintenance"]
                      }
                    ],
                    formattingNotes: ["Removed reference section"],
                    piiRemoved: ["Test", "Harvey"]
                  })
                }
              }]
            };
          })
        }
      }
    }))
  };
});

const sampleCV = `CAREER OBJECTIVE 
I am a dedicated and highly motivated electrical engineer with a strong passion for innovation and a 
proven track record of delivering outstanding results in the field. With a solid foundation in electrical 
engineering principles and extensive hands-on experience, I have consistently contributed to the 
successful completion of projects, demonstrating a deep understanding of circuit design, power 
distribution, and control systems. My commitment to staying up-to-date with the latest industry trends 
and technologies, coupled with my ability to work collaboratively in multidisciplinary teams, positions 
me as a valuable asset in tackling complex electrical engineering challenges. I am excited to leverage my 
expertise to drive excellence in future projects and continue pushing the boundaries of electrical 
engineering. 
Qualified and licensed electrician, I have a car and licence and am available for an immediate start.  
   
KEY SKILLS 
• Operating hand and power tools  
• Stock control  
• Forklift and EWP experience  
• Sales and marketing experience  
• Proficient in Microsoft 360  
• Ability to multitask  
• Ability to meet and exceed kpi's  
• Diligent to work withing workplace health and safety guidelines.  
 
Electrical skills  
• General service work (domestic, commercial and industrial) 
• Lighting  
• Fault finding  
• General power  
• Switchboards  
• Commercial kitchen equipment  
• Pumps  
• Control wiring  
 
John Test 
 
• Generators  
• Smoke alarms  
 
WORK HISTORY 
ZMS Electrical | Electrician  2022-2023 
● General Electrical work  
● Commercial Solar works   
● Use of power and hand tools  

Test Aged Care | Maintenance Manager   2018-2022       
● Organise all reactive and preventive maintenance issues.  
● Quality customer service for residents  
● Manage training and ongoing competency for staff.  
 
TST Electrical | Electrician      2016-2018       
● Government testing contracts  
● Emergency lighting testing and repair  
● Switchboard compliance testing  
 
Top Test Electrical Contractors | Electrician   2007-2016       
● Woodford prison maintenance  
● Service electrician for department of housing  
● Experience with wide variety of equipment including computer-controlled emergency lighting, 
sewerage pumps, generators, commercial laundry equipment  
● Manage training and ongoing competency for staff.  
 
Previous employment history available on request:  
 
REFERENCES 
Harvey - Director, HJ Recruitment`;

describe('CV Processor', () => {
  jest.setTimeout(60000); // Set timeout for all tests

  describe('processCVWithAI', () => {
    it('should process a valid CV and return structured data', async () => {
      const result = await processCVWithAI(sampleCV);
      
      // Test basic structure
      expect(result).toHaveProperty('firstName');
      expect(result).toHaveProperty('objective');
      expect(result).toHaveProperty('skills');
      expect(result).toHaveProperty('experience');
      expect(result).toHaveProperty('formattingNotes');
      expect(result).toHaveProperty('piiRemoved');

      // Test firstName
      expect(result.firstName).toBe('John');

      // Test skills structure
      expect(result.skills).toBeInstanceOf(Object);
      expect(Object.keys(result.skills).length).toBeGreaterThan(0);

      // Test experience array
      expect(Array.isArray(result.experience)).toBe(true);
      expect(result.experience.length).toBe(4);

      // Test specific experience entry
      const zmsExperience = result.experience.find(exp => exp.company === 'ZMS Electrical');
      expect(zmsExperience).toBeDefined();
      expect(zmsExperience?.period).toBe('2022-2023');
      expect(zmsExperience?.position).toBe('Electrician');
      expect(Array.isArray(zmsExperience?.responsibilities)).toBe(true);

      // Test PII removal
      expect(Array.isArray(result.piiRemoved)).toBe(true);
      expect(result.piiRemoved).toContain('Test');
    });

    it('should handle empty input', async () => {
      const emptyPromise = processCVWithAI('');
      await expect(emptyPromise).rejects.toThrow('Text is required');
    });

    it('should handle invalid input', async () => {
      const invalidPromise = processCVWithAI('   ');
      await expect(invalidPromise).rejects.toThrow('Text is required');
    });

    it('should process CV with missing sections gracefully', async () => {
      const incompleteCV = `
        CAREER OBJECTIVE
        Looking for a position.
        
        WORK HISTORY
        Company A | Position A | 2020-2021
        • Did something
      `;

      const result = await processCVWithAI(incompleteCV);
      expect(result).toHaveProperty('objective');
      expect(result).toHaveProperty('skills');
      expect(result.experience.length).toBe(1);
    });

    it('should properly categorize skills', async () => {
      const result = await processCVWithAI(sampleCV);
      
      // Check if skills are properly categorized
      const skillCategories = Object.keys(result.skills);
      expect(skillCategories.length).toBeGreaterThan(0);

      // Verify electrical skills are grouped together
      const electricalSkillsFound = skillCategories.some(category => 
        category.toLowerCase().includes('electrical')
      );
      expect(electricalSkillsFound).toBe(true);

      // Verify general skills are grouped together
      const generalSkillsFound = skillCategories.some(category =>
        category.toLowerCase().includes('general')
      );
      expect(generalSkillsFound).toBe(true);
    });

    it('should handle PII removal correctly', async () => {
      const result = await processCVWithAI(sampleCV);
      
      // Check if PII is removed and tracked
      expect(result.piiRemoved).toContain('Test');
      expect(result.piiRemoved).toContain('Harvey');
      
      // Ensure first name is preserved
      expect(result.firstName).toBe('John');
    });
  });
}); 