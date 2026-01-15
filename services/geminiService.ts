
import { GoogleGenAI, Type } from "@google/genai";

export const decomposeTask = async (taskTitle: string) => {
  // Check for API key presence to avoid crashing
  if (!process.env.API_KEY) {
    console.error("Gemini API Key missing in environment.");
    return null;
  }

  try {
    // Initialize inside function as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Decompose the following complex directive into 3 to 5 logical sub-directives for a futuristic command center interface: "${taskTitle}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "Broad category (e.g., ENGINEERING, LOGISTICS, RESEARCH)" },
            effort: { type: Type.STRING, description: "Effort level: LOW, MEDIUM, or HIGH" },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  effort: { type: Type.NUMBER, description: "Weight of task from 1 to 10" }
                },
                required: ["title", "effort"]
              }
            }
          },
          required: ["category", "effort", "subtasks"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("AI Decomposition Error:", error);
    return null;
  }
};
