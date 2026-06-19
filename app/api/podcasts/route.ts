import { NextResponse } from 'next/server'

export const revalidate = 1800 // cache 30 min

// ── Types ─────────────────────────────────────────────────────────────────────

export type PodcastEpisode = {
  id: string
  title: string
  description: string
  audioUrl: string
  duration: string
  pubDate: string
  isoDate: string
  image: string | null
  source: string
  hue: number
  cat: 'Politique' | 'Société' | 'Culture' | 'Économie'
}

// ── Feed config ───────────────────────────────────────────────────────────────

const FEEDS = [
  { url: 'https://radiofrance-podcast.net/podcast09/rss_14005.xml', source: 'France Inter',    hue: 210, defaultCat: 'Société'   },
  { url: 'https://radiofrance-podcast.net/podcast09/rss_14006.xml', source: 'France Culture',  hue: 270, defaultCat: 'Culture'   },
  { url: 'https://feeds.feedburner.com/culturebox',                  source: 'Culturebox',      hue: 45,  defaultCat: 'Culture'   },
  { url: 'https://www.lemonde.fr/podcasts/rss_full.xml',             source: 'Le Monde',        hue: 0,   defaultCat: 'Politique' },
] as const

type FeedDef = typeof FEEDS[number]

// ── XML helpers ───────────────────────────────────────────────────────────────

function stripCDATA(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function getTag(xml: string, tag: string): string {
  const t = tag.replace(':', '\\:')
  const m = xml.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`, 'i'))
  return m ? stripCDATA(m[1]).trim() : ''
}

function getAttr(xml: string, tag: string, attr: string): string {
  const t = tag.replace(':', '\\:')
  const m = xml.match(new RegExp(`<${t}[^>]*\\s${attr}="([^"]*)"`, 'i'))
  return m ? m[1] : ''
}

function formatDuration(raw: string): string {
  if (!raw) return ''
  if (/^\d+:\d+/.test(raw)) return raw
  const secs = parseInt(raw, 10)
  if (isNaN(secs) || secs <= 0) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function inferCat(title: string, desc: string, fallback: string): PodcastEpisode['cat'] {
  const t = (title + ' ' + desc).toLowerCase()
  if (/économ|fiscal|budget|finance|entreprise|bourse|emploi|croissance/.test(t)) return 'Économie'
  if (/polit|assemblée|sénat|élection|gouvernement|ministre|parti|vote|démocratie/.test(t)) return 'Politique'
  if (/culture|art|musique|cinéma|littérature|théâtre|patrimoine|exposit/.test(t)) return 'Culture'
  if (/société|social|santé|éducation|logement|inégal|jeunesse|famille/.test(t)) return 'Société'
  return fallback as PodcastEpisode['cat']
}

function parseItems(xml: string, feed: FeedDef, max = 10): PodcastEpisode[] {
  const episodes: PodcastEpisode[] = []
  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null
  let idx = 0

  while ((match = itemRe.exec(xml)) !== null && idx < max) {
    const item = match[1]
    const title    = getTag(item, 'title')
    const audioUrl = getAttr(item, 'enclosure', 'url')
    if (!title || !audioUrl) continue

    const rawDesc = getTag(item, 'itunes:summary') || getTag(item, 'description') || getTag(item, 'itunes:subtitle')
    const description = rawDesc.replace(/<[^>]+>/g, '').trim().slice(0, 220)
    const duration    = formatDuration(getTag(item, 'itunes:duration'))
    const pubDate     = getTag(item, 'pubDate')
    const isoDate     = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
    const image       = getAttr(item, 'itunes:image', 'href') || null

    episodes.push({
      id: `${feed.source}-${idx}`,
      title,
      description,
      audioUrl,
      duration,
      pubDate,
      isoDate,
      image,
      source: feed.source,
      hue: feed.hue,
      cat: inferCat(title, description, feed.defaultCat),
    })
    idx++
  }

  return episodes
}

// ── Fetch with timeout ────────────────────────────────────────────────────────

async function fetchFeed(feed: FeedDef): Promise<PodcastEpisode[]> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 9000)
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'STENOGRAFT-Bot/1.0 (podcast aggregator)' },
      next: { revalidate: 1800 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseItems(xml, feed)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed))

  const episodes = results
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime())

  return NextResponse.json(episodes, {
    headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
  })
}
