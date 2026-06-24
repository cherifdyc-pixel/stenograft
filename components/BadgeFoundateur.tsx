export default function BadgeFoundateur({ isFounder }: { isFounder?: boolean | null }) {
  if (!isFounder) return null;
  return (
    <span
      title="Parmi les 1 000 premiers Grafters"
      style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "2px 9px", borderRadius: "100px",
        background: "linear-gradient(135deg,#C9A24B18 0%,#FFD70018 100%)",
        border: "1px solid #C9A24B55",
        color: "#C9A24B", fontSize: "11px", fontWeight: 700,
        letterSpacing: "0.04em", flexShrink: 0,
        boxShadow: "0 0 8px #C9A24B22",
      }}
    >
      ⭐ Fondateur
    </span>
  );
}
