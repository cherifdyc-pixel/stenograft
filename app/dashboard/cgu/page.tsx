import Link from "next/link";

const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const BORDER = "#1C1C1C";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

const SECTIONS = [
  {
    titre: "1. Objet",
    contenu: `STENOGRAFT est une plateforme de réseau social civique souverain française permettant à ses utilisateurs (les « Grafters ») de publier des contenus (les « Grafts »), de suivre d'autres utilisateurs, de participer à des communautés (les « Territoires ») et d'accéder à des outils médiatiques.

Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme accessible à l'adresse stenograft.fr.`,
  },
  {
    titre: "2. Accès au service",
    contenu: `L'inscription est gratuite et ouverte à toute personne physique majeure résidant en France ou à l'étranger. Les mineurs peuvent accéder au service sous réserve de l'accord préalable de leur représentant légal.

L'utilisateur s'engage à fournir des informations exactes et à jour lors de son inscription. Il est seul responsable de la confidentialité de ses identifiants de connexion. Tout accès au compte effectué avec ses identifiants est réputé effectué par l'utilisateur.`,
  },
  {
    titre: "3. Règles de conduite",
    contenu: `Il est interdit de publier des contenus :
— Illicites, diffamatoires, injurieux ou menaçants envers une personne ou un groupe
— Incitant à la haine, à la violence ou à la discrimination
— Portant atteinte à la vie privée, à l'image ou à la réputation d'autrui
— Contenant des données personnelles d'un tiers sans son consentement explicite
— De nature commerciale non autorisée, publicitaire ou de spam
— Contrefaisant des droits de propriété intellectuelle appartenant à des tiers
— Diffusant des informations manifestement fausses de nature à tromper les utilisateurs

STENOGRAFT adhère aux principes du débat démocratique respectueux et encourage la courtoisie entre Grafters.`,
  },
  {
    titre: "4. Propriété des contenus",
    contenu: `L'utilisateur conserve l'intégralité de la propriété intellectuelle de ses Grafts. En publiant sur STENOGRAFT, il accorde à la plateforme une licence mondiale, non exclusive, gratuite, pour la durée légale de protection des droits d'auteur, aux fins d'affichage, de diffusion et de reproduction dans le cadre du service.

Cette licence prend fin lors de la suppression du contenu par l'utilisateur ou de la fermeture de son compte.`,
  },
  {
    titre: "5. Signalement",
    contenu: `Tout utilisateur peut signaler un contenu inapproprié via le bouton de signalement disponible sur chaque Graft. STENOGRAFT s'engage à examiner tout signalement dans un délai raisonnable et à y apporter une réponse adaptée conformément à la législation française.

STENOGRAFT agit en qualité d'hébergeur au sens de la loi pour la Confiance dans l'Économie Numérique (LCEN) du 21 juin 2004.`,
  },
  {
    titre: "6. Modération et sanctions",
    contenu: `En cas de violation des présentes CGU, STENOGRAFT se réserve le droit de, selon la gravité des faits :
— Supprimer le contenu en infraction
— Adresser un avertissement à l'utilisateur
— Suspendre temporairement le compte
— Supprimer définitivement le compte sans préavis ni indemnité

Ces décisions peuvent faire l'objet d'une contestation par email à contact@stenograft.fr.`,
  },
  {
    titre: "7. Disponibilité du service",
    contenu: `STENOGRAFT s'efforce d'assurer la disponibilité du service 24h/24 et 7j/7. Des interruptions ponctuelles peuvent survenir pour maintenance ou pour des raisons techniques indépendantes de notre volonté. STENOGRAFT ne saurait être tenu responsable des préjudices résultant d'une interruption de service.`,
  },
  {
    titre: "8. Limitation de responsabilité",
    contenu: `STENOGRAFT ne saurait être tenu responsable des contenus publiés par les utilisateurs, ni des dommages directs ou indirects résultant de l'utilisation de la plateforme. La responsabilité de STENOGRAFT est strictement limitée à ce que permet le droit français applicable aux hébergeurs de contenu.`,
  },
  {
    titre: "9. Évolution des CGU",
    contenu: `STENOGRAFT se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par notification sur la plateforme. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles CGU.`,
  },
  {
    titre: "10. Droit applicable et juridiction",
    contenu: `Les présentes CGU sont régies exclusivement par le droit français. En cas de litige relatif à l'interprétation ou à l'exécution des présentes, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux compétents du ressort du siège social de STENOGRAFT seront seuls compétents.`,
  },
  {
    titre: "11. Contact",
    contenu: `Pour toute question relative aux présentes CGU :
Email : contact@stenograft.fr
Adresse : STENOGRAFT SAS — France`,
  },
];

export default function CGUPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px 80px", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>S</div>
          <span style={{ color: TEXT, fontSize: "13px", fontWeight: 700, letterSpacing: "1px" }}>STENOGRAFT</span>
        </div>
        <h1 style={{ color: TEXT, fontSize: "26px", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
          Conditions Générales d&apos;Utilisation
        </h1>
        <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>En vigueur au 1er juillet 2026 · Version 1.0</p>
      </div>

      {/* Intro */}
      <div style={{ background: `${RED}0D`, border: `1px solid ${RED}25`, borderRadius: "12px", padding: "14px 16px", marginBottom: "32px" }}>
        <p style={{ color: TEXT2, fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
          En accédant à STENOGRAFT et en créant un compte, vous acceptez sans réserve les présentes conditions. Lisez-les attentivement avant d'utiliser le service.
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map(({ titre, contenu }) => (
        <div key={titre} style={{ marginBottom: "28px" }}>
          <h2 style={{ color: RED, fontSize: "12px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>{titre}</h2>
          <p style={{ color: TEXT2, fontSize: "14px", lineHeight: 1.8, whiteSpace: "pre-line", margin: 0 }}>{contenu}</p>
        </div>
      ))}

      {/* Footer */}
      <div style={{ marginTop: "48px", paddingTop: "20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>© 2026 STENOGRAFT — Plateforme souveraine française</p>
        <Link href="/dashboard/confidentialite" style={{ color: GOLD, fontSize: "12px", textDecoration: "none", fontWeight: 600 }}>
          Politique de confidentialité →
        </Link>
      </div>
    </div>
  );
}
