import { GoogleGenAI } from "@google/genai";
import { SAESTraceStep } from "../types";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const explainStepWithAI = async (step: SAESTraceStep, prevStep?: SAESTraceStep): Promise<string> => {
  const ai = getGeminiClient();
  if (!ai) return "Please configure your API Key to use AI features.";

  const prompt = `
    You are an expert cryptography professor explaining Simplified AES (S-AES) to a student.
    
    Current Step: ${step.id}
    Description: ${step.description}
    Technical Details: ${step.details}
    
    Current State (Hex): ${step.state.raw.toString(16).toUpperCase().padStart(4, '0')}
    ${prevStep ? `Previous State (Hex): ${prevStep.state.raw.toString(16).toUpperCase().padStart(4, '0')}` : ''}
    ${step.key !== undefined ? `Round Key Used (Hex): ${step.key.toString(16).toUpperCase().padStart(4, '0')}` : ''}

    Please provide a concise, engaging, and easy-to-understand explanation of what exactly happened in this step and why it is important for security (e.g., confusion vs diffusion). 
    Keep it under 3 sentences if possible. Focus on the transformation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to fetch AI explanation. Please check your API key and try again.";
  }
};
