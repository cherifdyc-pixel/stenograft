"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const GOLD = "#C9A24B";

export default function FavoriButton({ graftId }: { graftId: string }) {
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);
  const togglingRef = useRef(false);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("favoris")
        .select("id")
        .eq("user_id", user.id)
        .eq("graft_id", graftId)
        .maybeSingle();
      setSaved(!!data);
      setLoading(false);
    };
    check();
  }, [graftId]);

  const toggle = async () => {
    if (togglingRef.current) return;
    togglingRef.current = true;
    const prev = saved;
    setSaved(!prev);
    const res = await fetch("/api/favoris", {
      method: prev ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graft_id: graftId }),
    });
    if (!res.ok) setSaved(prev);
    togglingRef.current = false;
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      title={saved ? "Retirer des favoris" : "Sauvegarder"}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: "16px", padding: "6px 8px", lineHeight: 1,
        color: saved ? GOLD : "#444",
        transition: "color 0.15s",
      }}
    >
      🔖
    </button>
  );
}
