import ActualitesClient from "./ActualitesClient";

export const revalidate = 900;

export type Article = {
  title: string;
  link: string;
  date: string;
  source: string;
  image: string | null;
  origin?: "gdelt";
};

export type GdeltEvent = {
  title: string;
  url: string;
  domain: string;
  seendate: string;
  sourcecountry: string;
  language: string;
  tone: number | null;
  image: string | null;
};

const FEEDS = [
  { url: "https://www.lemonde.fr/rss/une.xml", source: "Le Monde" },
  { url: "https://www.francetvinfo.fr/titres.rss", source: "France Info" },
  { url: "https://www.liberation.fr/arc/outboundfeeds/rss-all/", source: "Libération" },
];

const GDELT_URL =
  "https://api.gdeltproject.org/api/v2/doc/doc?query=France&mode=artlist&maxrecords=25&format=json&timespan=24h";

// ── RSS helpers ──────────────────────────────────────────────────────────────

function extractText(block: string, tag: string): string {
  const cdata = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1];
  if (cdata) return cdata.trim();
  const plain = block.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`))?.[1];
  return plain?.trim() ?? "";
}

function extractImage(block: string): string | null {
  // <media:content url="..." /> — most common (Le Monde, Libération…)
  const mc = block.match(/<media:content[^>]+url="(https?:\/\/[^"]+)"/);
  if (mc) return mc[1];
  // <media:thumbnail url="..." />
  const mt = block.match(/<media:thumbnail[^>]+url="(https?:\/\/[^"]+)"/);
  if (mt) return mt[1];
  // <enclosure url="..." type="image/..."> (France Info…)
  const encA = block.match(/<enclosure[^>]+url="(https?:\/\/[^"]+)"[^>]+type="image/);
  if (encA) return encA[1];
  const encB = block.match(/<enclosure[^>]+type="image[^"]*"[^>]+url="(https?:\/\/[^"]+)"/);
  if (encB) return encB[1];
  return null;
}

function extractLink(block: string): string {
  const direct = block.match(/<link>(https?:\/\/[^<\s]+)<\/link>/)?.[1];
  if (direct) return direct.trim();
  const guid = block.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/)?.[1];
  if (guid) return guid.trim();
  return "";
}

function parseRSS(xml: string, source: string): Article[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(([, item]) => ({
      title: extractText(item, "title"),
      link: extractLink(item),
      date: extractText(item, "pubDate"),
      image: extractImage(item),
      source,
    }))
    .filter(a => a.title && a.link);
}

async function fetchFeed(url: string, source: string): Promise<Article[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Stenograft/1.0)" },
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    return parseRSS(await res.text(), source);
  } catch {
    return [];
  }
}

// ── GDELT helpers ─────────────────────────────────────────────────────────────

function gdeltDateToISO(seendate: string): string {
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return "";
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

const GDELT_POLITIQUE_URL =
  "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
  encodeURIComponent("politique France Assemblée OR gouvernement OR Macron") +
  "&mode=artlist&maxrecords=10&format=json&sourcelang=french";

async function fetchGdeltPolitique(): Promise<Article[]> {
  try {
    const res = await fetch(GDELT_POLITIQUE_URL, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Stenograft/1.0)" },
    });
    if (!res.ok) return [];
    const data = await res.json() as { articles?: Array<{ url: string; title: string; seendate: string; domain: string; socialimage?: string }> };
    return (data.articles ?? [])
      .filter(a => a.url && a.title)
      .map(a => ({
        title: a.title,
        link: a.url,
        date: gdeltDateToISO(a.seendate),
        source: a.domain || "GDELT",
        image: a.socialimage || null,
        origin: "gdelt" as const,
      }));
  } catch {
    return [];
  }
}

async function fetchGdelt(): Promise<GdeltEvent[]> {
  try {
    const res = await fetch(GDELT_URL, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const json = await res.json() as {
      articles?: Array<{
        url: string;
        title: string;
        seendate: string;
        domain: string;
        sourcecountry?: string;
        language?: string;
        tone?: string | number;
        socialimage?: string;
      }>;
    };
    return (json.articles ?? [])
      .filter(a => a.url && a.title)
      .map(a => ({
        title: a.title,
        url: a.url,
        domain: a.domain ?? "",
        seendate: a.seendate ?? "",
        sourcecountry: a.sourcecountry ?? "",
        language: a.language ?? "",
        tone: a.tone != null ? parseFloat(String(a.tone)) : null,
        image: a.socialimage ?? null,
      }));
  } catch {
    return [];
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ActualitesPage() {
  const [rssResults, gdeltPolitique, gdeltEvents] = await Promise.all([
    Promise.all(FEEDS.map(({ url, source }) => fetchFeed(url, source))),
    fetchGdeltPolitique(),
    fetchGdelt(),
  ]);

  const articles = [...rssResults.flat(), ...gdeltPolitique].sort((a, b) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });

  return <ActualitesClient articles={articles} events={gdeltEvents} />;
}
