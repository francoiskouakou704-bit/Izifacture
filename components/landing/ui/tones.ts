// Palette des pastilles et accents. Classes écrites en entier pour que Tailwind les détecte.

export type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'indigo'

/** Fond + texte d'une pastille d'icône */
export const toneTile: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-600',
  purple: 'bg-purple-100 text-purple-700',
  indigo: 'bg-indigo-50 text-indigo-600',
}

/** Couleur de texte d'accent (sur-titres, notes) */
export const toneText: Record<Tone, string> = {
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-700',
  rose: 'text-rose-600',
  purple: 'text-purple-700',
  indigo: 'text-indigo-600',
}
