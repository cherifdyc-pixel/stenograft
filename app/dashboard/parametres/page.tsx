"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

const RED = "#E0492F";
const GOLD = "#C9A24B";
const GOLD_LIGHT = "#E8D07A";
const BG = "#000000";
const SURFACE = "#0D0D0D";
const BORDER = "#1C1C1C";

type Status = { type: "success" | "error"; message: string } | null;

export default function ParametresPage() {
  const [user, setUser] = useState<{ email: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? "",
          username: data.user.user_metadata?.username ?? data.user.user_metadata?.full_name ?? "",
        });
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "44px 52px" }}>
        <p style={{ color: "#3A3A3A", fontSize: "14px" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "44px 52px", maxWidth: "640px" }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <h1 style={{ color: "#F0F0F0", fontSize: "22px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
          Paramètres
        </h1>
        <p style={{ color: "#3A3A3A", fontSize: "13px", margin: 0 }}>
          Gérez votre compte et vos informations
        </p>
      </div>

      <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}40, transparent)`, marginBottom: "36px" }} />

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Section
          icon="✦"
          title="Nom d'affichage"
          description="Visible par tous les membres de la communauté"
          accentColor={GOLD}
        >
          <NomForm currentUsername={user?.username ?? ""} />
        </Section>

        <Section
          icon="✉"
          title="Adresse email"
          description="Un email de confirmation sera envoyé à la nouvelle adresse"
          accentColor={RED}
        >
          <EmailForm currentEmail={user?.email ?? ""} />
        </Section>

        <Section
          icon="⬡"
          title="Mot de passe"
          description="Choisissez un mot de passe fort d'au moins 8 caractères"
          accentColor={RED}
        >
          <PasswordForm />
        </Section>

        <Section
          icon="◑"
          title="Apparence"
          description="Basculer entre le mode sombre et le mode clair"
          accentColor={GOLD}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
            <ThemeToggle />
            <span style={{ color: "#3A3A3A", fontSize: "13px" }}>Mode sombre / clair</span>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, title, description, accentColor, children }: {
  icon: string; title: string; description: string; accentColor: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: SURFACE,
      border: `1px solid ${open ? accentColor + "35" : BORDER}`,
      borderLeft: `3px solid ${open ? accentColor : BORDER}`,
      borderRadius: "16px",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", background: "transparent", border: "none",
          padding: "20px 24px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "16px", textAlign: "left",
        }}
      >
        <div style={{
          width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
          background: open ? `${accentColor}20` : BORDER,
          border: `1px solid ${open ? accentColor + "40" : "transparent"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: open ? accentColor : "#3A3A3A", fontSize: "15px",
          transition: "all 0.2s",
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: open ? "#F0F0F0" : "#888888", fontSize: "15px", fontWeight: 700, margin: "0 0 2px", transition: "color 0.15s" }}>{title}</p>
          <p style={{ color: "#3A3A3A", fontSize: "12px", margin: 0 }}>{description}</p>
        </div>
        <span style={{
          color: open ? accentColor : "#3A3A3A", fontSize: "13px",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s, color 0.15s", display: "inline-block",
        }}>▾</span>
      </button>

      {/* Form */}
      {open && (
        <div style={{ padding: "0 24px 24px", borderTop: `1px solid ${accentColor}18` }}>
          <div style={{ height: "20px" }} />
          {children}
        </div>
      )}
    </div>
  );
}

function NomForm({ currentUsername }: { currentUsername: string }) {
  const [username, setUsername] = useState(currentUsername);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || username === currentUsername) return;
    setLoading(true);
    setStatus(null);
    const { error } = await createClient().auth.updateUser({
      data: { username: username.trim() },
    });
    setLoading(false);
    setStatus(error
      ? { type: "error", message: error.message }
      : { type: "success", message: "Nom d'affichage mis à jour." }
    );
  };

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Nouveau nom d'affichage"
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
        onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
      />
      <SaveButton onClick={handleSave} loading={loading} disabled={!username.trim() || username === currentUsername} color={GOLD} />
      {status && <StatusBadge status={status} />}
    </div>
  );
}

function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!email.trim() || email === currentEmail) return;
    setLoading(true);
    setStatus(null);
    const { error } = await createClient().auth.updateUser({ email: email.trim() });
    setLoading(false);
    setStatus(error
      ? { type: "error", message: error.message }
      : { type: "success", message: "Email mis à jour. Vérifie ta boîte mail." }
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Nouvelle adresse email"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
          onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        />
        <SaveButton onClick={handleSave} loading={loading} disabled={!email.trim() || email === currentEmail} color={RED} />
      </div>
      {status && <StatusBadge status={status} />}
    </div>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const valid = form.next.length >= 8 && form.next === form.confirm;

  const handleSave = async () => {
    if (!valid) return;
    setLoading(true);
    setStatus(null);
    const { error } = await createClient().auth.updateUser({ password: form.next });
    setLoading(false);
    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: "Mot de passe mis à jour avec succès." });
      setForm({ current: "", next: "", confirm: "" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <input
        type="password"
        value={form.next}
        onChange={set("next")}
        placeholder="Nouveau mot de passe"
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
        onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
      />
      <input
        type="password"
        value={form.confirm}
        onChange={set("confirm")}
        placeholder="Confirmer le mot de passe"
        style={{
          ...inputStyle,
          borderColor: form.confirm && form.confirm !== form.next ? `${RED}80` : BORDER,
        }}
        onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
        onBlur={e => (e.currentTarget.style.borderColor = form.confirm && form.confirm !== form.next ? `${RED}80` : BORDER)}
      />
      {form.confirm && form.confirm !== form.next && (
        <p style={{ color: RED, fontSize: "12px", margin: 0, fontWeight: 600 }}>Les mots de passe ne correspondent pas.</p>
      )}
      {form.next.length > 0 && form.next.length < 8 && (
        <p style={{ color: "#888888", fontSize: "12px", margin: 0 }}>{8 - form.next.length} caractère(s) manquant(s)</p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
        <SaveButton onClick={handleSave} loading={loading} disabled={!valid} color={RED} label="Changer le mot de passe" />
      </div>
      {status && <StatusBadge status={status} />}
    </div>
  );
}

function SaveButton({ onClick, loading, disabled, color, label = "Sauvegarder" }: {
  onClick: () => void; loading: boolean; disabled: boolean; color: string; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: disabled ? "#1C1C1C" : `linear-gradient(135deg, ${color} 0%, ${color}BB 100%)`,
        color: disabled ? "#3A3A3A" : "#fff",
        border: `1px solid ${disabled ? "transparent" : color + "40"}`,
        borderRadius: "10px", padding: "11px 18px",
        fontSize: "13px", fontWeight: 800,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        whiteSpace: "nowrap", flexShrink: 0,
        boxShadow: disabled ? "none" : `0 4px 14px ${color}30`,
        transition: "all 0.15s",
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (!status) return null;
  const ok = status.type === "success";
  return (
    <div style={{
      background: ok ? `${GOLD}12` : `${RED}12`,
      border: `1px solid ${ok ? GOLD : RED}30`,
      borderRadius: "8px", padding: "9px 14px",
    }}>
      <p style={{ color: ok ? GOLD_LIGHT : RED, fontSize: "12px", fontWeight: 600, margin: 0 }}>
        {ok ? "✓ " : "✕ "}{status.message}
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: BG, border: `1px solid ${BORDER}`,
  borderRadius: "10px", padding: "11px 14px",
  color: "#F0F0F0", fontSize: "14px", outline: "none",
  fontFamily: "system-ui, -apple-system, sans-serif",
  boxSizing: "border-box", transition: "border-color 0.15s", minWidth: 0,
};
