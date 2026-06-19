import Link from "next/link";

const RED   = "#E0492F";
const GOLD  = "#C9A24B";
const BG    = "#000000";
const S     = "#0A0A0A";
const B     = "#1C1C1C";
const TEXT  = "#E7E9EA";
const TEXT2 = "#71767B";

export default function HomePage() {
  const FEATURES = [
    { icon: "✍️",  title: "Le Graft",        desc: "Publiez du texte, des vidéos, des réponses. Votre parole, sans filtre ni algorithme." },
    { icon: "📡",  title: "Le Veilleur",      desc: "Actualités françaises en temps réel. Le Monde, France Info, Libération + GDELT International." },
    { icon: "🏛️", title: "Le Registre",      desc: "Les paroles officielles des élus et institutions. Tracées. Vérifiables. Permanentes." },
    { icon: "🎙️", title: "Podcasts",          desc: "France Inter, France Culture. Écoutez sans quitter la plateforme." },
    { icon: "📺",  title: "STENOGRAFT TV",    desc: "Lives, replays, chaînes thématiques. Le Periscope souverain." },
    { icon: "🗺️", title: "Territoires",       desc: "Communautés locales et nationales. Débattez avec votre région." },
    { icon: "🔥",  title: "Tendances",        desc: "Les hashtags qui montent. Ce dont parlent vraiment les Grafters." },
    { icon: "🔎",  title: "Recherche",        desc: "Trouvez un Grafter, un graft, une idée. En temps réel." },
    { icon: "📻",  title: "Radio",            desc: "Stations françaises en direct. Écoutez en continuant de graffer." },
  ];

  const STATS = [
    { n: "15 juil.", label: "Lancement officiel" },
    { n: "100%",     label: "Souverain français" },
    { n: "0",        label: "Publicité" },
  ];

  return (
    <main style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── Barre de lancement ── */}
      <div style={{ background: `${RED}12`, borderBottom: `1px solid ${RED}20`, padding: "10px 24px", textAlign: "center" }}>
        <span style={{ fontSize: "13px", color: RED, fontWeight: 700 }}>
          🚀 Lancement le 15 juillet 2026 — Inscris-toi avant l'ouverture ·{" "}
          <Link href="/inscription" style={{ color: RED, textDecoration: "underline", fontWeight: 800 }}>Réserver ma place</Link>
        </span>
      </div>

      {/* ── Nav ── */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 40px", borderBottom: `1px solid ${B}`,
        position: "sticky", top: 0, zIndex: 100,
        background: `${BG}E8`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", fontWeight: 900, color: "#fff",
            boxShadow: `0 4px 16px ${RED}55`,
          }}>S</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 900, letterSpacing: "1.5px", color: TEXT, lineHeight: 1 }}>STENOGRAFT</div>
            <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "3px", color: GOLD, lineHeight: 1, opacity: 0.85 }}>SOUVERAIN</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href="/connexion" style={{ padding: "8px 20px", borderRadius: "20px", border: `1px solid ${B}`, color: TEXT2, textDecoration: "none", fontSize: "14px", fontWeight: 500, transition: "border-color 0.15s" }}>
            Connexion
          </Link>
          <Link href="/inscription" style={{ padding: "9px 22px", borderRadius: "20px", background: RED, color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 700, boxShadow: `0 4px 16px ${RED}45` }}>
            Rejoindre
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ textAlign: "center", padding: "96px 24px 80px" }}>
        <div style={{ display: "inline-block", fontSize: "11px", color: RED, fontWeight: 800, letterSpacing: "0.18em", marginBottom: "24px", textTransform: "uppercase", background: `${RED}12`, border: `1px solid ${RED}30`, borderRadius: "20px", padding: "6px 16px" }}>
          Le réseau social souverain français
        </div>
        <h1 style={{ fontSize: "clamp(38px, 6.5vw, 76px)", fontWeight: 900, lineHeight: 1.07, margin: "0 auto 20px", maxWidth: "820px", letterSpacing: "-1.5px" }}>
          La parole est{" "}
          <span style={{ color: RED, display: "inline-block" }}>tenue.</span>
        </h1>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: TEXT2, maxWidth: "540px", margin: "0 auto 44px", lineHeight: 1.75 }}>
          Grafter vos idées. Suivez les Grafters qui comptent. Débattez sans algorithme, sans censure, sans publicité.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/inscription" style={{ padding: "15px 36px", borderRadius: "100px", background: RED, color: "#fff", textDecoration: "none", fontSize: "16px", fontWeight: 800, boxShadow: `0 6px 28px ${RED}50`, letterSpacing: "0.2px" }}>
            Créer mon compte
          </Link>
          <Link href="/connexion" style={{ padding: "15px 36px", borderRadius: "100px", border: `1px solid ${B}`, color: TEXT2, textDecoration: "none", fontSize: "16px", fontWeight: 500 }}>
            Se connecter
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: "36px 24px", borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "clamp(32px, 8vw, 80px)", flexWrap: "wrap", maxWidth: "700px", margin: "0 auto" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: RED, letterSpacing: "-0.5px" }}>{s.n}</div>
              <div style={{ fontSize: "12px", color: TEXT2, marginTop: "4px", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "72px 24px", maxWidth: "1040px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{ color: TEXT2, fontSize: "16px", margin: 0 }}>9 espaces. Une seule plateforme. 100% française.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                background: S, border: `1px solid ${B}`,
                borderTop: i === 0 ? `2px solid ${RED}` : i === 2 ? `2px solid ${GOLD}` : `1px solid ${B}`,
                borderRadius: "16px", padding: "28px 24px",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "14px", lineHeight: 1 }}>{f.icon}</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: TEXT, marginBottom: "8px", letterSpacing: "-0.2px" }}>{f.title}</div>
              <div style={{ fontSize: "13px", color: TEXT2, lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Manifeste ── */}
      <section style={{ padding: "72px 24px", borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: "48px", height: "2px", background: GOLD, margin: "0 auto 32px" }} />
          <blockquote style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700, color: TEXT, lineHeight: 1.6, margin: "0 0 24px", fontStyle: "italic", letterSpacing: "-0.3px" }}>
            "Dans un monde où la parole est marchandisée, nous créons un espace où elle est <span style={{ color: GOLD }}>souveraine</span>."
          </blockquote>
          <div style={{ width: "48px", height: "2px", background: GOLD, margin: "0 auto" }} />
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ textAlign: "center", padding: "88px 24px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 46px)", fontWeight: 900, margin: "0 0 16px", letterSpacing: "-0.8px" }}>
            Prêt à greffer ?
          </h2>
          <p style={{ color: TEXT2, fontSize: "16px", marginBottom: "36px", lineHeight: 1.65 }}>
            Rejoignez les premiers Grafters avant l'ouverture officielle du 15 juillet.
          </p>
          <Link href="/inscription" style={{
            display: "inline-block",
            padding: "17px 44px", borderRadius: "100px",
            background: RED, color: "#fff",
            textDecoration: "none", fontSize: "18px", fontWeight: 800,
            boxShadow: `0 8px 32px ${RED}55`,
            letterSpacing: "0.3px",
          }}>
            #GrafteLesMots
          </Link>
          <div style={{ marginTop: "20px" }}>
            <Link href="/connexion" style={{ color: TEXT2, textDecoration: "none", fontSize: "14px" }}>Déjà un compte ? Connexion →</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${B}`, padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: "#fff" }}>S</div>
          <span style={{ fontSize: "13px", fontWeight: 800, color: TEXT, letterSpacing: "1px" }}>STENOGRAFT</span>
        </div>
        <div style={{ fontSize: "12px", color: TEXT2 }}>© 2026 STENOGRAFT — Plateforme souveraine française</div>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/connexion"       style={{ color: TEXT2, textDecoration: "none", fontSize: "12px" }}>Connexion</Link>
          <Link href="/inscription"      style={{ color: TEXT2, textDecoration: "none", fontSize: "12px" }}>Inscription</Link>
          <Link href="/mentions-legales" style={{ color: TEXT2, textDecoration: "none", fontSize: "12px" }}>Mentions légales</Link>
          <Link href="/cgu"              style={{ color: TEXT2, textDecoration: "none", fontSize: "12px" }}>CGU</Link>
        </div>
      </footer>

    </main>
  );
}
