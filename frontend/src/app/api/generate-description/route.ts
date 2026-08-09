import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, gender, pType, topNotes, heartNotes, baseNotes, concentration, rarity } = body;

    const genderText = ["унисекс", "мужской", "женский"][gender] || "унисекс";
    const typeText = ["духи (Parfum)", "парфюмерная вода (EDP)", "туалетная вода (EDT)", "одеколон (EDC)"][pType] || "туалетная вода";
    const rarityText = ["обычная", "редкая", "эпическая", "легендарная"][rarity] || "обычная";

    const prompt = `Напиши поэтическое, чувственное описание парфюма для маркетинговой карточки.

Название: ${name}
Пол: ${genderText}
Тип: ${typeText}
Концентрация: ${concentration}%
Редкость: ${rarityText}
Верхние ноты: ${topNotes.join(", ")}
Сердечные ноты: ${heartNotes.join(", ")}
Базовые ноты: ${baseNotes.join(", ")}

Описание должно быть на русском языке, 2-3 предложения, атмосферное, сочетающее ноты в единую картину. Без шаблонных фраз. Объём 40-60 слов.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Ты — парфюмерный критик и копирайтер. Пишешь описания ароматов для премиального бренда." },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 200,
    });

    const description = completion.choices[0]?.message?.content?.trim() || "Аромат без описания.";

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { description: "ИИ-описание временно недоступно. Наслаждайтесь ароматом!" },
      { status: 200 }
    );
  }
}
