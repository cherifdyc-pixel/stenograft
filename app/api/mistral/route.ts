import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { messages, context } = await request.json();

  const systemPrompt = `Tu es le Grafter IA, l'assistant intelligent de STENOGRAFT — le réseau social souverain français.

Tu aides les citoyens à :
- Comprendre l'actualité française
- Naviguer dans les débats politiques
- Consulter Le Registre des déclarations officielles
- Découvrir ce qui se passe dans leur territoire
- Résumer les fils de discussion

Tu réponds toujours en français. Tu es factuel, neutre, et cites tes sources quand possible.
Tu es bref et direct — maximum 3 paragraphes par réponse.
${context ? `Contexte STENOGRAFT : ${context}` : ""}`;

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? "Erreur Mistral" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    response: data.choices[0].message.content,
  });
}
