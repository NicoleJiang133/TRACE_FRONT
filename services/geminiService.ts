import { GoogleGenAI, Type } from "@google/genai";
import { HypothesisArtifact, SourcePaper } from "../types";

// Initialize the API client
// CRITICAL: process.env.API_KEY is guaranteed to be available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const HYPOTHESIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy, scientific title for the hypothesis." },
    statement: { type: Type.STRING, description: "The core hypothesis statement, concise and scientific." },
    summary: { type: Type.STRING, description: "A 2-3 sentence summary of the hypothesis context." },
    confidence: {
      type: Type.OBJECT,
      properties: {
        overall: { type: Type.NUMBER, description: "Overall confidence score 0-100." },
        novelty: { type: Type.NUMBER, description: "Novelty score 0-100." },
        plausibility: { type: Type.NUMBER, description: "Plausibility score 0-100." },
        testability: { type: Type.NUMBER, description: "Testability score 0-100." },
      },
      required: ["overall", "novelty", "plausibility", "testability"],
    },
    evidence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          paper: { type: Type.STRING, description: "Title of the source paper." },
          page: { type: Type.NUMBER, description: "Page number (approximate)." },
          quote: { type: Type.STRING, description: "A relevant quote or finding from the paper." },
          confidenceLevel: { type: Type.STRING, description: "High, Medium, or Low" },
        },
        required: ["paper", "page", "quote", "confidenceLevel"],
      },
    },
    noveltyAssessment: {
      type: Type.OBJECT,
      properties: {
        isNovel: { type: Type.BOOLEAN },
        reasoning: { type: Type.STRING },
      },
      required: ["isNovel", "reasoning"],
    },
    proposedExperiment: {
      type: Type.OBJECT,
      properties: {
        procedure: { type: Type.ARRAY, items: { type: Type.STRING } },
        expectedOutcome: { type: Type.STRING },
      },
      required: ["procedure", "expectedOutcome"],
    },
  },
  required: ["title", "statement", "summary", "confidence", "evidence", "noveltyAssessment", "proposedExperiment"],
};

export const generateHypothesis = async (papers: SourcePaper[]): Promise<Partial<HypothesisArtifact>> => {
  const prompt = `
    Analyze the following two scientific paper summaries/abstracts and generate a NOVEL scientific hypothesis that connects concepts from both papers.
    
    Paper 1: ${papers[0].title}
    Content: ${papers[0].content}
    
    Paper 2: ${papers[1].title}
    Content: ${papers[1].content}
    
    The output must be a structured scientific artifact.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: HYPOTHESIS_SCHEMA,
        temperature: 0.7, // Slightly creative
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text returned from Gemini");
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating hypothesis:", error);
    throw error;
  }
};

export const generateScientificIllustration = async (hypothesisSummary: string): Promise<string | undefined> => {
  const prompt = `
    Create a premium, abstract scientific illustration representing this hypothesis: "${hypothesisSummary}".
    Style: Futuristic, data-driven, ethereal.
    Color Palette: Deep Blue (#1e3a8a), Emerald Green (#10b981), and White glowing accents.
    Composition: Center-focused, 3:4 aspect ratio suitable for a trading card.
    No text in the image. High quality, 3D render style.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", // Nano Banana
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        // Nano Banana doesn't support advanced imageConfig like size/aspectRatio in the same way Pro does via config object usually,
        // but we can try to guide via prompt. The response format is inlineData.
      },
    });

    // Iterate to find image part
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Error generating illustration:", error);
    // Return a placeholder if generation fails to keep the UI intact
    return "https://picsum.photos/360/580"; 
  }
};