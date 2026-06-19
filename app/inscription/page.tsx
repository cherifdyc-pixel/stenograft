"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const RED = "#C8312A";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C96A";
const BG = "#0F1119";
const SURFACE = "#161926";
const BORDER = "#1F2436";

export default function Inscription() {
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: BG, border: `1px solid ${BORDER}`,
    borderRadius: "10px", padding: "13px 16px",
    color: "#ECEAE2", fontSize: "15px", outline: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px", justifyContent: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900, color: GOLD, boxShadow: `0 4px 16px rgba(200,49,42,0.4)`, border: `1px solid rgba(201,168,76,0.25)` }}>S</div>
          <div>
            <span style={{ color: "#ECEAE2", fontSize: "16px", fontWeight: 900, letterSpacing: "0.5px", display: "block" }}>STENOGRAFT</span>
            <span style={{ color: GOLD, fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.8 }}>Souverain</span>
          </div>
        </div>

        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${GOLD}`, borderRadius: "20px", padding: "32px", boxShadow: `0 24px 64px rgba(0,0,0,0.4)` }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>✉️</div>
              <h2 style={{ color: GOLD_LIGHT, fontSize: "18px", fontWeight: 900, margin: "0 0 10px" }}>Vérifie ta boîte mail</h2>
              <p style={{ color: "#5A6076", fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>Un lien de confirmation t'a été envoyé à <strong style={{ color: "#ECEAE2" }}>{form.email}</strong>.</p>
              <Link href="/connexion" style={{ color: GOLD, fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>← Retour à la connexion</Link>
            </div>
          ) : (
            <>
              <h1 style={{ color: "#ECEAE2", fontSize: "20px", fontWeight: 900, margin: "0 0 6px" }}>Rejoindre STENOGRAFT</h1>
              <p style={{ color: "#2A2F45", fontSize: "13px", margin: "0 0 28px" }}>Crée ton compte et prends la parole.</p>

              <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}30, transparent)`, marginBottom: "24px" }} />

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: "7px", opacity: 0.85 }}>Nom d'utilisateur</label>
                  <input value={form.username} onChange={set("username")} placeholder="Nom d'utilisateur" required style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: "7px", opacity: 0.85 }}>Email</label>
                  <input type="email" value={form.email} onChange={set("email")} placeholder="Adresse email" required style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", display: "block", marginBottom: "7px", opacity: 0.85 }}>Mot de passe</label>
                  <input type="password" value={form.password} onChange={set("password")} placeholder="Mot de passe (8 caractères minimum)" required minLength={8} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
                </div>

                {error && (
                  <div style={{ background: `${RED}15`, border: `1px solid ${RED}35`, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
                    <p style={{ color: RED, fontSize: "13px", fontWeight: 600, margin: 0 }}>{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ width: "100%", background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`, color: "#fff", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: "12px", padding: "14px", fontSize: "15px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: `0 4px 20px rgba(200,49,42,0.35)`, opacity: loading ? 0.7 : 1, transition: "opacity 0.15s" }}>
                  {loading ? "Création…" : "Créer mon compte"}
                </button>
              </form>

              <p style={{ color: "#2A2F45", fontSize: "13px", textAlign: "center", margin: "20px 0 0" }}>
                Déjà membre ?{" "}
                <Link href="/connexion" style={{ color: GOLD, fontWeight: 700, textDecoration: "none" }}>Se connecter</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
