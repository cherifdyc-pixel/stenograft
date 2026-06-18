import ActualitesClient from "./ActualitesClient";

export const revalidate = 900;

export type Article = {
  title: string;
  link: string;
  date: string;
  source: string;
};

const FEEDS = [
  { url: "https://www.lemonde.fr/rss/une.xml", source: "Le Monde" },
  { url: "https://www.francetvinfo.fr/titres.rss", source: "France Info" },
  { url: "https://www.liberation.fr/arc/outboundfeeds/rss-all/", source: "Libération" },
];

function extractText(block: string, tag: string): string {
  const cdata = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1];
  if (cdata) return cdata.trim();
  const plain = block.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`))?.[1];
  return plain?.trim() ?? "";
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
      source,
    }))
    .filter(a => a.title && a.link);
}

async function fetchFeed(url: string, source: string): Promise<Article[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Stenograft/1.0; +https://stenograft.fr)" },
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    return parseRSS(await res.text(), source);
  } catch {
    return [];
  }
}

export default async function ActualitesPage() {
  const results = await Promise.all(
    FEEDS.map(({ url, source }) => fetchFeed(url, source))
  );

  const articles = results
    .flat()
    .sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return tb - ta;
    });

  return <ActualitesClient articles={articles} />;
}
