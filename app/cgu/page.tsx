import Link from "next/link";

const SECTIONS = [
  {
    titre: "1. Objet",
    contenu: `STENOGRAFT est une plateforme de réseau social souverain française permettant à ses utilisateurs (les "Grafters") de publier des contenus (les "Grafts"), de suivre d'autres utilisateurs et de participer à des communautés (les "Territoires").`,
  },
  {
    titre: "2. Accès au service",
    contenu: `L'inscription est gratuite et ouverte à toute personne physique majeure. L'utilisateur s'engage à fournir des informations exactes lors de son inscription et à maintenir la confidentialité de ses identifiants.`,
  },
  {
    titre: "3. Règles de conduite",
    contenu: `Il est interdit de publier des contenus :\n— Illicites, diffamatoires ou injurieux\n— Incitant à la haine ou à la discrimination\n— Portant atteinte à la vie privée d'autrui\n— Contenant des informations personnelles d'un tiers sans son consentement\n— De nature commerciale non autorisée (spam)\n\nTout contenu en violation de ces règles pourra être supprimé sans préavis.`,
  },
  {
    titre: "4. Propriété des contenus",
    contenu: `L'utilisateur conserve la propriété intellectuelle de ses Grafts. En publiant sur STENOGRAFT, il accorde à la plateforme une licence non exclusive d'affichage et de diffusion dans le cadre du service.`,
  },
  {
    titre: "5. Signalement",
    contenu: `Tout utilisateur peut signaler un contenu inapproprié via le bouton de signalement. STENOGRAFT s'engage à traiter les signalements dans un délai raisonnable.`,
  },
  {
    titre: "6. Suspension et suppression",
    contenu: `STENOGRAFT se réserve le droit de suspendre ou supprimer tout compte en violation des présentes CGU, sans préavis ni indemnité.`,
  },
  {
    titre: "7. Limitation de responsabilité",
    contenu: `STENOGRAFT ne saurait être tenu responsable des contenus publiés par les utilisateurs. La plateforme agit en qualité d'hébergeur au sens de la loi pour la Confiance dans l'Économie Numérique (LCEN).`,
  },
  {
    titre: "8. Droit applicable",
    contenu: `Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.`,
  },
  {
    titre: "9. Contact",
    contenu: `Pour toute question : contact@stenograft.fr`,
  },
];

export default function CGU() {
  return (
    <main style={{ background: "#000", minHeight: "100vh", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <Link href="/" style={{ color: "#E0492F", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>← Retour</Link>

        <h1 style={{ fontSize: "28px", fontWeight: 900, margin: "24px 0 6px", letterSpacing: "-0.5px" }}>Conditions Générales d&apos;Utilisation</h1>
        <p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>En vigueur au 15 juillet 2026</p>

        <div style={{ height: "1px", background: "linear-gradient(90deg,#E0492F40,transparent)", marginBottom: "40px" }} />

        {SECTIONS.map(({ titre, contenu }) => (
          <div key={titre} style={{ marginBottom: "28px" }}>
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
