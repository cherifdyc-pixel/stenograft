import Link from "next/link";

const SECTIONS = [
  {
    titre: "Éditeur",
    contenu: `STENOGRAFT\nForme juridique : SAS en cours de constitution\nSiège social : France\nEmail : contact@stenograft.fr\nDirecteur de la publication : Yahia Cherif`,
  },
  {
    titre: "Hébergement",
    contenu: `Vercel Inc.\n340 Pine Street, Suite 1500\nSan Francisco, CA 94104, États-Unis\nvercel.com\n\nBase de données : Supabase (région EU West — Irlande)`,
  },
  {
    titre: "Propriété intellectuelle",
    contenu: `L'ensemble du contenu de STENOGRAFT (design, code, vocabulaire, marque) est protégé par le droit de la propriété intellectuelle. Le nom STENOGRAFT, le vocabulaire associé (Graft, Grafter, Le Fil, Le Registre, Le Veilleur) ainsi que le logo sont des marques déposées ou en cours de dépôt à l'INPI.`,
  },
  {
    titre: "Données personnelles",
    contenu: `STENOGRAFT collecte uniquement les données nécessaires au fonctionnement du service : adresse email, nom d'utilisateur, contenu publié. Aucune donnée n'est vendue à des tiers. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données à l'adresse : contact@stenograft.fr`,
  },
  {
    titre: "Cookies",
    contenu: `STENOGRAFT utilise uniquement des cookies strictement nécessaires au fonctionnement du service (authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.`,
  },
];

export default function MentionsLegales() {
  return (
    <main style={{ background: "#000", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <Link href="/" style={{ color: "#E0492F", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>← Retour</Link>

        <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "24px 0 6px", letterSpacing: "-0.5px" }}>Mentions légales</h1>
        <p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>Dernière mise à jour : juin 2026</p>

        <div style={{ height: "1px", background: "linear-gradient(90deg,#E0492F40,transparent)", marginBottom: "40px" }} />

        {SECTIONS.map(({ titre, contenu }) => (
          <div key={titre} style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#E0492F", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{titre}</h2>
            <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.8, whiteSpace: "pre-line", margin: 0 }}>{contenu}</p>
          </div>
        ))}

        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #111", fontSize: "12px", color: "#333" }}>
          © 2026 STENOGRAFT — Plateforme souveraine française
        </div>
      </div>
    </main>
  );
}
