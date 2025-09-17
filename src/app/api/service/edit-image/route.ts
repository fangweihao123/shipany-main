import { JSONValue, experimental_generateImage as generateImage } from "ai";
import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";
import { newStorage } from "@/lib/storage";
import { GoogleGenAI, Modality, GoogleGenAIOptions } from "@google/genai";
import * as fs from "node:fs";
import { NextRequest } from "next/server";

const NANOBANANA_API_KEY = process.env.NANO_BANANA_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const provider = formData.get('provider') as string;
    const model = formData.get('model') as string;
    
    if (!prompt || !provider || !model) {
      return respErr("invalid params");
    }

    const option:GoogleGenAIOptions = {apiKey:NANOBANANA_API_KEY};
    const ai = new GoogleGenAI(option);
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    const candidates = response?.candidates ?? [];
    const [firstCandidate] = candidates;
    const parts = firstCandidate?.content?.parts ?? [];
    const batch = getUuid();
    const filename = `gemini-native-image-${batch}.png`;
    for (const part of parts) {
      if (part.text) {
        console.log(part.text);
        continue;
      }

      const base64 = part.inlineData?.data;
      if (!base64) continue;

      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(filename, buffer);
      console.log("Image saved as gemini-native-image.png");
    }
    const storage = newStorage();
    const key = `nanobanan/${filename}`;
    const body = fs.readFileSync(filename);
    const res = await storage.uploadFile({
      body,
      key,
      contentType: "image/png",
      disposition: "inline",
    });
    return {
      ...res,
      provider,
      filename,
    };
  } catch (err) {
    console.log("gen image failed:", err);
    return respErr("gen image failed");
  }
}
