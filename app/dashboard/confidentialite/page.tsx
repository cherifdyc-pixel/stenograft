import Link from "next/link";

const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const BORDER = "#1C1C1C";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

const SECTIONS = [
  {
    titre: "1. Responsable du traitement",
    contenu: `STENOGRAFT SAS, société française dont le siège est situé en France, est le responsable du traitement de vos données personnelles au sens du Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et de la loi Informatique et Libertés du 6 janvier 1978 modifiée.

Contact : privacy@stenograft.fr`,
  },
  {
    titre: "2. Données collectées",
    contenu: `Nous collectons uniquement les données nécessaires au fonctionnement du service :

Données d'inscription : adresse email, nom d'utilisateur, mot de passe (haché, jamais lisible en clair).

Données de profil (optionnelles) : nom affiché, biographie, ville, site web, photo de profil, bannière.

Données d'usage : contenus publiés (Grafts), abonnements, favoris, votes, signalements, messages privés.

Données techniques : adresse IP (anonymisée après 30 jours), logs de connexion, type de navigateur — collectés automatiquement à des fins de sécurité et de stabilité du service.

Nous ne collectons pas de données de géolocalisation précise, de données biométriques ni de données relatives à la santé.`,
  },
  {
    titre: "3. Finalités et bases légales",
    contenu: `Vos données sont traitées pour les finalités suivantes :

— Fourniture du service (base légale : exécution du contrat)
— Sécurité et lutte contre les abus (base légale : intérêt légitime)
— Conformité aux obligations légales — signalements, LCEN (base légale : obligation légale)
— Amélioration du service via des statistiques agrégées anonymisées (base légale : intérêt légitime)

Nous ne traitons pas vos données à des fins de profilage publicitaire.`,
  },
  {
    titre: "4. Hébergement souverain — données en France",
    contenu: `L'intégralité des données des utilisateurs est hébergée sur des serveurs situés en France et au sein de l'Union européenne.

STENOGRAFT utilise Supabase (infrastructure hébergée en Europe) pour la base de données et le stockage des fichiers. Aucun transfert de données vers des pays tiers hors EEE n'est effectué sans les garanties appropriées au sens du RGPD.`,
  },
  {
    titre: "5. Partage et communication des données",
    contenu: `Nous ne vendons, ne louons et ne communiquons jamais vos données personnelles à des tiers à des fins commerciales.

Vos données peuvent être communiquées :
— À nos sous-traitants techniques (hébergeur, prestataire de paiement Stripe pour les Super Chats) dans le strict cadre de la prestation de service et sous accord de traitement de données (DPA)
— Aux autorités compétentes sur réquisition judiciaire ou légale

Stripe traite les paiements en mode pseudonymisé : STENOGRAFT ne stocke jamais vos coordonnées bancaires.`,
  },
  {
    titre: "6. Durée de conservation",
    contenu: `Données de compte : conservées pendant toute la durée de l'inscription, puis supprimées dans les 30 jours suivant la clôture du compte.

Contenus publiés (Grafts) : supprimés à la fermeture du compte, sauf obligation légale de conservation.

Logs techniques : anonymisés sous 30 jours, supprimés sous 12 mois.

Messages privés : supprimés à la fermeture des deux comptes concernés ou sur demande explicite.`,
  },
  {
    titre: "7. Vos droits (RGPD)",
    contenu: `Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :

Droit d'accès : obtenir une copie de vos données personnelles.
Droit de rectification : corriger des données inexactes.
Droit à l'effacement (« droit à l'oubli ») : demander la suppression de vos données.
Droit à la portabilité : recevoir vos données dans un format structuré et lisible.
Droit d'opposition : vous opposer à un traitement basé sur l'intérêt légitime.
Droit à la limitation : restreindre temporairement le traitement de vos données.

Pour exercer ces droits : privacy@stenograft.fr

Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr) si vous estimez que vos droits ne sont pas respectés.`,
  },
  {
    titre: "8. Cookies et traceurs",
    contenu: `STENOGRAFT utilise des cookies strictement nécessaires au fonctionnement du service (authentification, session) et des cookies de performance anonymes (statistiques d'usage agrégées).

Aucun cookie publicitaire ou de suivi inter-sites n'est déposé sur votre terminal.

Vous pouvez gérer vos préférences via les paramètres de votre navigateur.`,
  },
  {
    titre: "9. Sécurité",
    contenu: `STENOGRAFT met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération :
— Chiffrement des communications (HTTPS/TLS)
— Mots de passe hachés (bcrypt)
— Clés API et tokens stockés en variables d'environnement sécurisées (non exposées côté client)
— Accès aux données restreint au personnel autorisé
— Politique RLS (Row Level Security) sur l'intégralité de la base de données`,
  },
  {
    titre: "10. Mineurs",
    contenu: `STENOGRAFT est destiné aux personnes majeures. Si vous avez connaissance qu'un mineur a créé un compte sans accord parental, vous pouvez nous en informer à privacy@stenograft.fr. Nous procéderons à la suppression du compte dans les meilleurs délais.`,
  },
  {
    titre: "11. Modifications",
    contenu: `Nous nous réservons le droit de modifier la présente politique à tout moment. Toute modification substantielle fera l'objet d'une notification sur la plateforme. La date de dernière mise à jour est indiquée en tête de document.`,
  },
  {
    titre: "12. Contact — Délégué à la Protection des Données",
    contenu: `Pour toute question relative à la protection de vos données personnelles :

Email : privacy@stenograft.fr
Courrier : STENOGRAFT SAS — DPO — France

Nous nous engageons à répondre à toute demande dans un délai maximum de 30 jours.`,
  },
];

export default function ConfidentialitePage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px 80px", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: "32px", paddingBottom: "24px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>S</div>
          <span style={{ color: "#E7E9EA", fontSize: "13px", fontWeight: 700, letterSpacing: "1px" }}>STENOGRAFT</span>
        </div>
        <h1 style={{ color: "#E7E9EA", fontSize: "26px", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
          Politique de Confidentialité
        </h1>
        <p style={{ color: "#71767B", fontSize: "13px", margin: 0 }}>En vigueur au 1er juillet 2026 · Conforme RGPD (UE 2016/679)</p>
      </div>

      {/* Engagement RGPD */}
      <div style={{ background: `${GOLD}0D`, border: `1px solid ${GOLD}30`, borderRadius: "12px", padding: "14px 16px", marginBottom: "32px" }}>
        <p style={{ color: TEXT2, fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: GOLD }}>Notre engagement :</strong> vos données restent en France, ne sont jamais revendues, et vous en conservez le contrôle total. STENOGRAFT est conçu dès la conception pour protéger votre vie privée (<em>Privacy by Design</em>).
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map(({ titre, contenu }) => (
        <div key={titre} style={{ marginBottom: "28px" }}>
          <h2 style={{ color: RED, fontSize: "12px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", margin: "0 0 8px" }}>{titre}</h2>
          <p style={{ color: TEXT2, fontSize: "14px", lineHeight: 1.8, whiteSpace: "pre-line", margin: 0 }}>{contenu}</p>
        </div>
      ))}

      {/* CNIL */}
      <div style={{ background: "#0A0A0A", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", marginTop: "32px", marginBottom: "16px" }}>
        <p style={{ color: TEXT2, fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
          Autorité de contrôle française :{" "}
          <strong style={{ color: TEXT }}>Commission Nationale de l'Informatique et des Libertés (CNIL)</strong>
          <br />
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: RED, textDecoration: "none" }}>www.cnil.fr</a>
          {" "}· 3 Place de Fontenoy, 75007 Paris · Tél : 01 53 73 22 22
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>© 2026 STENOGRAFT — Données hébergées en France 🇫🇷</p>
        <Link href="/dashboard/cgu" style={{ color: GOLD, fontSize: "12px", textDecoration: "none", fontWeight: 600 }}>
          ← Conditions d'utilisation
        </Link>
      </div>
    </div>
  );
}
