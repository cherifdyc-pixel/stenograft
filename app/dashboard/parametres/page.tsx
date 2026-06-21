"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";
const GREEN   = "#2ECC71";

type Status = { type: "success" | "error"; message: string } | null;

// ── Primitives ────────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
  width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px",
  padding: "11px 14px", color: TEXT, fontSize: "14px", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s",
};

function StatusBanner({ status, onDismiss }: { status: Status; onDismiss?: () => void }) {
  if (!status) return null;
  const ok = status.type === "success";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", background: ok ? `${GREEN}12` : `${RED}12`, border: `1px solid ${ok ? GREEN : RED}30`, borderRadius: "10px", padding: "10px 14px", marginTop: "12px" }}>
      <span style={{ color: ok ? GREEN : RED, fontSize: "14px" }}>{ok ? "✓" : "✕"}</span>
      <p style={{ color: ok ? GREEN : RED, fontSize: "13px", fontWeight: 600, margin: 0, flex: 1 }}>{status.message}</p>
      {onDismiss && <button onClick={onDismiss} style={{ background: "none", border: "none", color: TEXT2, cursor: "pointer", fontSize: "16px", padding: 0 }}>×</button>}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ width: "44px", height: "24px", borderRadius: "12px", background: on ? RED : BORDER, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0 }}
    >
      <span style={{ position: "absolute", top: "3px", left: on ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
    </button>
  );
}

function SectionCard({ icon, title, children, accent = GOLD }: { icon: string; title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${accent}20`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>{icon}</div>
        <span style={{ color: TEXT, fontSize: "14px", fontWeight: 800 }}>{title}</span>
      </div>
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
      <div>
        <div style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ color: TEXT2, fontSize: "11px", marginTop: "2px" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

// ── Compte ────────────────────────────────────────────────────────────────────

function UsernameForm({ current }: { current: string }) {
  const [val, setVal] = useState(current);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!val.trim() || val === current) return;
    setLoading(true); setStatus(null);
    const sb = createClient();
    const { data: { user }, error } = await sb.auth.updateUser({ data: { username: val.trim() } });
    if (error) { setStatus({ type: "error", message: error.message }); setLoading(false); return; }
    if (user) await sb.from("profiles").update({ username: val.trim() }).eq("id", user.id);
    setLoading(false);
    setStatus({ type: "success", message: "Nom d'affichage mis à jour." });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={val} onChange={e => setVal(e.target.value)} placeholder="Nom d'affichage" style={inputSt} onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
        <button onClick={save} disabled={!val.trim() || val === current || loading} style={{ padding: "11px 16px", borderRadius: "10px", background: val.trim() && val !== current ? GOLD : BORDER, color: val.trim() && val !== current ? "#000" : TEXT3, border: "none", fontWeight: 800, fontSize: "13px", cursor: val.trim() && val !== current ? "pointer" : "not-allowed", flexShrink: 0, transition: "all 0.15s" }}>
          {loading ? "…" : "OK"}
        </button>
      </div>
      <StatusBanner status={status} onDismiss={() => setStatus(null)} />
    </div>
  );
}

function EmailForm({ current }: { current: string }) {
  const [val, setVal] = useState(current);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!val.trim() || val === current) return;
    setLoading(true); setStatus(null);
    const { error } = await createClient().auth.updateUser({ email: val.trim() });
    setLoading(false);
    setStatus(error ? { type: "error", message: error.message } : { type: "success", message: "Vérifie ta boîte mail pour confirmer." });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input type="email" value={val} onChange={e => setVal(e.target.value)} placeholder="Adresse email" style={inputSt} onFocus={e => (e.currentTarget.style.borderColor = RED)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
        <button onClick={save} disabled={!val.trim() || val === current || loading} style={{ padding: "11px 16px", borderRadius: "10px", background: val.trim() && val !== current ? RED : BORDER, color: "#fff", border: "none", fontWeight: 800, fontSize: "13px", cursor: val.trim() && val !== current ? "pointer" : "not-allowed", flexShrink: 0, transition: "all 0.15s" }}>
          {loading ? "…" : "OK"}
        </button>
      </div>
      <StatusBanner status={status} onDismiss={() => setStatus(null)} />
    </div>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ next: "", confirm: "" });
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const valid = form.next.length >= 8 && form.next === form.confirm;

  const save = async () => {
    if (!valid) return;
    setLoading(true); setStatus(null);
    const { error } = await createClient().auth.updateUser({ password: form.next });
    setLoading(false);
    if (error) { setStatus({ type: "error", message: error.message }); }
    else { setStatus({ type: "success", message: "Mot de passe mis à jour." }); setForm({ next: "", confirm: "" }); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} value={form.next} onChange={set("next")} placeholder="Nouveau mot de passe (min. 8 car.)" style={{ ...inputSt, paddingRight: "40px" }} onFocus={e => (e.currentTarget.style.borderColor = RED)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
        <button onClick={() => setShow(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: TEXT2, cursor: "pointer", fontSize: "14px" }}>{show ? "🙈" : "👁"}</button>
      </div>
      <input type={show ? "text" : "password"} value={form.confirm} onChange={set("confirm")} placeholder="Confirmer le mot de passe" style={{ ...inputSt, borderColor: form.confirm && form.confirm !== form.next ? `${RED}80` : BORDER }} onFocus={e => (e.currentTarget.style.borderColor = RED)} onBlur={e => (e.currentTarget.style.borderColor = form.confirm && form.confirm !== form.next ? `${RED}80` : BORDER)} />
      {form.next.length > 0 && form.next.length < 8 && (
        <p style={{ color: TEXT2, fontSize: "11px", margin: 0 }}>{8 - form.next.length} caractère(s) restant(s)</p>
      )}
      {form.confirm && form.next !== form.confirm && (
        <p style={{ color: RED, fontSize: "11px", margin: 0, fontWeight: 600 }}>Les mots de passe ne correspondent pas.</p>
      )}
      <button onClick={save} disabled={!valid || loading} style={{ padding: "11px 16px", borderRadius: "10px", background: valid ? RED : BORDER, color: "#fff", border: "none", fontWeight: 800, fontSize: "13px", cursor: valid ? "pointer" : "not-allowed", transition: "all 0.15s", marginTop: "4px" }}>
        {loading ? "Mise à jour…" : "Changer le mot de passe"}
      </button>
      <StatusBanner status={status} onDismiss={() => setStatus(null)} />
    </div>
  );
}

// ── Danger zone ───────────────────────────────────────────────────────────────

function DangerZone({ onLogout }: { onLogout: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const handleDelete = async () => {
    if (input !== "SUPPRIMER") return;
    setDeleting(true);
    const res = await fetch("/api/delete-account", { method: "DELETE" });
    const json = await res.json();
    setDeleting(false);
    if (!res.ok) setStatus({ type: "error", message: json.error ?? "Contacte le support pour supprimer ton compte." });
    else onLogout();
  };

  return (
    <div style={{ background: SURFACE, border: `1px solid ${RED}30`, borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${RED}20`, display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${RED}20`, border: `1px solid ${RED}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>⚠️</div>
        <span style={{ color: RED, fontSize: "14px", fontWeight: 800 }}>Zone de danger</span>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <div style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>Supprimer mon compte</div>
            <div style={{ color: TEXT2, fontSize: "11px", marginTop: "2px" }}>Action irréversible — toutes tes données seront perdues</div>
          </div>
          <button onClick={() => setConfirm(true)} style={{ padding: "8px 14px", borderRadius: "8px", background: `${RED}15`, color: RED, border: `1px solid ${RED}30`, fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            Supprimer
          </button>
        </div>

        {confirm && (
          <div style={{ marginTop: "14px", padding: "14px", background: `${RED}08`, border: `1px solid ${RED}20`, borderRadius: "10px" }}>
            <p style={{ color: TEXT, fontSize: "13px", margin: "0 0 10px" }}>Tape <strong style={{ color: RED }}>SUPPRIMER</strong> pour confirmer :</p>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="SUPPRIMER" style={{ ...inputSt, borderColor: `${RED}40`, marginBottom: "10px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setConfirm(false); setInput(""); }} style={{ flex: 1, padding: "9px", borderRadius: "8px", background: "transparent", color: TEXT2, border: `1px solid ${BORDER}`, fontSize: "13px", cursor: "pointer" }}>Annuler</button>
              <button onClick={handleDelete} disabled={input !== "SUPPRIMER" || deleting} style={{ flex: 1, padding: "9px", borderRadius: "8px", background: input === "SUPPRIMER" ? RED : BORDER, color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: input === "SUPPRIMER" ? "pointer" : "not-allowed" }}>
                {deleting ? "…" : "Confirmer"}
              </button>
            </div>
            <StatusBanner status={status} onDismiss={() => setStatus(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const NOTIF_PREFS = [
  { key: "notif_follow",   label: "Nouveaux abonnés",     desc: "Quand quelqu'un te suit" },
  { key: "notif_reply",    label: "Réponses à mes grafts", desc: "Quand on répond à tes grafts" },
  { key: "notif_relay",    label: "Relays",                desc: "Quand on relaye tes grafts" },
  { key: "notif_approve",  label: "Approbations",          desc: "Quand on approuve tes grafts" },
  { key: "notif_mention",  label: "Mentions",              desc: "Quand on te mentionne" },
];

const PRIVACY_PREFS = [
  { key: "priv_private",   label: "Compte privé",            desc: "Seuls tes abonnés voient tes grafts" },
  { key: "priv_dm_all",    label: "Messages de tous",        desc: "Tout le monde peut t'envoyer un message" },
  { key: "priv_index",     label: "Apparaître dans la recherche", desc: "Ton profil est indexé dans la recherche" },
];

export default function ParametresPage() {
  const router  = useRouter();
  const [user,  setUser]  = useState<{ email: string; username: string } | null>(null);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    notif_follow: true, notif_reply: true, notif_relay: true, notif_approve: true, notif_mention: true,
    priv_private: false, priv_dm_all: true, priv_index: true,
  });
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ email: data.user.email ?? "", username: data.user.user_metadata?.username ?? data.user.email?.split("@")[0] ?? "" });
        const saved = localStorage.getItem("steno_prefs");
        if (saved) { try { setPrefs(p => ({ ...p, ...JSON.parse(saved) })); } catch {} }
      }
      setLoading(false);
    });
  }, []);

  const togglePref = useCallback((key: string, val: boolean) => {
    setPrefs(p => {
      const next = { ...p, [key]: val };
      localStorage.setItem("steno_prefs", JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/");
  };

  const SECTIONS = [
    { key: "compte",         icon: "👤", label: "Compte"              },
    { key: "notifs",         icon: "🔔", label: "Notifications"       },
    { key: "confidentialite",icon: "🔒", label: "Confidentialité"     },
    { key: "securite",       icon: "🛡️", label: "Sécurité"            },
    { key: "apparence",      icon: "🎨", label: "Apparence"           },
    { key: "apropos",        icon: "ℹ️",  label: "À propos"           },
  ];

  if (loading) return (
    <div style={{ padding: "60px 20px", textAlign: "center", color: TEXT2, fontFamily: "'Inter',system-ui,sans-serif" }}>Chargement…</div>
  );

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          {section ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
              <button onClick={() => setSection(null)} style={{ background: "none", border: "none", color: TEXT, fontSize: "20px", cursor: "pointer", padding: "4px", display: "flex" }}>‹</button>
              <h1 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: TEXT }}>
                {SECTIONS.find(s => s.key === section)?.icon} {SECTIONS.find(s => s.key === section)?.label}
              </h1>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${GOLD}20`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>⚙️</div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Paramètres</h1>
            </div>
          )}
        </div>

        {/* ── Menu principal ── */}
        {!section && (
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>

            {/* Profil rapide */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: `linear-gradient(135deg,${RED}80 0%,${GOLD}40 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "18px", fontWeight: 900, flexShrink: 0 }}>
                {(user?.username ?? "?")[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: TEXT, fontWeight: 700, fontSize: "15px" }}>{user?.username}</div>
                <div style={{ color: TEXT2, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
              </div>
              <Link href="/dashboard/profil" style={{ color: RED, fontSize: "12px", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>Mon profil →</Link>
            </div>

            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setSection(s.key)} style={{ width: "100%", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px", textAlign: "left", transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                onMouseLeave={e => (e.currentTarget.style.background = SURFACE)}
              >
                <span style={{ fontSize: "18px", width: "24px", textAlign: "center" }}>{s.icon}</span>
                <span style={{ flex: 1, color: TEXT, fontSize: "14px", fontWeight: 500 }}>{s.label}</span>
                <span style={{ color: TEXT2, fontSize: "16px" }}>›</span>
              </button>
            ))}

            {/* Déconnexion */}
            <button onClick={logout} style={{ width: "100%", marginTop: "8px", padding: "14px 16px", borderRadius: "12px", background: "transparent", border: `1px solid ${BORDER}`, color: TEXT2, fontSize: "14px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; }}
            >
              Se déconnecter
            </button>
          </div>
        )}

        {/* ── Compte ── */}
        {section === "compte" && (
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <SectionCard icon="✦" title="Nom d'affichage" accent={GOLD}>
              <UsernameForm current={user?.username ?? ""} />
            </SectionCard>
            <SectionCard icon="✉️" title="Adresse email" accent={RED}>
              <EmailForm current={user?.email ?? ""} />
            </SectionCard>
            <SectionCard icon="🔗" title="Mon profil public" accent={GOLD}>
              <Link href="/dashboard/profil" style={{ display: "flex", alignItems: "center", gap: "8px", color: RED, fontSize: "13px", fontWeight: 700, textDecoration: "none", padding: "4px 0" }}>
                Voir et modifier mon identité complète →
              </Link>
            </SectionCard>
          </div>
        )}

        {/* ── Notifications ── */}
        {section === "notifs" && (
          <div style={{ padding: "12px 16px" }}>
            <SectionCard icon="🔔" title="Préférences de notifications" accent={RED}>
              {NOTIF_PREFS.map((p, i) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "11px 0", borderBottom: i < NOTIF_PREFS.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <div>
                    <div style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>{p.label}</div>
                    <div style={{ color: TEXT2, fontSize: "11px", marginTop: "2px" }}>{p.desc}</div>
                  </div>
                  <Toggle on={prefs[p.key]} onChange={v => togglePref(p.key, v)} />
                </div>
              ))}
            </SectionCard>
          </div>
        )}

        {/* ── Confidentialité ── */}
        {section === "confidentialite" && (
          <div style={{ padding: "12px 16px" }}>
            <SectionCard icon="🔒" title="Confidentialité" accent={GOLD}>
              {PRIVACY_PREFS.map((p, i) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "11px 0", borderBottom: i < PRIVACY_PREFS.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <div>
                    <div style={{ color: TEXT, fontSize: "13px", fontWeight: 600 }}>{p.label}</div>
                    <div style={{ color: TEXT2, fontSize: "11px", marginTop: "2px" }}>{p.desc}</div>
                  </div>
                  <Toggle on={prefs[p.key]} onChange={v => togglePref(p.key, v)} />
                </div>
              ))}
            </SectionCard>
            <div style={{ marginTop: "12px" }}>
              <DangerZone onLogout={logout} />
            </div>
          </div>
        )}

        {/* ── Sécurité ── */}
        {section === "securite" && (
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <SectionCard icon="🔑" title="Changer le mot de passe" accent={RED}>
              <PasswordForm />
            </SectionCard>
            <SectionCard icon="📱" title="Authentification à deux facteurs" accent={GOLD}>
              <div style={{ padding: "8px 0" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `${TEXT3}20`, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "5px 12px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: TEXT3, display: "inline-block" }} />
                  <span style={{ color: TEXT2, fontSize: "12px", fontWeight: 600 }}>Bientôt disponible</span>
                </div>
              </div>
            </SectionCard>
            <SectionCard icon="📋" title="Sessions actives" accent={GOLD}>
              <div style={{ color: TEXT2, fontSize: "13px", padding: "4px 0" }}>Session actuelle — {typeof window !== "undefined" ? navigator.userAgent.split(" ").slice(-1)[0] : "Navigateur"}</div>
            </SectionCard>
          </div>
        )}

        {/* ── Apparence ── */}
        {section === "apparence" && (
          <div style={{ padding: "12px 16px" }}>
            <SectionCard icon="🎨" title="Apparence" accent={GOLD}>
              <SettingRow label="Thème AMOLED" desc="Fond 100% noir pour les écrans OLED">
                <Toggle on={true} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="Réduire les animations" desc="Pour les appareils moins puissants">
                <Toggle on={prefs["reduce_motion"] ?? false} onChange={v => togglePref("reduce_motion", v)} />
              </SettingRow>
              <SettingRow label="Taille du texte" desc="Ajuste la lisibilité">
                <div style={{ display: "flex", gap: "6px" }}>
                  {["S", "M", "L"].map(sz => (
                    <button key={sz} onClick={() => togglePref("font_size_" + sz, true)} style={{ width: "32px", height: "32px", borderRadius: "8px", background: prefs["font_size_" + sz] ? GOLD : SURFACE, color: prefs["font_size_" + sz] ? "#000" : TEXT2, border: `1px solid ${prefs["font_size_" + sz] ? GOLD : BORDER}`, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{sz}</button>
                  ))}
                </div>
              </SettingRow>
            </SectionCard>
          </div>
        )}

        {/* ── À propos ── */}
        {section === "apropos" && (
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ padding: "24px", textAlign: "center" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: `linear-gradient(135deg,${RED} 0%,${GOLD} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", margin: "0 auto 12px" }}>🇫🇷</div>
                <div style={{ color: TEXT, fontSize: "18px", fontWeight: 900, letterSpacing: "-0.3px" }}>STENOGRAFT</div>
                <div style={{ color: TEXT2, fontSize: "12px", marginTop: "4px" }}>Version 1.0 · Le réseau social souverain français</div>
              </div>
            </div>

            {[
              { label: "Mentions légales",        href: "/mentions-legales" },
              { label: "Conditions d'utilisation", href: "/cgu" },
              { label: "Politique de confidentialité", href: "/confidentialite" },
              { label: "Charte communautaire",    href: "/charte" },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "12px", textDecoration: "none", color: TEXT, fontSize: "14px" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                onMouseLeave={e => (e.currentTarget.style.background = SURFACE)}
              >
                {item.label} <span style={{ color: TEXT2 }}>›</span>
              </Link>
            ))}

            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <p style={{ color: TEXT3, fontSize: "11px", margin: 0 }}>© 2026 Stenograft — stenograft.fr</p>
              <p style={{ color: TEXT3, fontSize: "11px", margin: "4px 0 0" }}>Hébergé en France 🇫🇷 · Données souveraines</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
