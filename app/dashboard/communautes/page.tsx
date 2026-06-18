"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const RED = "#E0492F";
const GOLD = "#C9A24B";
const GOLD_LIGHT = "#E8D07A";
const BG = "#000000";
const SURFACE = "#0D0D0D";
const BORDER = "#1C1C1C";

const MY_COMMUNITIES_KEY = "sg_my_communities";

type Community = {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

function loadMyIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(MY_COMMUNITIES_KEY) ?? "[]"));
  } catch { return new Set(); }
}

function saveMyIds(ids: Set<string>) {
  localStorage.setItem(MY_COMMUNITIES_KEY, JSON.stringify([...ids]));
}

export default function CommunautesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => { setMyIds(loadMyIds()); }, []);

  const fetchCommunities = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });
    setCommunities(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  const handleJoin = (id: string) => {
    const next = new Set([...myIds, id]);
    setMyIds(next);
    saveMyIds(next);
  };

  const handleLeave = (id: string) => {
    const next = new Set([...myIds].filter(x => x !== id));
    setMyIds(next);
    saveMyIds(next);
  };

  const handleCreated = (c: Community) => {
    setCommunities((prev) => [c, ...prev]);
    handleJoin(c.id);
  };

  const mine = communities.filter(c => myIds.has(c.id));
  const discover = communities.filter(c => !myIds.has(c.id));

  return (
    <div style={{ padding: "44px 52px", maxWidth: "760px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div>
          <h1 style={{ color: "#F0F0F0", fontSize: "22px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.3px" }}>Communautés</h1>
          <p style={{ color: "#3A3A3A", fontSize: "13px", margin: 0 }}>Rejoins ou crée une communauté</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
            color: "#fff", border: `1px solid rgba(201,168,76,0.2)`,
            borderRadius: "12px", padding: "12px 22px",
            fontSize: "14px", fontWeight: 800, cursor: "pointer",
            boxShadow: `0 4px 20px rgba(224,73,47,0.4)`,
          }}
        >
          + Créer
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#3A3A3A", fontSize: "14px" }}>Chargement…</p>
      ) : (
        <>
          {/* Mes communautés */}
          <Section label="Mes communautés" gold>
            {mine.length === 0 ? (
              <EmptySection text="Tu n'as rejoint aucune communauté." />
            ) : (
              mine.map(c => (
                <CommunityCard key={c.id} c={c} joined onLeave={() => handleLeave(c.id)} />
              ))
            )}
          </Section>

          {/* Découvrir */}
          {discover.length > 0 && (
            <div style={{ marginTop: "36px" }}>
              <Section label="Découvrir">
                {discover.map(c => (
                  <CommunityCard key={c.id} c={c} joined={false} onJoin={() => handleJoin(c.id)} />
                ))}
              </Section>
            </div>
          )}

          {/* Vide total */}
          {communities.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "48px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "18px", border: `1px dashed ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: "#1C1C1C" }}>◈</div>
              <p style={{ color: "#3A3A3A", fontSize: "15px", fontWeight: 600, margin: 0 }}>Aucune communauté pour l'instant</p>
              <p style={{ color: "#1C1C1C", fontSize: "13px", margin: 0, textAlign: "center", maxWidth: "260px", lineHeight: 1.6 }}>Sois le premier à en créer une.</p>
              <button onClick={() => setCreateOpen(true)} style={{
                marginTop: "8px",
                background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
                color: "#fff", border: `1px solid rgba(201,168,76,0.2)`,
                borderRadius: "10px", padding: "10px 22px",
                fontSize: "14px", fontWeight: 700, cursor: "pointer",
                boxShadow: `0 4px 16px rgba(224,73,47,0.3)`,
              }}>
                Créer une communauté
              </button>
            </div>
          )}
        </>
      )}

      {createOpen && (
        <CreateCommunityModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function Section({ label, children, gold }: { label: string; children: React.ReactNode; gold?: boolean }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <h2 style={{ color: gold ? GOLD : "#888888", fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>
          {label}
        </h2>
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${gold ? GOLD : BORDER}30 0%, transparent 100%)` }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{children}</div>
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div style={{ background: SURFACE, border: `1px dashed ${BORDER}`, borderRadius: "14px", padding: "24px", textAlign: "center" }}>
      <p style={{ color: "#3A3A3A", fontSize: "13px", margin: 0 }}>{text}</p>
    </div>
  );
}

function CommunityCard({ c, joined, onJoin, onLeave }: { c: Community; joined: boolean; onJoin?: () => void; onLeave?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const initials = c.name.slice(0, 2).toUpperCase();
  const date = new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: SURFACE,
        border: `1px solid ${hovered ? (joined ? GOLD + "50" : RED + "50") : BORDER}`,
        borderRadius: "16px", padding: "18px 20px",
        display: "flex", alignItems: "center", gap: "16px",
        transition: "border-color 0.15s",
      }}
    >
      <div style={{
        width: "46px", height: "46px", borderRadius: "12px", flexShrink: 0,
        background: joined
          ? `linear-gradient(135deg, ${GOLD}25 0%, ${RED}15 100%)`
          : `linear-gradient(135deg, ${RED}18 0%, #8B1A1515 100%)`,
        border: `1.5px solid ${joined ? GOLD + "35" : RED + "25"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: joined ? GOLD_LIGHT : "#888888",
        fontSize: "15px", fontWeight: 900,
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
          <p style={{ color: "#F0F0F0", fontSize: "15px", fontWeight: 700, margin: 0 }}>{c.name}</p>
          {joined && (
            <span style={{ background: `${GOLD}18`, color: GOLD, fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", letterSpacing: "0.5px" }}>
              MEMBRE
            </span>
          )}
        </div>
        {c.description && (
          <p style={{ color: "#888888", fontSize: "13px", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</p>
        )}
        <p style={{ color: "#3A3A3A", fontSize: "12px", margin: 0 }}>Créée le {date}</p>
      </div>

      {joined ? (
        <button
          onClick={onLeave}
          style={{ background: "transparent", color: "#888888", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0, transition: "border-color 0.15s, color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#888888"; }}
        >
          Quitter
        </button>
      ) : (
        <button
          onClick={onJoin}
          style={{ background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`, color: "#fff", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0, boxShadow: `0 2px 10px rgba(224,73,47,0.3)` }}
        >
          Rejoindre
        </button>
      )}
    </div>
  );
}

function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Community) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("communities")
      .insert({ name: name.trim(), description: desc.trim() || null })
      .select()
      .single();
    setLoading(false);
    if (err) {
      setError(`Erreur : ${err.message}`);
      return;
    }
    onCreated(data as Community);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${GOLD}`, borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "480px", boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.06)` }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h2 style={{ color: "#F0F0F0", fontSize: "18px", fontWeight: 900, margin: "0 0 4px" }}>Nouvelle communauté</h2>
            <p style={{ color: "#3A3A3A", fontSize: "13px", margin: 0 }}>Crée un espace pour ta communauté</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#888888", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}>×</button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: GOLD, fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "8px", opacity: 0.8 }}>Nom *</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="Ex: Développeurs francophones"
            style={{ width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 14px", color: "#F0F0F0", fontSize: "15px", outline: "none", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box", transition: "border-color 0.15s" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = `${GOLD}60`)}
            onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ color: "#888888", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            Description <span style={{ color: "#3A3A3A" }}>(optionnel)</span>
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value.slice(0, 200))}
            placeholder="De quoi parle cette communauté ?"
            rows={3}
            style={{ width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 14px", color: "#F0F0F0", fontSize: "14px", outline: "none", resize: "none", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box", lineHeight: 1.6 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = `${GOLD}60`)}
            onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>

        {error && <p style={{ color: RED, fontSize: "12px", fontWeight: 600, margin: "0 0 14px" }}>{error}</p>}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", color: "#888888", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            style={{
              background: !name.trim() ? "#1C1C1C" : `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
              color: !name.trim() ? "#3A3A3A" : "#fff",
              border: `1px solid ${!name.trim() ? "transparent" : "rgba(201,168,76,0.2)"}`,
              borderRadius: "10px", padding: "10px 22px",
              fontSize: "14px", fontWeight: 800,
              cursor: name.trim() && !loading ? "pointer" : "not-allowed",
              boxShadow: name.trim() ? `0 4px 16px rgba(224,73,47,0.3)` : "none",
              transition: "all 0.15s",
            }}
          >
            {loading ? "Création…" : "Créer la communauté"}
          </button>
        </div>
      </div>
    </div>
  );
}
