import type { Tone } from './ui/tones'

// Contenu de la landing page : tous les textes au même endroit, les composants ne font que l'afficher.
// Règle : n'annoncer que ce que l'app fait réellement (pas de chiffres ni d'avis inventés).
// Pour ajouter de vrais témoignages clients, remplir `testimonials.items` : la section s'affiche alors.

export const ROUTES = { login: '/login', signup: '/signup' } as const

export const brand = {
  name: 'iziFacture',
  initials: 'iF',
  region: 'Afrique',
}

export const nav = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Pourquoi nous', href: '#problemes' },
  { label: 'Comment ça marche', href: '#comment-ca-marche' },
  { label: 'FAQ', href: '#faq' },
]

export const cta = {
  login: 'Se connecter',
  start: 'Commencer gratuitement',
  demo: 'Voir l’aperçu',
}

export const hero = {
  announcement: 'Fini la galère sur Word et Excel',
  title: ['Fini les factures bricolées', 'sur Word et Excel.'],
  // Les segments `strong` sont mis en gras
  subtitle: [
    { text: 'La facturation pensée pour les entrepreneurs africains : facturez en ' },
    { text: 'FCFA', strong: true },
    { text: ', laissez la ' },
    { text: 'TVA', strong: true },
    { text: ' se calculer toute seule et suivez chaque paiement jusqu’au dernier franc.' },
  ],
  highlightsLabel: 'Conçu pour vos usages du quotidien',
  highlights: [
    { name: 'Francs CFA (XOF & XAF)', dot: 'bg-blue-500' },
    { name: 'Paiements Mobile Money', dot: 'bg-orange-500' },
    { name: 'Partage WhatsApp', dot: 'bg-emerald-600' },
    { name: 'PDF professionnels', dot: 'bg-indigo-500' },
  ],
}

// Maquette illustrative de l'app (montants fictifs)
export const mockup = {
  floating: [
    { tone: 'emerald', symbol: '✓', label: 'Paiement enregistré', value: '+ 1 180 000 FCFA', detail: 'Mobile Money' },
    { tone: 'blue', symbol: '18%', label: 'TVA', value: 'Calculée automatiquement', detail: 'Taux modifiable' },
  ] satisfies { tone: Tone; symbol: string; label: string; value: string; detail: string }[],
  windowTitle: 'Tableau de bord — Entreprise SA (Abidjan)',
  currency: 'Devise : FCFA (XOF)',
  caption: 'Aperçu illustratif',
  metrics: [
    { label: 'Montant facturé (6 derniers mois)', value: '6 050 000 FCFA', note: '12 factures émises', valueClass: 'text-ink', noteClass: 'text-slate-500' },
    { label: 'Montant encaissé', value: '4 850 000 FCFA', note: 'Paiements partiels inclus', valueClass: 'text-emerald-600', noteClass: 'text-emerald-600' },
    { label: 'Reste à encaisser', value: '1 200 000 FCFA', note: '1 facture en retard', valueClass: 'text-amber-600', noteClass: 'text-rose-600' },
  ],
  invoice: {
    reference: 'Facture FAC-2026-0084',
    title: 'Prestation Conseil & Stratégie Digitale',
    client: 'Client : Groupe Horizon SARL • Dakar, Sénégal',
    status: 'Payée',
    lines: [
      { label: 'Honoraires mensuels prestation digitale', amount: '1 000 000 FCFA' },
      { label: 'TVA 18 %', amount: '180 000 FCFA', badge: 'Auto' },
    ],
    totalLabel: 'Total TTC',
    total: '1 180 000 FCFA',
    paymentsLabel: 'Modalités de paiement :',
    payments: 'Mobile Money • Virement • Espèces',
    receipt: 'Télécharger le PDF →',
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
      title: 'Factures peu professionnelles & perte de crédibilité',
      text: 'Fichiers Word déformés, mise en page aléatoire, informations manquantes. Vos clients, surtout les grands comptes, hésitent à valider vos factures et retardent leurs paiements.',
      impact: 'Image dégradée auprès de vos clients',
    },
    {
      tone: 'amber',
      symbol: '%',
      title: 'Calculs manuels et erreurs de TVA',
      text: 'Erreurs de calcul sur la TVA, arrondis mal gérés, confusions entre montants HT et TTC. Chaque erreur se paie en corrections, en litiges et en temps perdu avec la comptabilité.',
      impact: 'Risques fiscaux et litiges avec la comptabilité',
    },
    {
      tone: 'purple',
      symbol: '⌛',
      title: 'Paiements difficiles à suivre',
      text: 'Qui a payé, qui a payé une partie, quelle facture a dépassé son échéance ? Les justificatifs de virements et de Mobile Money s’éparpillent dans WhatsApp et votre trésorerie reste floue.',
      impact: 'Une trésorerie difficile à piloter',
    },
  ] satisfies { tone: Tone; symbol: string; title: string; text: string; impact: string }[],
}

export const features = {
  eyebrow: 'Simplicité & Puissance',
  title: 'Tout ce dont vous avez besoin pour facturer sereinement',
  subtitle: 'Une application pensée pour le contexte économique et les usages de l’Afrique francophone.',
  items: [
    {
      tone: 'blue',
      symbol: '⚡',
      eyebrow: 'Création rapide',
      title: 'Des factures professionnelles en quelques clics',
      text: 'Votre logo, vos coordonnées et votre numéro fiscal sur chaque facture, avec une numérotation automatique et continue. Téléchargez le PDF, imprimez, ou envoyez un lien sécurisé par WhatsApp ou email.',
      highlight: '📄 PDF, impression et lien en ligne',
      highlightNote: 'Prêt à envoyer',
    },
    {
      tone: 'emerald',
      symbol: '18%',
      eyebrow: 'Calculs automatiques',
      title: 'La TVA calculée pour vous',
      text: 'Fixez votre taux par défaut (18 % au départ), ajustez-le ligne par ligne si besoin, ajoutez une remise : les totaux HT, TVA et TTC se calculent tout seuls, sans calculatrice.',
      highlight: '🧮 HT, TVA et TTC toujours justes',
      highlightNote: 'Zéro erreur de calcul',
    },
    {
      tone: 'amber',
      symbol: '💰',
      eyebrow: 'Trésorerie',
      title: 'Suivi des paiements',
      text: 'Enregistrez les paiements complets ou partiels (Mobile Money, virement, espèces, carte) : le reste à payer se met à jour et les factures dont l’échéance est dépassée passent automatiquement « en retard ».',
      highlight: '📈 Tableau de bord facturé / encaissé',
      highlightNote: 'Trésorerie claire',
    },
    {
      tone: 'indigo',
      symbol: '👥',
      eyebrow: 'Clients',
      title: 'Gestion de clients intégrée',
      text: 'Un répertoire de tous vos clients avec, pour chacun, l’historique des factures, le total facturé et le reste à encaisser. Recherche instantanée et export de vos factures en CSV.',
      highlight: '📊 Historique et solde par client',
      highlightNote: 'Vue d’ensemble',
    },
  ] satisfies { tone: Tone; symbol: string; eyebrow: string; title: string; text: string; highlight: string; highlightNote: string }[],
}

export const stats = [
  { value: 'XOF & XAF', label: 'Francs CFA natifs', text: 'Ainsi que l’euro, le dollar, le naira, le cedi et d’autres devises' },
  { value: '18 %', label: 'TVA par défaut', text: 'Modifiable dans vos paramètres et ajustable ligne par ligne' },
  { value: '40 langues', label: 'Interface multilingue', text: 'Français, anglais, wolof, swahili, haoussa, lingala…' },
]

export const steps = {
  eyebrow: 'Comment ça marche',
  title: 'Votre première facture en trois étapes',
  items: [
    { title: 'Créez votre compte', text: 'Inscrivez-vous par email ou avec Google, puis renseignez votre entreprise : nom, logo, devise et taux de TVA.' },
    { title: 'Rédigez la facture', text: 'Choisissez le client, ajoutez vos lignes : les totaux se calculent pendant que vous tapez, avec un aperçu en direct.' },
    { title: 'Envoyez et encaissez', text: 'Partagez la facture par WhatsApp, email ou lien, puis enregistrez les paiements au fur et à mesure.' },
  ],
}

export const testimonials = {
  eyebrow: 'Avis clients',
  title: 'Ils ont simplifié leur facturation',
  // Vide tant qu'il n'y a pas d'avis réels : la section est alors masquée.
  items: [] as { quote: string; name: string; role: string; initials: string; avatar: string }[],
}

export const faq = {
  eyebrow: 'Questions fréquentes',
  title: 'Tout ce que vous devez savoir',
  items: [
    {
      question: 'Est-ce adapté si mon entreprise n’est pas assujettie à la TVA ?',
      answer:
        'Oui. Mettez votre taux de TVA par défaut à 0 % dans les paramètres (ou ajustez-le ligne par ligne), puis ajoutez la mention d’exonération qui vous concerne dans le pied de page de vos factures.',
    },
    {
      question: 'Puis-je facturer à la fois en XOF (UEMOA) et en XAF (CEMAC) ?',
      answer:
        'Oui. iziFacture gère le franc CFA d’Afrique de l’Ouest (XOF) et d’Afrique centrale (XAF), ainsi que l’euro, le dollar, le naira, le cedi, le shilling kényan, le dirham, le franc guinéen et le franc congolais.',
    },
    {
      question: 'Comment envoyer ma facture par WhatsApp ?',
      answer:
        'Depuis une facture, « Partager sur WhatsApp » ouvre WhatsApp avec un message prêt à envoyer contenant le lien sécurisé de la facture. Votre client la consulte en ligne, l’imprime ou télécharge le PDF, avec vos modalités de paiement (numéro Mobile Money, coordonnées bancaires…).',
    },
    {
      question: 'Mes données sont-elles protégées ?',
      answer:
        'Chaque entreprise n’accède qu’à ses propres données : l’isolation est appliquée directement par la base de données, pas seulement par l’interface. Les liens de factures partagés sont des liens uniques et impossibles à deviner.',
    },
  ],
}

export const finalCta = {
  badge: 'Prêt en quelques minutes',
  title: 'Prêt à moderniser votre facturation dès aujourd’hui ?',
  subtitle: 'Créez votre compte, configurez votre entreprise et envoyez votre première facture professionnelle aujourd’hui.',
  button: 'Créer ma première facture gratuitement',
  note: 'Sans carte bancaire • Configuration en quelques minutes',
}

export const footer = {
  tagline: 'Le logiciel de facturation simple et rapide pour les professionnels, PME et indépendants en Afrique.',
  columns: [
    {
      title: 'Produit',
      links: [
        { label: 'Facturation en FCFA', href: '#fonctionnalites' },
        { label: 'TVA automatique', href: '#fonctionnalites' },
        { label: 'Partage WhatsApp', href: '#fonctionnalites' },
        { label: 'Suivi des paiements', href: '#fonctionnalites' },
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
        { label: 'Sécurité des données', href: '#faq' },
        { label: 'support@izifacture.com', href: 'mailto:support@izifacture.com' },
      ],
    },
  ] as { title: string; links: { label: string; href?: string }[] }[],
  copyright: `© ${new Date().getFullYear()} iziFacture. Tous droits réservés.`,
  notice: 'Optimisé pour la facturation en FCFA (XOF / XAF).',
}
