const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
require('dotenv').config({ path: '.env' });

async function checkModels() {
    console.log("Initializing GoogleGenAI...");
    // Assuming it reads GOOGLE_API_KEY from env, or we pass it.
    // The user snippet passed empty object {}, implying env var usage or default.
    // But explicitly passing it is safer.
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const modelsToTest = ["gemini-2.5-flash"];
    const base64ImageFile = fs.readFileSync("1.png", {
        encoding: "base64",
    });
    const contents = [
        {
            inlineData: {
                mimeType: "image/jpeg",
                data: base64ImageFile,
            },
        },
        { text: "Caption this image." },
    ];

    for (const modelName of modelsToTest) {
        console.log(`\nTesting model: ${modelName}`);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
            });
            console.log(`✅ Model ${modelName} is working.`);
            console.log("Response:", response);
        } catch (error) {
            console.error(`❌ Failed ${modelName}:`, error.message || error);
        }
    }
}

checkModels();
