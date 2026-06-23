import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type QwantItem = { title: string; url: string; desc: string };

async function searchQwant(query: string): Promise<QwantItem[]> {
  try {
    const params = new URLSearchParams({
      q:      query,
      locale: "fr_FR",
      count:  "5",
      offset: "0",
    });

    const headers: Record<string, string> = {
      "User-Agent": "STENOGRAFT/1.0 (stenograft.fr)",
      "Accept":     "application/json",
    };
    if (process.env.QWANT_API_KEY) {
      headers["Authorization"] = `Bearer ${process.env.QWANT_API_KEY}`;
    }

    const res = await fetch(
      `https://api.qwant.com/v3/search/web?${params}`,
      { headers, signal: AbortSignal.timeout(4000) },
    );

    if (!res.ok) return [];

    const json = await res.json();
    const mainline: { type: string; items: any[] }[] =
      json?.data?.result?.items?.mainline ?? [];
    const webSection = mainline.find(s => s.type === "web");

    return (webSection?.items ?? []).slice(0, 5).map((item: any) => ({
      title: String(item.title ?? ""),
      url:   String(item.url   ?? ""),
      desc:  String(item.desc  ?? ""),
    }));
  } catch {
    return [];
  }
}

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

  // Extraire la dernière question utilisateur pour Qwant
  const lastUserMsg = [...messages].reverse().find(
    (m: Record<string, unknown>) => m.role === "user",
  ) as Record<string, unknown> | undefined;
  const rawQuery = ((lastUserMsg?.content as string) ?? "").slice(0, 200).trim();

  // Enrichissement contextuel de la requête Qwant
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const SPORT_KEYWORDS = /résultat|score|match|but|buts|victoire|défaite|gagné|perdu|classement|ligue|coupe|finale/i;
  const searchQuery = rawQuery
    ? SPORT_KEYWORDS.test(rawQuery)
      ? `${rawQuery} football score match résultat ${today}`
      : `${rawQuery} ${today}`
    : "";

  console.log("[mistral/qwant] requête envoyée à Qwant:", searchQuery);

  // Recherche Qwant (non bloquante en cas d'échec)
  const qwantResults = searchQuery ? await searchQwant(searchQuery) : [];

  console.log("[mistral/qwant] résultats reçus:", qwantResults.length, qwantResults.map(r => ({ title: r.title, url: r.url })));

  // Injection dans le system prompt
  const webContext = qwantResults.length > 0
    ? "\n\n--- Résultats web récents (Qwant) ---\n" +
      qwantResults
        .map((r, i) =>
          `[${i + 1}] ${r.title}\n${r.desc}\nSource : ${r.url}`,
        )
        .join("\n\n") +
      "\n---"
    : "";

  const systemPrompt =
`Tu es le Grafter IA, l'assistant intelligent de STENOGRAFT — le réseau social souverain français.

Tu aides les citoyens à :
- Comprendre l'actualité française
- Naviguer dans les débats politiques
- Consulter Le Registre des déclarations officielles
- Découvrir ce qui se passe dans leur territoire
- Résumer les fils de discussion

Tu réponds toujours en français. Tu es factuel et neutre.
Tu es bref et direct — maximum 3 paragraphes par réponse.

RÈGLES STRICTES SUR LES SOURCES :
- Si des résultats web figurent ci-dessous, appuie-toi UNIQUEMENT sur eux et cite [1], [2]… en fin de phrase.
- Si les résultats web ne contiennent PAS l'information demandée, dis explicitement : "Je n'ai pas trouvé d'information récente sur ce sujet."
- N'invente JAMAIS de score, de date, de nom ou de fait. Si tu n'es pas sûr, dis-le clairement.
- Ne cite JAMAIS une source qui ne figure pas dans les résultats web fournis.${webContext}${context ? `\n\nContexte STENOGRAFT : ${context}` : ""}`;

  const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model:       "mistral-small-latest",
      messages:    [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens:  600,
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
    sources:  qwantResults.map(r => ({ title: r.title, url: r.url })),
  });
}
