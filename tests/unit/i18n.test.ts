import fs from 'node:fs'
import path from 'node:path'
import IntlMessageFormat from 'intl-messageformat'
import { describe, expect, it } from 'vitest'
import { intlLocales, isLocale, locales, matchAcceptLanguage, type AppLocale } from '@/i18n/config'

type Tree = { [k: string]: string | string[] | Tree }

/** Aplatit { a: { b: 'x' } } en { 'a.b': 'x' } */
function flatten(tree: Tree, prefix = ''): Record<string, string | string[]> {
  return Object.entries(tree).reduce<Record<string, string | string[]>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string' || Array.isArray(v)) acc[key] = v
    else Object.assign(acc, flatten(v, key))
    return acc
  }, {})
}

// Variables ICU de premier niveau : {name}, {count, plural, …} — le texte des branches est ignoré
function variables(msg: string | string[]) {
  const text = String(msg)
  const found = new Set<string>()
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) {
        const m = /^\{(\w+)\s*[,}]/.exec(text.slice(i))
        if (m) found.add(m[1])
      }
      depth++
    } else if (text[i] === '}') depth--
  }
  return Array.from(found).sort()
}

const dir = path.resolve(__dirname, '../../messages')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
const dictionaries = Object.fromEntries(
  files.map((f) => [f.replace('.json', ''), flatten(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')))])
) as Record<string, Record<string, string | string[]>>
const reference = dictionaries.fr
const referenceKeys = Object.keys(reference).sort()

describe('traductions', () => {
  it('chaque langue déclarée a un dictionnaire, et inversement', () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...locales].sort())
    for (const code of Object.keys(dictionaries)) expect(isLocale(code), code).toBe(true)
  })

  for (const locale of locales.filter((l) => l !== 'fr')) {
    describe(locale, () => {
      const dict = dictionaries[locale] ?? {}

      it('a exactement les mêmes clés que le français', () => {
        const keys = Object.keys(dict).sort()
        expect(referenceKeys.filter((k) => !keys.includes(k)), 'clés manquantes').toEqual([])
        expect(keys.filter((k) => !referenceKeys.includes(k)), 'clés en trop').toEqual([])
      })

      it('garde les mêmes variables dans chaque message', () => {
        for (const [key, msg] of Object.entries(reference)) {
          if (dict[key] === undefined) continue
          expect(variables(dict[key]), key).toEqual(variables(msg))
          if (Array.isArray(msg)) expect(Array.isArray(dict[key]), key).toBe(true)
        }
      })

      it('chaque message est une syntaxe ICU valide et non vide', () => {
        for (const [key, msg] of Object.entries(dict)) {
          for (const m of Array.isArray(msg) ? msg : [msg]) {
            expect(m.trim(), key).not.toBe('')
            expect(() => new IntlMessageFormat(m, intlLocales[locale as AppLocale]), `${locale}:${key}`).not.toThrow()
          }
        }
      })
    })
  }
})

describe('matchAcceptLanguage', () => {
  it('choisit la langue préférée disponible', () => {
    expect(matchAcceptLanguage('en-GB,en;q=0.9,fr;q=0.8')).toBe('en')
    expect(matchAcceptLanguage('fr-SN,fr;q=0.9')).toBe('fr')
    expect(matchAcceptLanguage('pt-BR,pt;q=0.9')).toBe('pt')
    expect(matchAcceptLanguage('sw-KE')).toBe('sw')
  })
  it('respecte les poids q', () => {
    expect(matchAcceptLanguage('en;q=0.4,fr;q=0.9')).toBe('fr')
  })
  it('revient au français par défaut', () => {
    expect(matchAcceptLanguage(null)).toBe('fr')
    expect(matchAcceptLanguage('tlh,qya')).toBe('fr')
  })
})
