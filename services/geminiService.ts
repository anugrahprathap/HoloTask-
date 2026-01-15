
import { GoogleGenAI, Type } from "@google/genai";

// Safe API key extraction to prevent crashes in environments where 'process' is undefined
const getApiKey = () => {
  try {
    return typeof process !== 'undefined' ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });

export const decomposeTask = async (taskTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
