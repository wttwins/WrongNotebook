import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

export interface ParsedQuestion {
    questionText: string;
    answerText: string;
    analysis: string;
    knowledgePoints: string[];
}

export async function analyzeImage(imageBase64: string, mimeType: string = "image/jpeg", language: 'zh' | 'en' = 'zh'): Promise<ParsedQuestion> {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not set");
    }

    const langInstruction = language === 'zh'
        ? "Please ensure all text fields (questionText, answerText, analysis) are in Simplified Chinese."
        : "Please ensure all text fields are in English.";

    const prompt = `
    You are an expert AI tutor for middle school students.
    Analyze the provided image of a homework or exam problem.
    
    ${langInstruction}
    
    Please extract the following information and return it in valid JSON format:
    1. "questionText": The full text of the question, including any formulas (use LaTeX for formulas).
    2. "answerText": The correct answer to the question.
    3. "analysis": A step-by-step explanation of how to solve the problem.
    4. "knowledgePoints": An array of specific knowledge points or concepts tested in this question (e.g., "Pythagorean Theorem", "Linear Equations").

    If the image contains multiple questions, only analyze the first complete one.
    If the image is unclear or does not contain a question, return empty strings but valid JSON.
    
    Output ONLY the JSON object, no markdown formatting.
  `;

    const contents = [
        {
            inlineData: {
                mimeType: mimeType,
                data: imageBase64,
            },
        },
        { text: prompt },
    ];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
        });

        // Safe text extraction for @google/genai SDK
        let text = "";
        if (response.text) {
            text = typeof response.text === 'function' ? response.text() : response.text;
        } else if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                text = candidate.content.parts[0].text || "";
            }
        }

        if (!text) {
            throw new Error("Empty response from AI");
        }

        // Clean up potential markdown code blocks
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(jsonString) as ParsedQuestion;
    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        throw new Error("Failed to analyze image");
    }
}

export async function generateSimilarQuestion(originalQuestion: string, knowledgePoints: string[], language: 'zh' | 'en' = 'zh'): Promise<ParsedQuestion> {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY is not set");
    }

    const langInstruction = language === 'zh'
        ? "Please ensure all text fields are in Simplified Chinese."
        : "Please ensure all text fields are in English.";

    const prompt = `
    You are an expert AI tutor.
    Create a NEW practice problem based on the following original question and knowledge points.
    The new problem should test the same concepts but use different numbers or a slightly different scenario.
    
    ${langInstruction}
    
    Original Question: "${originalQuestion}"
    Knowledge Points: ${knowledgePoints.join(", ")}
    
    Return the result in valid JSON format with the following fields:
    1. "questionText": The text of the new question.
    2. "answerText": The correct answer.
    3. "analysis": Step-by-step solution.
    4. "knowledgePoints": The knowledge points (should match input).
    
    Output ONLY the JSON object.
  `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: prompt }],
        });

        // Safe text extraction for @google/genai SDK
        let text = "";
        if (response.text) {
            text = typeof response.text === 'function' ? response.text() : response.text;
        } else if (response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                text = candidate.content.parts[0].text || "";
            }
        }

        if (!text) {
            throw new Error("Empty response from AI");
        }

        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString) as ParsedQuestion;
    } catch (error) {
        console.error("Error generating similar question:", error);
        throw new Error("Failed to generate question");
    }
}
