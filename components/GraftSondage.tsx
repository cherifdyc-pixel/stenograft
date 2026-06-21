"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

type Sondage = {
  id: string;
  question: string;
  options: string[];
  duree_heures: number;
  created_at: string;
};

export default function GraftSondage({ graftId }: { graftId: string }) {
  const [sondage,  setSondage]  = useState<Sondage | null>(null);
  const [votes,    setVotes]    = useState<Record<number, number>>({});
  const [monVote,  setMonVote]  = useState<number | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: s } = await supabase
        .from("sondages")
        .select("*")
        .eq("graft_id", graftId)
        .maybeSingle();

      if (!s) { setLoading(false); return; }
      setSondage(s);

      const { data: v } = await supabase
        .from("votes_sondage")
        .select("option_index, user_id")
        .eq("sondage_id", s.id);

      const counts: Record<number, number> = {};
      v?.forEach(vote => {
        counts[vote.option_index] = (counts[vote.option_index] ?? 0) + 1;
        if (vote.user_id === user?.id) setMonVote(vote.option_index);
      });
      setVotes(counts);
      setLoading(false);
    };
    load();
  }, [graftId]);

  const voter = async (index: number) => {
    if (!userId || monVote !== null || !sondage) return;
    setMonVote(index);
    setVotes(prev => ({ ...prev, [index]: (prev[index] ?? 0) + 1 }));
    const res = await fetch("/api/sondage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sondage_id: sondage.id, option_index: index }),
    });
    if (!res.ok) {
      setMonVote(null);
      setVotes(prev => ({ ...prev, [index]: Math.max(0, (prev[index] ?? 1) - 1) }));
    }
  };

  if (loading || !sondage) return null;

  const total   = Object.values(votes).reduce((a, b) => a + b, 0);
  const expire  = new Date(new Date(sondage.created_at).getTime() + sondage.duree_heures * 3_600_000);
  const expired = new Date() > expire;

  return (
    <div style={{
      margin: "12px 0",
      background: "#0a0a0a",
      border: "1px solid #1a1a1a",
      borderRadius: "12px",
      padding: "16px",
    }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "#E7E9EA", marginBottom: "12px" }}>
        📊 {sondage.question}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sondage.options.map((opt, i) => {
          const count = votes[i] ?? 0;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          const voted = monVote === i;
          const show  = monVote !== null || expired;

          return (
            <button
              key={i}
              onClick={() => voter(i)}
              disabled={monVote !== null || expired}
              style={{
                position: "relative", overflow: "hidden",
                padding: "10px 14px", borderRadius: "8px",
                background: voted ? "#E0492F22" : "#111",
                border: voted ? "1px solid #E0492F44" : "1px solid #222",
                color: "#E7E9EA", textAlign: "left",
                cursor: monVote !== null || expired ? "default" : "pointer",
                fontSize: "14px", transition: "all 0.2s",
              }}
            >
              {show && (
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: voted ? "#E0492F15" : "#ffffff08",
                  transition: "width 0.5s ease",
                  borderRadius: "8px",
                }} />
              )}
              <span style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{opt}</span>
                {show && (
                  <span style={{ color: voted ? "#E0492F" : "#555", fontSize: "13px", fontWeight: voted ? 700 : 400 }}>
                    {pct}%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "10px", fontSize: "11px", color: "#555" }}>
        {total} vote{total > 1 ? "s" : ""} · {expired ? "Sondage terminé" : `Expire le ${expire.toLocaleDateString("fr-FR")}`}
      </div>
    </div>
  );
}
