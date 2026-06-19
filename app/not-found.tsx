import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ background: "#000", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <div style={{ fontSize: "96px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, marginBottom: "8px", letterSpacing: "-4px" }}>
          404
        </div>
        <div style={{ fontSize: "11px", color: "#E0492F", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "20px" }}>
          Graft introuvable
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.4px" }}>
          Cette parole n&apos;existe pas.
        </h1>
        <p style={{ color: "#555", fontSize: "15px", lineHeight: 1.75, marginBottom: "40px", margin: "0 0 40px" }}>
          Le graft que vous cherchez a peut-être été supprimé, ou n&apos;a jamais été grafté.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard" style={{ padding: "12px 28px", borderRadius: "100px", background: "#E0492F", color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 16px rgba(224,73,47,0.4)" }}>
            Retour au Fil
          </Link>
          <Link href="/" style={{ padding: "12px 28px", borderRadius: "100px", border: "1px solid #1C1C1C", color: "#71767B", textDecoration: "none", fontSize: "14px" }}>
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
