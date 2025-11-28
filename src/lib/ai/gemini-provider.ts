import { GoogleGenAI } from "@google/genai";
import { AIService, ParsedQuestion, DifficultyLevel } from "./types";

export class GeminiProvider implements AIService {
    private ai: GoogleGenAI;

    constructor() {
        if (!process.env.GOOGLE_API_KEY) {
            console.warn("GOOGLE_API_KEY is not set, Gemini provider will fail if used.");
        }
        this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
    }

    private extractJson(text: string): string {
        let jsonString = text;
        // 1. Try to extract from markdown code block first
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonString = codeBlockMatch[1].trim();
        } else {
            // 2. If no code block, try to find the first '{' and last '}'
            const firstOpen = text.indexOf('{');
            const lastClose = text.lastIndexOf('}');

            if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                jsonString = text.substring(firstOpen, lastClose + 1);
            }
        }
        return jsonString;
    }

    private parseResponse(text: string): ParsedQuestion {
        const jsonString = this.extractJson(text);
        try {
            return JSON.parse(jsonString) as ParsedQuestion;
        } catch (error) {
            // Try heuristic fix for LaTeX escaping
            try {
                const fixedJson = jsonString
                    // Fix: Only escape backslashes that are NOT followed by valid JSON escape characters (n, r, t, b, f, u, ", \)
                    .replace(/\\(?![nrtbfu"\\/])/g, '\\\\')
                // The previous logic was too aggressive: .replace(/\\([a-zA-Z]+)/g, '\\\\$1')
                return JSON.parse(fixedJson) as ParsedQuestion;
            } catch (secondError) {
                console.error("JSON parse failed:", secondError);
                console.error("Original text:", text);
                throw new Error("Invalid JSON response from AI");
            }
        }
    }

    async analyzeImage(imageBase64: string, mimeType: string = "image/jpeg", language: 'zh' | 'en' = 'zh'): Promise<ParsedQuestion> {
        const langInstruction = language === 'zh'
            ? "IMPORTANT: For the 'analysis' field, use Simplified Chinese. For 'questionText' and 'answerText', YOU MUST USE THE SAME LANGUAGE AS THE ORIGINAL QUESTION. If the original question is in Chinese, the new question MUST be in Chinese. If the original is in English, keep it in English."
            : "Please ensure all text fields are in English.";

        const prompt = `
    You are an expert AI tutor for middle school students.
    Analyze the provided image of a homework or exam problem.
    
    ${langInstruction}
    
    Please extract the following information and return it in valid JSON format:
    1. "questionText": The full text of the question. Use Markdown format for better readability. Use LaTeX notation for mathematical formulas (inline: $formula$, block: $$formula$$).
    2. "answerText": The correct answer to the question. Use Markdown and LaTeX where appropriate.
    3. "analysis": A step-by-step explanation of how to solve the problem. 
       - Use Markdown formatting (headings, lists, bold, etc.) for clarity
       - Use LaTeX for all mathematical formulas and expressions
       - Example: "The solution is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"
       - For block formulas, use $$...$$
    4. "subject": The subject of the question. Choose ONE from: "数学", "物理", "化学", "生物", "英语", "语文", "历史", "地理", "政治", "其他".
    5. "knowledgePoints": An array of knowledge points. STRICTLY use EXACT terms from the standard list below:
       
       **数学标签 (Math Tags):**
       - 方程: "一元一次方程", "一元二次方程", "二元一次方程组", "分式方程"
       - 几何: "勾股定理", "相似三角形", "全等三角形", "圆", "三视图", "平行四边形", "矩形", "菱形"
       - 函数: "二次函数", "一次函数", "反比例函数", "二次函数的图像", "二次函数的性质"
       - 数值: "绝对值", "有理数", "实数", "科学计数法"
       - 统计: "概率", "平均数", "中位数", "方差"
       
       **物理标签 (Physics Tags):**
       - 力学: "匀速直线运动", "变速运动", "牛顿第一定律", "牛顿第二定律", "牛顿第三定律", "力", "压强", "浮力"
       - 电学: "欧姆定律", "串联电路", "并联电路", "电功率", "电功"
       - 光学: "光的反射", "光的折射", "凸透镜", "凹透镜"
       - 热学: "温度", "内能", "比热容", "热机效率"
       
       **化学标签 (Chemistry Tags):**
       - "化学方程式", "氧化还原反应", "酸碱盐", "中和反应", "金属", "非金属", "溶解度"
       
       **IMPORTANT RULES:**
       - Use EXACT matches from the list above - do NOT create variations
       - For "三视图" questions, use ONLY "三视图", NOT "左视图", "主视图", or "俯视图"
       - For force questions, use specific tags like "力", "牛顿第一定律", NOT generic "力学"
       - Maximum 5 tags per question
       - Each tag must be from the standard list

    IMPORTANT:  
    - Ensure all backslashes in LaTeX are properly escaped (use \\\\ instead of \\)
    - Return ONLY valid JSON
    - Do not wrap the JSON in markdown code blocks
    - Ensure all strings are properly escaped
    
    If the image contains multiple questions, only analyze the first complete one.
    If the image is unclear or does not contain a question, return empty strings but valid JSON.
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
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
            });

            let text = "";
            if (response.text) {
                // @ts-ignore
                text = typeof response.text === 'function' ? response.text() : response.text;
            } else if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    text = candidate.content.parts[0].text || "";
                }
            }

            if (!text) throw new Error("Empty response from AI");
            return this.parseResponse(text);

        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async generateSimilarQuestion(originalQuestion: string, knowledgePoints: string[], language: 'zh' | 'en' = 'zh', difficulty: DifficultyLevel = 'medium'): Promise<ParsedQuestion> {
        const langInstruction = language === 'zh'
            ? "IMPORTANT: For the 'analysis' field, use Simplified Chinese. For 'questionText' and 'answerText', YOU MUST USE THE SAME LANGUAGE AS THE ORIGINAL QUESTION. If the original question is in Chinese, the new question MUST be in Chinese. If the original is in English, keep it in English."
            : "Please ensure all text fields are in English.";

        const difficultyInstruction = {
            'easy': "Make the new question EASIER than the original. Use simpler numbers and more direct concepts.",
            'medium': "Keep the difficulty SIMILAR to the original question.",
            'hard': "Make the new question HARDER than the original. Combine multiple concepts or use more complex numbers.",
            'harder': "Make the new question MUCH HARDER (Challenge Level). Require deeper understanding and multi-step reasoning."
        }[difficulty];

        const prompt = `
    You are an expert AI tutor.
    Create a NEW practice problem based on the following original question and knowledge points.
    
    DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
    ${difficultyInstruction}
    
    ${langInstruction}
    
    Original Question: "${originalQuestion}"
    Knowledge Points: ${knowledgePoints.join(", ")}
    
    Return the result in valid JSON format with the following fields:
    1. "questionText": The text of the new question. IMPORTANT: If the original question is a multiple-choice question, you MUST include the options (A, B, C, D) in this field as well. Format them clearly (e.g., on new lines).
    2. "answerText": The correct answer.
    3. "analysis": Step-by-step solution.
    4. "knowledgePoints": The knowledge points (should match input).
    
    Output ONLY the JSON object.
  `;

        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ text: prompt }],
            });

            let text = "";
            if (response.text) {
                // @ts-ignore
                text = typeof response.text === 'function' ? response.text() : response.text;
            } else if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    text = candidate.content.parts[0].text || "";
                }
            }

            if (!text) throw new Error("Empty response from AI");
            return this.parseResponse(text);

        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    private handleError(error: unknown) {
        console.error("Gemini Error:", error);
        if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('fetch failed') || msg.includes('network')) {
                throw new Error("AI_CONNECTION_FAILED");
            }
            if (msg.includes('invalid json') || msg.includes('parse')) {
                throw new Error("AI_RESPONSE_ERROR");
            }
            if (msg.includes('api key') || msg.includes('unauthorized')) {
                throw new Error("AI_AUTH_ERROR");
            }
        }
        throw new Error("AI_UNKNOWN_ERROR");
    }
}
