const fs = require("fs");
const path = require("path");

let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (key === "GEMINI_API_KEY") apiKey = value;
      }
    });
  } catch (err) {
    console.error(err);
  }
}

async function listModels() {
  console.log("Checking available Gemini models for API key...");
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log("Available models:");
      const supported = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace("models/", ""));
      console.log(JSON.stringify(supported, null, 2));
    } else {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

listModels();
