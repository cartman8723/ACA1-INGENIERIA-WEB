const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require("path");
const responseSchema = require("../utils/responseSchema");

// Inicializa Gemini
if (!process.env.GOOGLE_API_KEY) {
  console.error("❌ Falta GOOGLE_API_KEY en .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);

async function extractWithGemini(filePath, mimeType) {
  // Subir archivo al FileManager de Google
  const uploadResp = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  });

  const fileUri = uploadResp.file.uri;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Eres un extractor de información de hojas de vida (CV).
Devuelve SOLO un JSON que cumpla con el esquema dado.
No inventes datos. Omite los campos que no aparezcan.
`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, { fileData: { fileUri, mimeType } }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  return JSON.parse(result.response.text());
}

module.exports = { extractWithGemini };
