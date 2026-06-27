import { GoogleGenAI } from "@google/genai";
import { UATScript, UATMetadata } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_PROMPT = `
You are a Senior QA Automation Engineer and Technical Product Manager. 
Your goal is to convert raw, shorthand manual test steps into a polished, "Humanized" UAT script.

RULES:
1. Tense: Use strictly Simple Present Tense (e.g., "The system displays..." instead of "The system will display...").
2. Voice: Professional, clear, and business-oriented.
3. Action Verbs: Use precise UI actions: Hover over, Click on, Select, Enter, Verify, Observe.
4. Formatting: Bold key UI elements using double asterisks (e.g., **Submit Button**, **User Menu**).
5. Humanization Logic: If the user says "click login," expand it to "Click on the **Login** button to access the application."
6. Output Format: You MUST return a JSON object that matches the following structure:
{
  "metadata": {
    "scriptNumber": "UAT-001",
    "scenarioTitle": "User descriptive title based on input",
    "role": "Relevant role (e.g. Admin/User)",
    "testedBy": "",
    "testingDate": "",
    "testingStatus": "Pending",
    "additionalComments": "",
    "subScenarioNo": "1.1",
    "subScenario": "Primary Flow",
    "description": "High level description of the scenario",
    "prerequisite": "What is needed before starting"
  },
  "steps": [
    {
      "stepNumber": 1,
      "module": "High-level module name (e.g. User Management)",
      "instruction": "Humanized and BOLDED instruction",
      "expectedResult": "Humanized and BOLDED expected result in Simple Present Tense",
      "roleOverride": "Specific role for this step if different from metadata role",
      "needsReview": true
    }
  ]
}

CRITICAL: 
- If the input is nonsense, typos, or contains non-instructional text (e.g. "asdf", "gpoo"), set "needsReview" to true for that step or omit it if total gibberish.
- Ensure "needsReview" is set to true for ANY part of the input that was ambiguous.

Example Input: "1. Dashboard -> click users menu. 2. click user management button -> see list with opco, name, email."
Example Output Step:
{
  "stepNumber": 2,
  "module": "User Management",
  "instruction": "Click on the **User Management** button.",
  "expectedResult": "The **User Management Listing Page** is displayed in Table Format containing **OpCo**, **User Full Name**, and **Email ID**."
}

Do not include any prose before or after the JSON.
`;

export async function humanizeTestSteps(input: string, metadata: Partial<UATMetadata>): Promise<UATScript> {
  const prompt = `
  User Metadata (use these if provided, otherwise infer):
  ${JSON.stringify(metadata, null, 2)}

  Input Shorthand Steps:
  "${input}"
  
  Generate the humanized JSON now:
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [SYSTEM_PROMPT, prompt],
    });
    
    const text = response.text || "";
    
    // Extract JSON if model wraps it in markdown blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not find JSON in AI response");
    
    const parsed = JSON.parse(jsonMatch[0]) as UATScript;
    
    // Merge user-provided metadata with AI-inferred ones
    return {
      ...parsed,
      metadata: {
        ...parsed.metadata,
        ...metadata
      }
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
