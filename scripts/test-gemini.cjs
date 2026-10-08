require("dotenv").config({ path: ".env.local" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  console.log("Testing Gemini API Key...");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, are you there?");
    console.log("✅ Success! Response:", result.response.text());
  } catch (err) {
    console.error("❌ Gemini API Error:");
    console.error(err.message);
  }
}

testGemini();
