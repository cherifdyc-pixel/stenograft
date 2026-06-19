export default function BadgeVerifie({ verified }: { verified?: boolean | null }) {
  if (!verified) return null;
  return (
    <span
      title="Compte vérifié STENOGRAFT"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "18px", height: "18px", borderRadius: "50%",
        background: "#E0492F", color: "#fff", fontSize: "11px",
        fontWeight: 800, flexShrink: 0, verticalAlign: "middle",
        boxShadow: "0 1px 6px rgba(224,73,47,0.45)",
      }}
    >
      ✓
    </span>
  );
}
