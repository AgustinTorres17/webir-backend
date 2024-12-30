const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GOOGLE_KEY } = require("../config");

const genAI = new GoogleGenerativeAI(GOOGLE_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generation_config: "application/json",
});

async function generateContent(prompt) {
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response?.candidates[0]?.content?.parts[0]?.text;
  return text;
}

module.exports = {
  generateContent,
};
