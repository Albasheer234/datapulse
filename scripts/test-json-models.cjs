const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (key === "GEMINI_API_KEY") apiKey = value;
    }
  });
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testLiteVision() {
  const models = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest", "gemini-3.5-flash"];
  for (const m of models) {
    try {
      console.log(`Testing ${m} with JSON mode...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "Return a JSON array with one object: [{ \"status\": \"ok\" }]" }] }],
        generationConfig: {
          temperature: 0.0,
          responseMimeType: "application/json",
        },
      });
      console.log(`✅ ${m} Vision/JSON SUCCESS:`, res.response.text());
    } catch (e) {
      console.error(`❌ ${m} FAILED:`, e.message);
    }
  }
}

testLiteVision();
