"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return count;
}

function useFadeIn(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function avatarGrad(hue: number) {
  return `linear-gradient(135deg, hsl(${hue},55%,18%) 0%, hsl(${(hue + 45) % 360},65%,38%) 100%)`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [countersActive, setCountersActive] = useState(false);
  const grafters    = useCountUp(12_847, 2000, countersActive);
  const grafts      = useCountUp(89_432, 2200, countersActive);
  const communautes = useCountUp(24,     1400, countersActive);

  const featuresRef = useFadeIn();
  const registreRef = useFadeIn();
  const proofRef    = useFadeIn();
  const ctaRef      = useFadeIn();

  useEffect(() => {
    const t = setTimeout(() => setCountersActive(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${BG}; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logo-pop {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 40px rgba(224,73,47,0.45), 0 0 0 0   rgba(224,73,47,0.3); }
          50%       { box-shadow: 0 8px 40px rgba(224,73,47,0.65), 0 0 0 14px rgba(224,73,47,0); }
        }
        @keyframes scroll-line {
          0%   { opacity: 0; transform: scaleY(0); transform-origin: top; }
          40%  { opacity: 1; }
          100% { opacity: 0; transform: scaleY(1); transform-origin: top; }
        }

        .h1 { animation: fade-up 0.65s ease both 0.05s; }
        .h2 { animation: fade-up 0.65s ease both 0.20s; }
        .h3 { animation: fade-up 0.65s ease both 0.35s; }
        .h4 { animation: fade-up 0.65s ease both 0.50s; }
        .h5 { animation: fade-up 0.65s ease both 0.65s; }
        .logo-anim { animation: logo-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) both 0s; }

        .fade-s  { transition: opacity 0.7s ease, transform 0.7s ease; }
        .fade-h  { opacity: 0; transform: translateY(28px); }
        .fade-v  { opacity: 1; transform: translateY(0); }

        .btn-red   { transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s; }
        .btn-red:hover   { opacity: .88; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(224,73,47,0.55) !important; }
        .btn-red:active  { transform: translateY(0); }
        .btn-ghost { transition: background 0.15s; }
        .btn-ghost:hover { background: rgba(255,255,255,0.06) !important; }

        .feat-card { transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease; }
        .feat-card:hover { transform: translateY(-3px); border-color: rgba(224,73,47,.35) !important; background: #0D0D0D !important; }

        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: ${TEXT} !important; }

        .footer-link { transition: color 0.15s; }
        .footer-link:hover { color: ${TEXT} !important; }

        .scroll-line { animation: scroll-line 1.8s ease-in-out infinite 1.5s; }

        @media (max-width: 640px) {
          .hero-btns { flex-direction: column; align-items: stretch; }
          .counters  { flex-direction: column; border-top: none !important; }
          .counter-item { border-right: none !important; border-bottom: 1px solid ${BORDER}; }
          .registre-grid { grid-template-columns: 1fr !important; }
          .footer-top { flex-direction: column; }
          .footer-bot { flex-direction: column; gap: 4px; }
        }
      `}</style>

      <main style={{ background: BG, minHeight: "100vh", fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif", color: TEXT, overflowX: "hidden" }}>

        {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: `${BG}D0`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}`, height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 900, color: "#fff", flexShrink: 0, boxShadow: `0 2px 10px ${RED}55` }}>S</div>
            <div>
              <div style={{ color: TEXT, fontSize: "13px", fontWeight: 900, letterSpacing: "1.2px", lineHeight: 1 }}>STENOGRAFT</div>
              <div style={{ color: GOLD, fontSize: "8px", fontWeight: 700, letterSpacing: "2.5px", opacity: 0.8, lineHeight: 1, marginTop: "2px" }}>SOUVERAIN</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link href="/connexion" className="nav-link" style={{ color: TEXT2, fontSize: "14px", fontWeight: 500, textDecoration: "none" }}>Connexion</Link>
            <Link href="/inscription" style={{ background: RED, color: "#fff", borderRadius: "8px", padding: "8px 18px", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: `0 2px 12px ${RED}44` }}>Rejoindre</Link>
          </div>
        </nav>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 24px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Background fx */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 90% 55% at 50% 100%, ${RED}14 0%, transparent 60%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, #1A1A1A 1px, transparent 1px)`, backgroundSize: "32px 32px", opacity: 0.3, pointerEvents: "none" }} />

          {/* Logo */}
          <div className="logo-anim" style={{ marginBottom: "28px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "22px", background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", fontWeight: 900, color: "#fff", margin: "0 auto", animation: "pulse-glow 3s ease-in-out infinite" }}>S</div>
          </div>

          {/* Badges */}
          <div className="h1" style={{ display: "flex", gap: "8px", marginBottom: "36px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              "🇫🇷 Hébergé en France",
              "🤖 Propulsé par Mistral",
              "🔒 Données souveraines",
            ].map(b => (
              <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "5px 14px", fontSize: "12px", fontWeight: 600, color: TEXT2, letterSpacing: "0.2px" }}>{b}</span>
            ))}
          </div>

          {/* Headline */}
          <h1 className="h2" style={{ fontSize: "clamp(44px, 9vw, 88px)", fontWeight: 900, letterSpacing: "-2.5px", lineHeight: 1.04, margin: "0 0 22px", maxWidth: "860px" }}>
            La parole{" "}
            <span style={{ background: `linear-gradient(95deg, ${TEXT} 0%, ${RED} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>est tenue.</span>
          </h1>

          {/* Subtitle */}
          <p className="h3" style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: TEXT2, maxWidth: "560px", lineHeight: 1.7, margin: "0 0 44px" }}>
            Le premier réseau social souverain français où chaque engagement devient un contrat public.
          </p>

          {/* CTA buttons */}
          <div className="h4 hero-btns" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginBottom: "72px" }}>
            <Link href="/inscription" className="btn-red" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: RED, color: "#fff", borderRadius: "100px", padding: "16px 36px", fontSize: "16px", fontWeight: 800, textDecoration: "none", boxShadow: `0 4px 32px ${RED}55`, letterSpacing: "0.2px" }}>
              Rejoindre STENOGRAFT
              <span style={{ fontSize: "18px" }}>→</span>
            </Link>
            <a href="#features" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "transparent", color: TEXT, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "16px 36px", fontSize: "16px", fontWeight: 600, textDecoration: "none" }}>
              En savoir plus
            </a>
          </div>

          {/* Counters */}
          <div className="h5 counters" style={{ display: "flex", borderTop: `1px solid ${BORDER}`, paddingTop: "36px", gap: "0", flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: "480px" }}>
            {[
              { val: grafters,    label: "Grafters"    },
              { val: grafts,      label: "Grafts"      },
              { val: communautes, label: "Communautés" },
            ].map((s, i) => (
              <div key={s.label} className="counter-item" style={{ flex: "1 1 130px", textAlign: "center", padding: "6px 20px", borderRight: i < 2 ? `1px solid ${BORDER}` : "none" }}>
                <div style={{ fontSize: "30px", fontWeight: 900, color: TEXT, letterSpacing: "-1.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fmt(s.val)}</div>
                <div style={{ fontSize: "13px", color: TEXT2, marginTop: "5px", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div style={{ position: "absolute", bottom: "36px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div className="scroll-line" style={{ width: "1px", height: "48px", background: `linear-gradient(to bottom, transparent, ${TEXT2})` }} />
          </div>
        </section>

        {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
        <section
          id="features"
          ref={featuresRef.ref as React.RefObject<HTMLElement>}
          className={`fade-s ${featuresRef.visible ? "fade-v" : "fade-h"}`}
          style={{ padding: "110px 24px", maxWidth: "1100px", margin: "0 auto" }}
        >
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <span style={{ display: "inline-block", background: `${RED}14`, border: `1px solid ${RED}30`, color: RED, borderRadius: "100px", padding: "5px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "18px" }}>Fonctionnalités</span>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 50px)", fontWeight: 900, letterSpacing: "-1px", margin: "0 0 16px", color: TEXT, lineHeight: 1.1 }}>Conçu pour la parole souveraine</h2>
            <p style={{ color: TEXT2, fontSize: "17px", maxWidth: "460px", margin: "0 auto", lineHeight: 1.65 }}>Trois piliers pour une expérience unique où vos mots ont du poids.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="feat-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "20px", padding: "32px", position: "relative", overflow: "hidden" }}>
                {f.badge && (
                  <div style={{ position: "absolute", top: "18px", right: "18px", background: `${GOLD}15`, border: `1px solid ${GOLD}35`, color: GOLD, fontSize: "10px", fontWeight: 800, letterSpacing: "1px", padding: "3px 10px", borderRadius: "100px" }}>{f.badge}</div>
                )}
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: `${f.color}14`, border: `1px solid ${f.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "22px" }}>{f.icon}</div>
                <h3 style={{ color: TEXT, fontSize: "22px", fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.3px" }}>{f.title}</h3>
                <p style={{ color: TEXT2, fontSize: "15px", lineHeight: 1.65, margin: "0 0 20px" }}>{f.desc}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
                  {f.items.map(it => (
                    <li key={it} style={{ display: "flex", alignItems: "center", gap: "9px", color: TEXT2, fontSize: "14px" }}>
                      <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: `${f.color}18`, border: `1px solid ${f.color}35`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: f.color, flexShrink: 0, fontWeight: 900 }}>✓</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ══ REGISTRE ════════════════════════════════════════════════════════ */}
        <section
          ref={registreRef.ref as React.RefObject<HTMLElement>}
          className={`fade-s ${registreRef.visible ? "fade-v" : "fade-h"}`}
          style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: "110px 24px" }}
        >
          <div className="registre-grid" style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
            {/* Text side */}
            <div>
              <span style={{ display: "inline-block", background: `${GOLD}14`, border: `1px solid ${GOLD}30`, color: GOLD, borderRadius: "100px", padding: "5px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "22px" }}>Le Registre</span>
              <h2 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.8px", margin: "0 0 18px", color: TEXT, lineHeight: 1.12 }}>
                La mémoire de<br />la République
              </h2>
              <p style={{ color: TEXT2, fontSize: "16px", lineHeight: 1.72, margin: "0 0 18px" }}>
                Chaque promesse d'élu, chaque engagement public, chaque vote est archivé dans Le Registre — accessible à tous, opposable à tous, pour toujours.
              </p>
              <p style={{ color: TEXT2, fontSize: "15px", lineHeight: 1.72, margin: "0 0 32px" }}>
                Plus aucune parole ne s'envole. STENOGRAFT transforme l'engagement en contrat public vérifiable.
              </p>
              <Link href="/inscription" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: GOLD, fontSize: "15px", fontWeight: 700, textDecoration: "none", borderBottom: `1px solid ${GOLD}50`, paddingBottom: "3px" }}>
                Consulter le Registre →
              </Link>
            </div>

            {/* Mockup */}
            <RegistreMockup />
          </div>
        </section>

        {/* ══ SOCIAL PROOF ════════════════════════════════════════════════════ */}
        <section
          ref={proofRef.ref as React.RefObject<HTMLElement>}
          className={`fade-s ${proofRef.visible ? "fade-v" : "fade-h"}`}
          style={{ padding: "110px 24px", textAlign: "center" }}
        >
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <span style={{ display: "inline-block", background: `${RED}14`, border: `1px solid ${RED}30`, color: RED, borderRadius: "100px", padding: "5px 16px", fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px" }}>Grafters Fondateurs</span>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 46px)", fontWeight: 900, letterSpacing: "-0.8px", margin: "0 0 16px", color: TEXT, lineHeight: 1.1 }}>
              Rejoignez les premiers<br />à prendre la parole
            </h2>
            <p style={{ color: TEXT2, fontSize: "17px", lineHeight: 1.65, margin: "0 0 44px" }}>
              Les Grafters Fondateurs bénéficient d'un badge exclusif et d'un accès prioritaire aux nouvelles fonctionnalités.
            </p>

            {/* Avatar stack */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "32px" }}>
              {FOUNDERS.map((u, i) => (
                <div
                  key={u.name}
                  title={u.name}
                  style={{ width: "46px", height: "46px", borderRadius: "50%", background: avatarGrad(u.hue), border: `2.5px solid ${BG}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", fontWeight: 800, marginLeft: i === 0 ? 0 : "-12px", zIndex: FOUNDERS.length - i, position: "relative", boxShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
                >{u.name[0]}</div>
              ))}
              <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: SURFACE, border: `2.5px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT2, fontSize: "11px", fontWeight: 800, marginLeft: "-12px", position: "relative", zIndex: 0 }}>
                +{fmt(grafters - FOUNDERS.length)}
              </div>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { icon: "🔒", label: "Données hébergées en France" },
                { icon: "🚫", label: "Zéro publicité ciblée"       },
                { icon: "🐙", label: "Open source & auditables"     },
              ].map(b => (
                <span key={b.label} style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "8px 18px", fontSize: "13px", color: TEXT2, fontWeight: 500 }}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ═══════════════════════════════════════════════════════ */}
        <section
          ref={ctaRef.ref as React.RefObject<HTMLElement>}
          className={`fade-s ${ctaRef.visible ? "fade-v" : "fade-h"}`}
          style={{ position: "relative", padding: "130px 24px", textAlign: "center", borderTop: `1px solid ${BORDER}`, overflow: "hidden", background: `radial-gradient(ellipse 80% 55% at 50% 100%, ${RED}18 0%, transparent 60%)` }}
        >
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, #1A1A1A 1px, transparent 1px)`, backgroundSize: "32px 32px", opacity: 0.22, pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: "680px", margin: "0 auto" }}>
            <div style={{ width: "68px", height: "68px", borderRadius: "20px", background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px", fontWeight: 900, color: "#fff", margin: "0 auto 28px", boxShadow: `0 8px 48px ${RED}55`, animation: "pulse-glow 3s ease-in-out infinite" }}>S</div>
            <h2 style={{ fontSize: "clamp(30px, 5.5vw, 56px)", fontWeight: 900, letterSpacing: "-1.2px", margin: "0 0 18px", color: TEXT, lineHeight: 1.1 }}>
              Grafter votre<br />première parole
            </h2>
            <p style={{ color: TEXT2, fontSize: "18px", lineHeight: 1.65, margin: "0 auto 44px", maxWidth: "440px" }}>
              Rejoignez STENOGRAFT et donnez du poids à vos mots. Gratuit, souverain, français.
            </p>
            <Link href="/inscription" className="btn-red" style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: RED, color: "#fff", borderRadius: "100px", padding: "20px 44px", fontSize: "18px", fontWeight: 800, textDecoration: "none", boxShadow: `0 8px 48px ${RED}55`, letterSpacing: "0.3px" }}>
              Créer mon compte gratuitement
              <span style={{ fontSize: "20px" }}>→</span>
            </Link>
            <p style={{ color: TEXT2, fontSize: "13px", marginTop: "18px", opacity: 0.55 }}>Aucune carte bancaire · Données hébergées en France · Gratuit pour toujours</p>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <footer style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: "48px 24px 32px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div className="footer-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px", marginBottom: "36px" }}>
              {/* Brand */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", fontWeight: 900, color: "#fff" }}>S</div>
                  <div>
                    <div style={{ color: TEXT, fontSize: "14px", fontWeight: 900, letterSpacing: "1.2px" }}>STENOGRAFT</div>
                    <div style={{ color: GOLD, fontSize: "9px", fontWeight: 700, letterSpacing: "2.5px", opacity: 0.8 }}>SOUVERAIN</div>
                  </div>
                </div>
                <p style={{ color: TEXT2, fontSize: "13px", maxWidth: "260px", lineHeight: 1.6 }}>Le réseau social souverain où la parole est tenue.</p>
              </div>
              {/* Links */}
              <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", alignItems: "center" }}>
                {["CGU", "Confidentialité", "Presse", "Contact"].map(l => (
                  <a key={l} href="#" className="footer-link" style={{ color: TEXT2, fontSize: "14px", textDecoration: "none" }}>{l}</a>
                ))}
              </div>
            </div>
            <div className="footer-bot" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <p style={{ color: TEXT2, fontSize: "13px" }}>© 2026 STENOGRAFT</p>
              <p style={{ color: TEXT2, fontSize: "13px", fontFamily: "monospace", letterSpacing: "0.8px" }}>Souverain · Français · Libre</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "📡", title: "Le Fil", color: "#1D9BF0", badge: null,
    desc: "Un flux temps réel de Grafts vérifiés. Chaque publication est horodatée, immuable, visible de tous. La transparence comme fondation.",
    items: ["Grafts horodatés & immuables", "Réponses publiques traçables", "Relays avec attribution"],
  },
  {
    icon: "🏛️", title: "Le Registre", color: GOLD, badge: "PHARE",
    desc: "La mémoire officielle de la République. Engagements d'élus, promesses publiques, votes — archivés, indexés, opposables.",
    items: ["Promesses archivées", "Votes indexés & opposables", "Accès citoyen permanent"],
  },
  {
    icon: "📰", title: "Le Veilleur", color: "#8B5CF6", badge: null,
    desc: "Flux d'actualités agrégé depuis Le Monde, France Info, Libération, enrichi par GDELT. L'information souveraine en temps réel.",
    items: ["3 sources majeures françaises", "GDELT événements mondiaux", "Filtrage par territoire"],
  },
];

const FOUNDERS = [
  { name: "Soraya M.", hue: 210 },
  { name: "Karim D.",  hue: 140 },
  { name: "Léa V.",    hue: 280 },
  { name: "Fouad K.",  hue:  35 },
  { name: "Priya F.",  hue: 330 },
  { name: "Adrien T.", hue:  70 },
];

// ── Registre Mockup ───────────────────────────────────────────────────────────

function RegistreMockup() {
  const ENTRIES = [
    {
      id: "REG-2026-0041", type: "Promesse", author: "M. Dupont",
      badge: "Député · Paris 3e", date: "12 jan. 2026",
      text: "Je m'engage à soumettre une loi sur la transparence des marchés publics avant le 30 juin 2026.",
      status: "EN COURS", statusColor: GOLD,
    },
    {
      id: "REG-2026-0038", type: "Vote", author: "Sénat",
      badge: "Institution", date: "8 jan. 2026",
      text: "Vote · Loi sur la souveraineté numérique. Résultat : 189 pour, 72 contre, 14 abstentions.",
      status: "ACTÉ", statusColor: "#2ECC71",
    },
  ];

  return (
    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "20px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
      {/* Window chrome */}
      <div style={{ background: "#050505", borderBottom: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
        {["#FF5F57", "#FFBD2E", "#28C840"].map(c => (
          <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
        ))}
        <span style={{ color: TEXT2, fontSize: "12px", marginLeft: "8px", fontFamily: "monospace", opacity: 0.6 }}>stenograft.fr/registre</span>
      </div>
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "18px" }}>🏛️</span>
        <div>
          <div style={{ color: TEXT, fontSize: "14px", fontWeight: 800 }}>Le Registre</div>
          <div style={{ color: TEXT2, fontSize: "11px" }}>2 entrées récentes · mis à jour il y a 3 min</div>
        </div>
      </div>
      {/* Entries */}
      {ENTRIES.map((e, i) => (
        <div key={e.id} style={{ padding: "16px", borderBottom: i === 0 ? `1px solid ${BORDER}` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "8px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ background: `${GOLD}14`, color: GOLD, border: `1px solid ${GOLD}30`, fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.5px" }}>{e.type}</span>
              <span style={{ color: TEXT2, fontSize: "10px", fontFamily: "monospace", opacity: 0.6 }}>{e.id}</span>
            </div>
            <span style={{ background: `${e.statusColor}14`, color: e.statusColor, border: `1px solid ${e.statusColor}30`, fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.5px", flexShrink: 0 }}>{e.status}</span>
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "center" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "12px", fontWeight: 900, flexShrink: 0 }}>{e.author[0]}</div>
            <div>
              <div style={{ color: TEXT, fontSize: "13px", fontWeight: 700, lineHeight: 1 }}>{e.author}</div>
              <div style={{ color: TEXT2, fontSize: "11px", marginTop: "2px" }}>{e.badge} · {e.date}</div>
            </div>
          </div>
          <p style={{ color: TEXT2, fontSize: "13px", lineHeight: 1.55, margin: 0 }}>{e.text}</p>
        </div>
      ))}
    </div>
  );
}
