import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateQuizFromText = async (text, apiKey) => {
  if (!apiKey) throw new Error("Please enter your Gemini API Key.");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using fast model
  
  const prompt = `
  You are an expert AI Quiz Generator. Your task is to extract ALL questions and their options from the provided text, and format them into a structured JSON array.
  
  Rules:
  1. Extract EVERY SINGLE question from the text. Do not summarize or skip any.
  2. Provide the question and options in BOTH Hindi and English. Meaning, translate if necessary so each item is bilingual (e.g. "What is the capital of India? / भारत की राजधानी क्या है?").
  3. Ensure there are exactly 4 options for each question.
  4. Identify the correct answer.
  5. The output MUST be a valid JSON array and NOTHING else (no markdown blocks like \`\`\`json, just the raw array).
  
  Format for each object in the array:
  {
    "question": "Question text in English / हिंदी में प्रश्न (Question in Hindi)",
    "options": [
      "Option A in English / हिंदी में (Hindi)",
      "Option B in English / हिंदी में (Hindi)",
      "Option C in English / हिंदी में (Hindi)",
      "Option D in English / हिंदी में (Hindi)"
    ],
    "correctAnswer": "Exact text of the correct option"
  }
  
  Here is the text to digitize into a quiz:
  ------------
  ${text}
  ------------
  `;

  try {
    const result = await model.generateContent(prompt);
    let outputText = result.response.text().trim();
    
    // Robustly extract JSON array from Markdown or conversational text
    const jsonMatch = outputText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      outputText = jsonMatch[0];
    }
    
    const parsedData = JSON.parse(outputText);
    return parsedData;
  } catch (error) {
    console.error("Error asking Gemini:", error);
    throw new Error("Failed: " + error.message);
  }
};
