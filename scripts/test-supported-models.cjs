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

const candidateModels = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
];

async function testAll() {
  for (const name of candidateModels) {
    try {
      console.log(`Testing model: ${name}...`);
      const model = genAI.getGenerativeModel({ model: name });
      const res = await model.generateContent("Test connection. Reply with OK.");
      console.log(`✅ ${name} SUCCESS:`, res.response.text().trim());
    } catch (err) {
      console.error(`❌ ${name} FAILED:`, err.message);
    }
  }
}

testAll();
