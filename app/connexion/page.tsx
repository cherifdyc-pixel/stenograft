"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Connexion() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={logoStyle}>S</div>
          <h1 style={{ color: "#ECEAE2", fontSize: "22px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            STENOGRAFT
          </h1>
          <p style={{ color: "#5A6076", fontSize: "14px", margin: 0 }}>
            Connectez-vous à votre compte
          </p>
        </div>

        <form style={{ display: "flex", flexDirection: "column", gap: "14px" }} onSubmit={handleSubmit} autoComplete="off">
          <Field label="Adresse e-mail">
            <input name="email" type="email" placeholder="Adresse email" required style={inputStyle} autoComplete="email" onFocus={onFocus} onBlur={onBlur} />
          </Field>

          <Field label="Mot de passe">
            <div style={{ position: "relative" }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                required
                style={{ ...inputStyle, paddingRight: "44px" }}
                autoComplete="current-password"
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#5A6076", fontSize: "18px", lineHeight: 1, padding: 0 }}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </Field>

          <div style={{ textAlign: "right" }}>
            <a href="/mot-de-passe-oublie" style={{ color: "#5A6076", fontSize: "13px", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E0492F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5A6076")}
            >
              Mot de passe oublié ?
            </a>
          </div>

          {error && (
            <p style={{ color: "#E0492F", fontSize: "13px", margin: 0, background: "rgba(224,73,47,0.08)", border: "1px solid rgba(224,73,47,0.2)", borderRadius: "8px", padding: "10px 12px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: "8px", background: loading ? "#7a2a1e" : "#E0492F", color: "#fff", border: "none", borderRadius: "12px", padding: "15px", fontSize: "16px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.2px", boxShadow: "0 4px 20px rgba(224,73,47,0.3)", transition: "opacity 0.15s, background 0.15s" }}
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#5A6076", fontSize: "13px", marginTop: "24px", marginBottom: 0 }}>
          Pas encore de compte ?{" "}
          <a href="/inscription" style={{ color: "#E0492F", textDecoration: "none", fontWeight: 600 }}>S&apos;inscrire</a>
        </p>
      </div>

      <p style={footerStyle}>🇫🇷 Hébergé en France · Propulsé par Mistral</p>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ color: "#878DA0", fontSize: "13px", fontWeight: 600, letterSpacing: "0.3px" }}>{label}</label>
      {children}
    </div>
  );
}

const mainStyle: React.CSSProperties = {
  background: "#13151E",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "system-ui, -apple-system, sans-serif",
  padding: "24px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  background: "#1A1D2B",
  border: "1px solid #252838",
  borderRadius: "20px",
  padding: "40px 36px",
  boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
};

const logoStyle: React.CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "14px",
  background: "#E0492F",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 800,
  color: "#fff",
  margin: "0 auto 16px",
  boxShadow: "0 4px 20px rgba(224,73,47,0.35)",
};

const footerStyle: React.CSSProperties = {
  color: "#2E3348",
  fontSize: "12px",
  fontFamily: "monospace",
  marginTop: "28px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#13151E",
  border: "1.5px solid #252838",
  borderRadius: "10px",
  padding: "13px 14px",
  color: "#ECEAE2",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

function onFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "#E0492F";
}

function onBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "#252838";
}
