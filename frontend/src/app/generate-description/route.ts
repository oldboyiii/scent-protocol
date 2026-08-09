import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, gender, pType, topNotes, heartNotes, baseNotes, concentration, rarity } = body;

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return NextResponse.json(
        { description: "AI description unavailable. OpenAI key not configured." },
        { status: 200 }
      );
    }

    const genderText = ["unisex", "male", "female"][gender] || "unisex";
    const typeText = ["Parfum", "EDP", "Eau de Toilette", "Eau de Cologne"][pType] || "EDT";
    const rarityText = ["common", "rare", "epic", "legendary"][rarity] || "common";

    const prompt = `Write a poetic, sensual perfume description for a marketing card.

Name: ${name}
Gender: ${genderText}
Type: ${typeText}
Concentration: ${concentration}%
Rarity: ${rarityText}
Top notes: ${topNotes.join(", ")}
Heart notes: ${heartNotes.join(", ")}
Base notes: ${baseNotes.join(", ")}

Write in English, 2-3 sentences, atmospheric, combining the notes into a single image. Avoid clichés. 40-60 words.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a perfume critic and copywriter. You write fragrance descriptions for a premium brand." },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const description = completion.choices[0]?.message?.content?.trim() || "A mysterious fragrance waiting to be discovered.";

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error("AI generation error:", error.message);
    return NextResponse.json(
      { description: "AI description temporarily unavailable. Enjoy your scent!" },
      { status: 200 }
    );
  }
}
