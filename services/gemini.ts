import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, WowLevel, ChatMessage } from "../types";

// Using gemini-2.5-flash for fast, structured reasoning
const MODEL_NAME = "gemini-2.5-flash";

export const checkApiKey = (): boolean => {
  return !!process.env.API_KEY;
};

export const analyzeData = async (
  dataContext: string,
  jd: string,
  wowLevel: number
): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Construct the prompt based on Wow Factor
  let wowInstruction = "";
  if (wowLevel <= WowLevel.BASIC) {
    wowInstruction = "Provide a basic summary and simple facts. Keep it straightforward.";
  } else if (wowLevel <= WowLevel.STANDARD) {
    wowInstruction = "Analyze trends and provide standard professional recommendations.";
  } else if (wowLevel <= WowLevel.ADVANCED) {
    wowInstruction = "Deep dive into correlations, predict future outcomes, and suggest process improvements.";
  } else {
    wowInstruction = "Think like a C-Level consultant. Provide disruptive strategies, high-impact foresight, and innovative tool suggestions that transform the business.";
  }

  const prompt = `
    Act as a Senior Full-Stack Developer and Data Analyst Expert.
    
    Analyze the following raw data (CSV/Text format):
    "${dataContext}"

    My Job Description (JD) is:
    "${jd}"

    STRICT CONSTRAINT: All suggestions and tools MUST fall within the scope of my JD. Do not suggest tasks that belong to other departments unless it's a collaborative tool I can build.

    Goal: Create an analysis report with a "Wow Factor" of ${wowLevel}%.
    ${wowInstruction}

    Output Language: Thai (ภาษาไทย)
    
    Return the result strictly in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy title for the analysis" },
            executiveSummary: { type: Type.STRING, description: "Short, high-level summary for executives to make decisions." },
            operationalInsights: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of easy-to-understand points for operational staff."
            },
            toolSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of software/AI tools or scripts I should build/use to solve these problems, fitting my JD."
            },
            chartType: { type: Type.STRING, enum: ["bar", "line", "pie"] },
            chartTitle: { type: Type.STRING },
            chartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  category: { type: Type.STRING }
                },
                required: ["name", "value"]
              }
            },
            impactScore: { type: Type.NUMBER, description: "A score 0-100 of how impactful this analysis is." }
          },
          required: ["title", "executiveSummary", "operationalInsights", "toolSuggestions", "chartData", "chartType", "chartTitle"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze data. Please check your input or API key.");
  }
};

export const askFollowUpQuestion = async (
  question: string,
  dataContext: string,
  jd: string,
  history: ChatMessage[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  // Format history for context (limited to last 10 messages to save context window)
  const conversationHistory = history.slice(-10).map(msg => 
    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');

  const prompt = `
    Context:
    You are an expert Data Analyst & Senior Full-Stack Developer.
    You have already analyzed a dataset. Now the user is asking follow-up questions.
    
    Raw Data:
    "${dataContext}"

    User's JD (Scope Constraint):
    "${jd}"

    Conversation History:
    ${conversationHistory}

    Current Question:
    "${question}"

    Instructions:
    1. Answer based strictly on the data provided.
    2. Keep the tone professional and helpful.
    3. If suggesting technical solutions, ensure they fit the JD.
    4. Answer in Thai.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  return response.text || "ขออภัย ไม่สามารถประมวลผลคำตอบได้ในขณะนี้";
};
