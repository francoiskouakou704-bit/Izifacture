import type { Tone } from './ui/tones'

// Contenu de la landing page : tous les textes au même endroit, les composants ne font que l'afficher.
// Pour modifier un titre, une carte ou une question, c'est ici.

export const ROUTES = { login: '/login', signup: '/signup' } as const

export const brand = {
  name: 'iziFacture',
  initials: 'iF',
  region: 'Afrique',
}

export const nav = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Pourquoi nous', href: '#problemes' },
  { label: 'Témoignages', href: '#temoignages' },
  { label: 'FAQ', href: '#faq' },
]

export const cta = {
  login: 'Se connecter',
  start: 'Commencer gratuitement',
  demo: 'Voir la démo',
}

export const hero = {
  announcement: 'Fini la galère sur Word et Excel',
  title: ['Fini les factures bricolées', 'sur Word et Excel.'],
  // Les segments `strong` sont mis en gras
  subtitle: [
    { text: 'La solution de facturation tout-en-un conçue pour les entrepreneurs africains : facturez en ' },
    { text: 'FCFA', strong: true },
    { text: ', appliquez automatiquement la ' },
    { text: 'TVA 18%', strong: true },
    { text: ' et encaissez plus vite.' },
  ],
  socialProof: 'Déjà adopté par plus de 2 500 PME et freelances en Afrique de l’Ouest',
  paymentBrands: [
    { name: 'Wave Business', dot: 'bg-blue-500' },
    { name: 'Orange Money', dot: 'bg-orange-500' },
    { name: 'MTN MoMo', dot: 'bg-yellow-500' },
    { name: 'Moov Money', dot: 'bg-emerald-600' },
  ],
}

export const mockup = {
  floating: [
    { tone: 'emerald', symbol: '✓', label: 'Transfert reçu', value: '+ 1 180 000 FCFA', detail: 'Payé via Wave CI' },
    { tone: 'blue', symbol: '18%', label: 'Régime fiscal UEMOA', value: 'TVA 18% conforme', detail: 'Calcul automatique' },
  ] satisfies { tone: Tone; symbol: string; label: string; value: string; detail: string }[],
  windowTitle: 'Tableau de bord — Entreprise SA (Abidjan)',
  currency: 'Devise : FCFA (XOF)',
  live: 'En direct',
  metrics: [
    { label: 'Total encaissé (mois en cours)', value: '4 850 000 FCFA', note: '↑ +24% vs mois dernier', valueClass: 'text-ink', noteClass: 'text-emerald-600' },
    { label: 'En attente de règlement', value: '1 200 000 FCFA', note: '2 factures envoyées', valueClass: 'text-amber-600', noteClass: 'text-slate-500' },
    { label: 'TVA 18% collectée', value: '873 000 FCFA', note: 'Prêt pour déclaration', valueClass: 'text-ink', noteClass: 'text-blue-600' },
  ],
  invoice: {
    reference: 'Aperçu facture #FAC-2025-084',
    title: 'Prestation Conseil & Stratégie Digitale',
    client: 'Client : Groupe Horizon SARL • Dakar, Sénégal',
    status: 'Payé via Orange Money',
    lines: [
      { label: 'Honoraires mensuels prestation digitale', amount: '1 000 000 FCFA' },
      { label: 'TVA applicable (taux légal 18%)', amount: '180 000 FCFA', badge: 'Auto' },
    ],
    totalLabel: 'Total TTC à payer',
    total: '1 180 000 FCFA',
    paymentsLabel: 'Moyens acceptés :',
    payments: 'Wave • Orange Money • Virement BICICI',
    receipt: 'Télécharger le reçu PDF officiel →',
  },
}

export const problems = {
  eyebrow: 'Les méthodes d’hier',
  title: 'Pourquoi abandonner vos vieilles méthodes ?',
  subtitle:
    'La gestion artisanale sur tableurs fait perdre du temps, décrédibilise votre entreprise et fragilise votre trésorerie au quotidien.',
  items: [
    {
      tone: 'rose',
      symbol: '✕',
      title: 'Factures non professionnelles & perte de crédibilité',
      text: 'Fichiers Word déformés, police aléatoire, absence des mentions légales locales requises. Les grands comptes et multinationales hésitent à valider vos bons de commande et retiennent vos paiements.',
      impact: 'Image dégradée auprès des donneurs d’ordres',
    },
    {
      tone: 'amber',
      symbol: '%',
      title: 'Calculs manuels et erreurs récurrentes de TVA',
      text: 'Erreurs de calcul sur la TVA à 18%, arrondis mal gérés, acomptes oubliés et confusions entre montants HT et TTC. Vous vous exposez à des redressements fiscaux et à des régularisations douloureuses.',
      impact: 'Risques fiscaux et litiges avec la comptabilité',
    },
    {
      tone: 'purple',
      symbol: '⌛',
      title: 'Suivi des paiements impossible & impayés récurrents',
      text: 'Relances manuelles sans cesse reportées par gêne ou oubli, justificatifs de virements ou Mobile Money éparpillés dans WhatsApp. Votre trésorerie stagne dans le flou complet.',
      impact: 'Retards de trésorerie moyens de 45 jours',
    },
  ] satisfies { tone: Tone; symbol: string; title: string; text: string; impact: string }[],
}

export const features = {
  eyebrow: 'Simplicité & Puissance',
  title: 'Tout ce dont vous avez besoin pour gérer votre business',
  subtitle: 'Une plateforme pensée spécifiquement pour le contexte économique et les usages de l’Afrique francophone.',
  items: [
    {
      tone: 'blue',
      symbol: '⚡',
      eyebrow: 'Création ultra-rapide',
      title: 'Factures professionnelles en 2 clics',
      text: 'Modèles haut de gamme personnalisés avec votre logo et vos mentions légales locales (RCCM, NIF, DFE). Génération de PDF haute définition propre et partage immédiat par WhatsApp ou email.',
      highlight: '📄 Générateur PDF instantané',
      highlightNote: '100% Conforme',
    },
    {
      tone: 'emerald',
      symbol: '18%',
      eyebrow: 'Fiscalité locale',
      title: 'TVA 18% calculée automatiquement',
      text: 'Fini les calculs à la calculatrice. Indiquez vos montants et la plateforme gère avec exactitude la TVA à 18%, les exonérations spécifiques (BTP, export, ONG) ainsi que les acomptes perçus.',
      highlight: '🧮 Bascule HT / TTC instantanée',
      highlightNote: 'Zéro erreur fiscale',
    },
    {
      tone: 'amber',
      symbol: '🔔',
      eyebrow: 'Trésorerie & Encaissement',
      title: 'Suivi des paiements en temps réel',
      text: 'Alertes instantanées dès qu’une facture est consultée par votre client. Relances automatiques douces et polies par WhatsApp et email pour les échéances dépassées.',
      highlight: '📲 Rappels automatisés WhatsApp',
      highlightNote: 'Payé 2x plus vite',
    },
    {
      tone: 'indigo',
      symbol: '👥',
      eyebrow: 'CRM léger',
      title: 'Gestion de clients intégrée',
      text: 'Répertoire centralisé de tous vos clients. Consultez en un coup d’œil l’historique de facturation, les devis signés, les règlements en retard et le chiffre d’affaires généré par chaque partenaire.',
      highlight: '📊 Historique complet & Solde',
      highlightNote: 'Vue 360°',
    },
  ] satisfies { tone: Tone; symbol: string; eyebrow: string; title: string; text: string; highlight: string; highlightNote: string }[],
}

export const stats = [
  { value: '100%', label: 'Conforme FCFA & UEMOA', text: 'Gestion des devises XOF et XAF native' },
  { value: '18%', label: 'TVA automatique', text: 'Calculée selon les règles légales en vigueur' },
  { value: '2x plus rapide', label: 'Délai d’encaissement', text: 'Grâce aux relances automatisées et QR code de paiement' },
]

export const testimonials = {
  eyebrow: 'Avis clients',
  title: 'Ils ont simplifié leur facturation',
  items: [
    {
      quote:
        'Avant iziFacture, je passais mes dimanches soirs à me battre avec mes tableaux Excel et à calculer la TVA pour mes clients à Dakar. Aujourd’hui, mes factures partent en 2 minutes et mes clients me disent qu’elles sont ultra professionnelles.',
      name: 'Mamadou Kane',
      role: 'Fondateur Agence Tech & Com — Dakar, Sénégal',
      initials: 'MK',
      avatar: 'bg-blue-600',
    },
    {
      quote:
        'Le suivi des paiements Wave et Orange Money a tout changé pour notre cabinet de conseil. Nous savons exactement qui a réglé et la TVA 18% est directement ventilée pour notre expert-comptable à Abidjan. Un vrai gain de temps !',
      name: 'Aïcha Bamba',
      role: 'Directrice Générale, Bamba Consulting — Abidjan, Côte d’Ivoire',
      initials: 'AB',
      avatar: 'bg-emerald-600',
    },
  ],
}

export const faq = {
  eyebrow: 'Questions fréquentes',
  title: 'Tout ce que vous devez savoir',
  items: [
    {
      question: 'Est-ce adapté si mon entreprise n’est pas assujettie à la TVA ?',
      answer:
        'Absolument. Vous pouvez activer ou désactiver la TVA 18% en un clic. La mention légale d’exonération appropriée sera automatiquement inscrite en bas de votre facture conformément au Code Général des Impôts local.',
    },
    {
      question: 'Puis-je facturer à la fois en XOF (UEMOA) et en XAF (CEMAC) ?',
      answer:
        'Oui, iziFacture prend en charge les francs CFA d’Afrique de l’Ouest (XOF) et d’Afrique Centrale (XAF), ainsi que l’Euro et le Dollar pour vos clients internationaux.',
    },
    {
      question: 'Comment envoyer ma facture par WhatsApp ?',
      answer:
        'D’un simple clic sur le bouton « Partager sur WhatsApp », un lien sécurisé et un résumé élégant sont pré-remplis. Votre client peut télécharger son PDF propre et voir vos coordonnées de paiement Mobile Money en un instant.',
    },
  ],
}

export const finalCta = {
  badge: 'Démarrage instantané en 30 secondes',
  title: 'Prêt à moderniser votre facturation dès aujourd’hui ?',
  subtitle: 'Rejoignez les milliers d’entrepreneurs africains qui gagnent du temps et renforcent leur image avec iziFacture.',
  button: 'Créer ma première facture gratuitement',
  note: 'Sans carte bancaire • Configuration en 2 minutes',
}

export const footer = {
  tagline: 'Le logiciel de facturation simple, rapide et conforme pour les professionnels, PME et indépendants en Afrique.',
  columns: [
    {
      title: 'Produit',
      links: [
        { label: 'Facturation FCFA', href: '#fonctionnalites' },
        { label: 'Calculateur TVA 18%', href: '#fonctionnalites' },
        { label: 'Relances WhatsApp', href: '#fonctionnalites' },
        { label: 'Reçus Mobile Money', href: '#fonctionnalites' },
      ],
    },
    {
      title: 'Territoires',
      links: [
        { label: 'Côte d’Ivoire (Abidjan)' },
        { label: 'Sénégal (Dakar)' },
        { label: 'Bénin, Togo, Cameroun' },
        { label: 'Zone UEMOA & CEMAC' },
      ],
    },
    {
      title: 'Support & Légal',
      links: [
        { label: 'Conditions générales', href: '#' },
        { label: 'Politique de confidentialité', href: '#' },
        { label: 'Sécurité des données', href: '#' },
        { label: 'support@izifacture.com', href: 'mailto:support@izifacture.com' },
      ],
    },
  ] as { title: string; links: { label: string; href?: string }[] }[],
  copyright: `© ${new Date().getFullYear()} iziFacture. Tous droits réservés.`,
  notice: 'Optimisé pour les transactions en FCFA (XOF / XAF) et les systèmes fiscaux locaux.',
}
