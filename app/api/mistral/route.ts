import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (!process.env.MISTRAL_API_KEY) {
    return NextResponse.json({ error: "Service IA non configuré." }, { status: 503 });
  }

  const { messages, context } = await request.json();

  if (!Array.isArray(messages) || messages.length > 20)
    return NextResponse.json({ error: "Trop de messages" }, { status: 400 });

  const isValidMsg = (m: unknown): boolean =>
    typeof m === "object" && m !== null &&
    ["user", "assistant"].includes((m as Record<string, unknown>).role as string) &&
    typeof (m as Record<string, unknown>).content === "string" &&
    ((m as Record<string, unknown>).content as string).length <= 4000;

  if (!messages.every(isValidMsg))
    return NextResponse.json({ error: "Format de message invalide" }, { status: 400 });

  const totalSize = messages.reduce(
    (sum: number, m: Record<string, unknown>) => sum + (m.content as string).length, 0,
  );
  if (totalSize > 40000)
    return NextResponse.json({ error: "Contenu total trop volumineux" }, { status: 400 });

  if (context !== undefined && (typeof context !== "string" || context.length > 500))
    return NextResponse.json({ error: "Contexte invalide" }, { status: 400 });

  const systemPrompt =
`Tu es le Grafter IA, l'assistant intelligent de STENOGRAFT — le réseau social souverain français.

Tu aides les citoyens à :
- Comprendre l'actualité française
- Naviguer dans les débats politiques
- Consulter Le Registre des déclarations officielles
- Découvrir ce qui se passe dans leur territoire
- Résumer les fils de discussion

Tu réponds toujours en français. Tu es factuel, neutre, et cites tes sources quand possible.
Tu es bref et direct — maximum 3 paragraphes par réponse.
${context ? `Contexte STENOGRAFT : ${context}` : ""}`;

  const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model:       "mistral-small-latest",
      messages:    [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens:  500,
      temperature: 0.7,
    }),
  });

  const data = await mistralRes.json();

  if (!mistralRes.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? "Erreur Mistral" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    response: data.choices[0].message.content,
  });
}
