
import { GeminiProvider } from "../src/lib/ai/gemini-provider";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testGemini() {
    console.log("Testing Gemini Connection...");
    console.log("API Key present:", !!process.env.GOOGLE_API_KEY);

    if (!process.env.GOOGLE_API_KEY) {
        console.error("Error: GOOGLE_API_KEY is missing in .env");
        return;
    }

    const provider = new GeminiProvider();

    try {
        console.log("Sending generateSimilarQuestion request...");
        const result = await provider.generateSimilarQuestion(
            "What is 1 + 1?",
            ["Math"],
            "en",
            "easy"
        );
        console.log("generateSimilarQuestion Success!");
    } catch (error: any) {
        console.error("generateSimilarQuestion Failed:", error.message);
    }

    try {
        console.log("Sending analyzeImage request with REAL image...");
        const fs = await import("fs");
        const imagePath = "/home/wttwins/.gemini/antigravity/brain/2a8874fc-faf8-4cb4-8137-053b1c27b811/uploaded_image_1764336004527.png";

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString("base64");

            const result = await provider.analyzeImage(base64Image, "image/png");
            console.log("analyzeImage Success! Response:", JSON.stringify(result, null, 2));
        } else {
            console.error("Test image not found at:", imagePath);
        }
    } catch (error: any) {
        console.error("analyzeImage Failed!");
        console.error("Error Message:", error.message);
    }
}

testGemini();
